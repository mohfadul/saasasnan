import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsuranceProvider } from './entities/insurance-provider.entity';
import { PatientInsurance } from './entities/patient-insurance.entity';
import { Patient } from '../patients/entities/patient.entity';

export interface CreateInsuranceProviderDto {
  name: string;
  contactInfo: Record<string, any>;
  coverageDetails?: Record<string, any>;
  copayPercentage?: number;
  status?: string;
}

export interface UpdateInsuranceProviderDto {
  name?: string;
  contactInfo?: Record<string, any>;
  coverageDetails?: Record<string, any>;
  copayPercentage?: number;
  status?: string;
}

export interface CreatePatientInsuranceDto {
  patientId: string;
  insuranceProviderId: string;
  policyNumber: string;
  groupNumber?: string;
  effectiveDate?: string;
  expirationDate?: string;
  copayAmount?: number;
  isPrimary?: boolean;
  status?: string;
}

@Injectable()
export class InsuranceService {
  constructor(
    @InjectRepository(InsuranceProvider)
    private insuranceProvidersRepository: Repository<InsuranceProvider>,
    @InjectRepository(PatientInsurance)
    private patientInsuranceRepository: Repository<PatientInsurance>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
  ) {}

  // Insurance Provider methods
  async createInsuranceProvider(createDto: CreateInsuranceProviderDto, tenantId: string): Promise<InsuranceProvider> {
    const provider = this.insuranceProvidersRepository.create({
      tenant_id: tenantId,
      name: createDto.name,
      contact_info: createDto.contactInfo,
      coverage_details: createDto.coverageDetails || {},
      copay_percentage: createDto.copayPercentage || 0,
      status: createDto.status || 'active',
    });

    return await this.insuranceProvidersRepository.save(provider);
  }

  async findAllInsuranceProviders(tenantId: string, status?: string): Promise<InsuranceProvider[]> {
    const query = this.insuranceProvidersRepository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.patientInsurances', 'patientInsurances')
      .where('provider.tenant_id = :tenantId', { tenantId });

    if (status) {
      query.andWhere('provider.status = :status', { status });
    }

    return await query
      .orderBy('provider.name', 'ASC')
      .getMany();
  }

  async findOneInsuranceProvider(id: string, tenantId: string): Promise<InsuranceProvider> {
    const provider = await this.insuranceProvidersRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['patientInsurances', 'patientInsurances.patient'],
    });

    if (!provider) {
      throw new NotFoundException(`Insurance provider with ID ${id} not found`);
    }

    return provider;
  }

  async updateInsuranceProvider(id: string, updateDto: UpdateInsuranceProviderDto, tenantId: string): Promise<InsuranceProvider> {
    const provider = await this.findOneInsuranceProvider(id, tenantId);

    Object.assign(provider, {
      name: updateDto.name || provider.name,
      contact_info: updateDto.contactInfo || provider.contact_info,
      coverage_details: updateDto.coverageDetails || provider.coverage_details,
      copay_percentage: updateDto.copayPercentage !== undefined ? updateDto.copayPercentage : provider.copay_percentage,
      status: updateDto.status || provider.status,
    });

    return await this.insuranceProvidersRepository.save(provider);
  }

  async removeInsuranceProvider(id: string, tenantId: string): Promise<void> {
    const provider = await this.findOneInsuranceProvider(id, tenantId);
    
    // Check if provider has active patient insurances
    const activeInsurances = await this.patientInsuranceRepository.count({
      where: { insurance_provider_id: id, status: 'active' },
    });

    if (activeInsurances > 0) {
      throw new BadRequestException('Cannot delete insurance provider with active patient insurances');
    }

    await this.insuranceProvidersRepository.softDelete(id);
  }

  // Patient Insurance methods
  async createPatientInsurance(createDto: CreatePatientInsuranceDto, tenantId: string): Promise<PatientInsurance> {
    // Validate patient exists
    const patient = await this.patientsRepository.findOne({
      where: { id: createDto.patientId, tenant_id: tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Validate insurance provider exists
    const provider = await this.insuranceProvidersRepository.findOne({
      where: { id: createDto.insuranceProviderId, tenant_id: tenantId },
    });

    if (!provider) {
      throw new NotFoundException('Insurance provider not found');
    }

    // Check if this is being set as primary and if patient already has a primary insurance
    if (createDto.isPrimary) {
      const existingPrimary = await this.patientInsuranceRepository.findOne({
        where: { patient_id: createDto.patientId, is_primary: true, status: 'active' },
      });

      if (existingPrimary) {
        // Remove primary status from existing insurance
        existingPrimary.is_primary = false;
        await this.patientInsuranceRepository.save(existingPrimary);
      }
    }

    // Check if policy number already exists for this patient
    const existingPolicy = await this.patientInsuranceRepository.findOne({
      where: { patient_id: createDto.patientId, policy_number: createDto.policyNumber },
    });

    if (existingPolicy) {
      throw new BadRequestException('Patient already has insurance with this policy number');
    }

    const patientInsurance = this.patientInsuranceRepository.create({
      patient_id: createDto.patientId,
      insurance_provider_id: createDto.insuranceProviderId,
      policy_number: createDto.policyNumber,
      group_number: createDto.groupNumber,
      effective_date: createDto.effectiveDate ? new Date(createDto.effectiveDate) : null,
      expiration_date: createDto.expirationDate ? new Date(createDto.expirationDate) : null,
      copay_amount: createDto.copayAmount,
      is_primary: createDto.isPrimary || false,
      status: createDto.status || 'active',
    });

    return await this.patientInsuranceRepository.save(patientInsurance);
  }

  async getPatientInsurances(patientId: string, tenantId: string): Promise<PatientInsurance[]> {
    // Verify patient belongs to tenant
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId, tenant_id: tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return await this.patientInsuranceRepository.find({
      where: { patient_id: patientId },
      relations: ['insuranceProvider'],
      order: { is_primary: 'DESC', created_at: 'ASC' },
    });
  }

  async updatePatientInsurance(
    id: string,
    updateDto: Partial<CreatePatientInsuranceDto>,
    tenantId: string,
  ): Promise<PatientInsurance> {
    const patientInsurance = await this.patientInsuranceRepository.findOne({
      where: { id },
      relations: ['patient', 'insuranceProvider'],
    });

    if (!patientInsurance || patientInsurance.patient.tenant_id !== tenantId) {
      throw new NotFoundException('Patient insurance not found');
    }

    // Handle primary insurance changes
    if (updateDto.isPrimary && !patientInsurance.is_primary) {
      const existingPrimary = await this.patientInsuranceRepository.findOne({
        where: { patient_id: patientInsurance.patient_id, is_primary: true, status: 'active' },
      });

      if (existingPrimary) {
        existingPrimary.is_primary = false;
        await this.patientInsuranceRepository.save(existingPrimary);
      }
    }

    Object.assign(patientInsurance, {
      policy_number: updateDto.policyNumber || patientInsurance.policy_number,
      group_number: updateDto.groupNumber !== undefined ? updateDto.groupNumber : patientInsurance.group_number,
      effective_date: updateDto.effectiveDate ? new Date(updateDto.effectiveDate) : patientInsurance.effective_date,
      expiration_date: updateDto.expirationDate ? new Date(updateDto.expirationDate) : patientInsurance.expiration_date,
      copay_amount: updateDto.copayAmount !== undefined ? updateDto.copayAmount : patientInsurance.copay_amount,
      is_primary: updateDto.isPrimary !== undefined ? updateDto.isPrimary : patientInsurance.is_primary,
      status: updateDto.status || patientInsurance.status,
    });

    return await this.patientInsuranceRepository.save(patientInsurance);
  }

  async removePatientInsurance(id: string, tenantId: string): Promise<void> {
    const patientInsurance = await this.patientInsuranceRepository.findOne({
      where: { id },
      relations: ['patient'],
    });

    if (!patientInsurance || patientInsurance.patient.tenant_id !== tenantId) {
      throw new NotFoundException('Patient insurance not found');
    }

    await this.patientInsuranceRepository.softDelete(id);
  }

  async getInsuranceStats(tenantId: string): Promise<any> {
    const totalProviders = await this.insuranceProvidersRepository.count({
      where: { tenant_id: tenantId },
    });

    const activeProviders = await this.insuranceProvidersRepository.count({
      where: { tenant_id: tenantId, status: 'active' },
    });

    const totalPatientInsurances = await this.patientInsuranceRepository.count({
      where: { status: 'active' },
    });

    const primaryInsurances = await this.patientInsuranceRepository.count({
      where: { is_primary: true, status: 'active' },
    });

    const expiredInsurances = await this.patientInsuranceRepository
      .createQueryBuilder('pi')
      .leftJoin('pi.patient', 'p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('pi.expiration_date < :today', { today: new Date() })
      .andWhere('pi.status = :status', { status: 'active' })
      .getCount();

    return {
      totalProviders,
      activeProviders,
      inactiveProviders: totalProviders - activeProviders,
      totalPatientInsurances,
      primaryInsurances,
      expiredInsurances,
    };
  }
}
