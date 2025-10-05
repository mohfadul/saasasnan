import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { PHIEncryptionService } from '../common/services/phi-encryption.service';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    private phiEncryptionService: PHIEncryptionService,
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

    return await this.patientsRepository.save(patient);
  }

  async findAll(tenantId: string, clinicId?: string): Promise<Patient[]> {
    const query = this.patientsRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.created_by_user', 'created_by_user')
      .where('patient.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('patient.clinic_id = :clinicId', { clinicId });
    }

    const patients = await query
      .orderBy('patient.created_at', 'DESC')
      .getMany();

    // Decrypt demographics for each patient
    return Promise.all(
      patients.map(async (patient) => {
        const decryptedDemographics = await this.phiEncryptionService.decryptPatientDemographics({
          encryptedData: patient.encrypted_demographics,
          encryptionContext: {},
          keyId: patient.demographics_key_id,
          algorithm: 'aes-256-gcm',
        });

        return {
          ...patient,
          demographics: decryptedDemographics,
        };
      }),
    );
  }

  async findOne(id: string, tenantId: string): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['created_by_user', 'tenant'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
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
      demographics: decryptedDemographics,
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
      demographics: decryptedDemographics,
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
  ): Promise<Patient[]> {
    // This is a simplified search - in production, you'd use Elasticsearch
    const patients = await this.findAll(tenantId, clinicId);
    
    return patients.filter((patient) => {
      const demographics = patient.demographics;
      const searchLower = searchTerm.toLowerCase();
      
      return (
        demographics.firstName.toLowerCase().includes(searchLower) ||
        demographics.lastName.toLowerCase().includes(searchLower) ||
        demographics.email?.toLowerCase().includes(searchLower) ||
        demographics.phone?.includes(searchTerm)
      );
    });
  }

  async getPatientStats(tenantId: string, clinicId?: string): Promise<any> {
    const query = this.patientsRepository
      .createQueryBuilder('patient')
      .where('patient.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('patient.clinic_id = :clinicId', { clinicId });
    }

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
