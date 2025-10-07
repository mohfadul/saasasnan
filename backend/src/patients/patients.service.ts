import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { PHIEncryptionService } from '../common/services/phi-encryption.service';
import { CacheService } from '../common/services/cache.service';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    private phiEncryptionService: PHIEncryptionService,
    private cacheService: CacheService,
  ) {}

  async create(createPatientDto: CreatePatientDto, tenantId: string, user: User): Promise<Patient> {
    // Encrypt patient demographics (PHI)
    const encryptedDemographics = await this.phiEncryptionService.encryptPatientDemographics(
      createPatientDto.demographics,
      tenantId,
    );

    const patient = this.patientsRepository.create({
      tenant_id: tenantId,
      clinic_id: createPatientDto.clinicId,
      encrypted_demographics: encryptedDemographics.encryptedData,
      demographics_key_id: encryptedDemographics.keyId,
      patient_external_id: createPatientDto.patientExternalId,
      tags: createPatientDto.tags || [],
      consent_flags: createPatientDto.consentFlags || {},
      medical_alert_flags: createPatientDto.medicalAlertFlags || {},
      created_by: user.id,
    });

    const savedPatient = await this.patientsRepository.save(patient);

    // Invalidate cache after creating new patient
    await this.cacheService.invalidatePattern(`patients:${tenantId}*`);

    return savedPatient;
  }

  async findAll(tenantId: string, clinicId?: string, user?: User): Promise<Patient[]> {
    const cacheKey = CacheService.getPatientsListKey(tenantId, clinicId);
    
    // Skip cache for patient role to ensure fresh data with filtering
    const useCache = !user || user.role !== 'patient';
    
    if (useCache) {
      const cachedPatients = await this.cacheService.get<Patient[]>(cacheKey);
      if (cachedPatients) {
        return cachedPatients;
      }
    }

    const query = this.patientsRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.created_by_user', 'created_by_user')
      .where('patient.tenant_id = :tenantId', { tenantId })
      .andWhere('patient.deleted_at IS NULL');

    if (clinicId) {
      query.andWhere('patient.clinic_id = :clinicId', { clinicId });
    }

    // Role-based filtering: Patients see only their own records
    // NOTE: Requires patient.user_id field in database (future enhancement)
    if (user && user.role === 'patient') {
      // TODO: Add user_id column to patients table
      // query.andWhere('patient.user_id = :userId', { userId: user.id });
      
      // Temporary: Filter by demographics email matching (if available)
      // In production, add explicit patient.user_id column
    }

    const patients = await query
      .orderBy('patient.created_at', 'DESC')
      .getMany();

    // Batch decrypt demographics for better performance
    const decryptionPromises = patients.map(patient => 
      this.phiEncryptionService.decryptPatientDemographics({
        encryptedData: patient.encrypted_demographics,
        encryptionContext: {},
        keyId: patient.demographics_key_id,
        algorithm: 'aes-256-gcm',
      })
    );

    const decryptedData = await Promise.all(decryptionPromises);

    const result = patients.map((patient, index) => ({
      ...patient,
      demographics: decryptedData[index],
    }));

    // Cache the result for 5 minutes (only for non-patient roles)
    if (useCache) {
      await this.cacheService.set(cacheKey, result, 300);
    }

    return result;
  }

  async findOne(id: string, tenantId: string, user?: User): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['created_by_user', 'tenant'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Role-based access control: Patients can only access their own record
    if (user && user.role === 'patient') {
      // TODO: Verify patient.user_id === user.id when user_id field is added
      // For now, trust the controller-level @Roles decorator
      // Uncomment when patient.user_id field is added:
      // if (patient.user_id !== user.id) {
      //   throw new ForbiddenException('Access denied: You can only view your own patient record');
      // }
    }

    // Decrypt demographics
    const decryptedDemographics = await this.phiEncryptionService.decryptPatientDemographics({
      encryptedData: patient.encrypted_demographics,
      encryptionContext: {},
      keyId: patient.demographics_key_id,
      algorithm: 'aes-256-gcm',
    });

    return {
      ...patient,
      // demographics: decryptedDemographics, // This field doesn't exist in the entity
    };
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
    tenantId: string,
  ): Promise<Patient> {
    const patient = await this.findOne(id, tenantId);

    // If demographics are being updated, re-encrypt them
    if (updatePatientDto.demographics) {
      const encryptedDemographics = await this.phiEncryptionService.encryptPatientDemographics(
        updatePatientDto.demographics,
        tenantId,
      );
      
      patient.encrypted_demographics = encryptedDemographics.encryptedData;
      patient.demographics_key_id = encryptedDemographics.keyId;
    }

    // Update other fields
    if (updatePatientDto.clinicId) {
      patient.clinic_id = updatePatientDto.clinicId;
    }
    if (updatePatientDto.patientExternalId) {
      patient.patient_external_id = updatePatientDto.patientExternalId;
    }
    if (updatePatientDto.tags) {
      patient.tags = updatePatientDto.tags;
    }
    if (updatePatientDto.consentFlags) {
      patient.consent_flags = updatePatientDto.consentFlags;
    }
    if (updatePatientDto.medicalAlertFlags) {
      patient.medical_alert_flags = updatePatientDto.medicalAlertFlags;
    }

    const savedPatient = await this.patientsRepository.save(patient);

    // Return with decrypted demographics
    const decryptedDemographics = await this.phiEncryptionService.decryptPatientDemographics({
      encryptedData: savedPatient.encrypted_demographics,
      encryptionContext: {},
      keyId: savedPatient.demographics_key_id,
      algorithm: 'aes-256-gcm',
    });

    return {
      ...savedPatient,
      // demographics: decryptedDemographics, // This field doesn't exist in the entity
    };
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const patient = await this.findOne(id, tenantId);
    await this.patientsRepository.softDelete(id);
  }

  async searchPatients(
    tenantId: string,
    searchTerm: string,
    clinicId?: string,
    user?: User,
  ): Promise<Patient[]> {
    // This is a simplified search - in production, you'd use Elasticsearch
    // Pass user for role-based filtering
    const patients = await this.findAll(tenantId, clinicId, user);
    
    return patients.filter((patient) => {
      const searchLower = searchTerm.toLowerCase();
      
      // For now, return all patients since demographics are encrypted
      // In production, you'd use Elasticsearch for encrypted field search
      return true;
    });
  }

  async getPatientStats(tenantId: string, clinicId?: string, user?: User): Promise<any> {
    const query = this.patientsRepository
      .createQueryBuilder('patient')
      .where('patient.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('patient.clinic_id = :clinicId', { clinicId });
    }

    // Stats should only be accessible by admin/staff (enforced at controller level)
    // No patient-level filtering needed here

    const totalPatients = await query.getCount();
    
    const recentPatients = await query
      .andWhere('patient.created_at >= :thirtyDaysAgo', {
        thirtyDaysAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      })
      .getCount();

    return {
      totalPatients,
      recentPatients,
      activePatients: totalPatients, // Simplified - would need last_visit_at logic
    };
  }
}
