import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientsService } from '../../../src/patients/patients.service';
import { Patient } from '../../../src/patients/entities/patient.entity';
import { Tenant } from '../../../src/tenants/entities/tenant.entity';
import { User } from '../../../src/auth/entities/user.entity';
import { PhiEncryptionService } from '../../../src/common/services/phi-encryption.service';
import { CreatePatientDto } from '../../../src/patients/dto/create-patient.dto';
import { UpdatePatientDto } from '../../../src/patients/dto/update-patient.dto';

describe('PatientsService', () => {
  let service: PatientsService;
  let patientRepository: Repository<Patient>;
  let tenantRepository: Repository<Tenant>;
  let userRepository: Repository<User>;
  let phiEncryptionService: PhiEncryptionService;

  const mockPatient = {
    id: 'test-patient-id',
    tenant_id: 'test-tenant-id',
    clinic_id: 'test-clinic-id',
    encrypted_demographics: Buffer.from('encrypted-data'),
    demographics_key_id: 'test-key-id',
    patient_external_id: 'EXT-001',
    tags: ['vip'],
    consent_flags: { marketing: true },
    medical_alert_flags: { allergies: true },
    created_by: 'test-user-id',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockTenant = {
    id: 'test-tenant-id',
    name: 'Test Clinic',
    subdomain: 'test-clinic',
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@testclinic.com',
    role: 'clinic_admin',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
              getOne: jest.fn(),
              getCount: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: PhiEncryptionService,
          useValue: {
            encryptDemographics: jest.fn(),
            decryptDemographics: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    patientRepository = module.get<Repository<Patient>>(getRepositoryToken(Patient));
    tenantRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    phiEncryptionService = module.get<PhiEncryptionService>(PhiEncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new patient', async () => {
      const createPatientDto: CreatePatientDto = {
        clinic_id: 'test-clinic-id',
        patient_external_id: 'EXT-001',
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          phone_number: '+1234567890',
          email: 'john.doe@example.com',
        },
        tags: ['vip'],
        consent_flags: { marketing: true },
        medical_alert_flags: { allergies: true },
      };

      const encryptedData = Buffer.from('encrypted-demographics');
      const keyId = 'test-key-id';

      jest.spyOn(phiEncryptionService, 'encryptDemographics').mockResolvedValue({
        encryptedData,
        keyId,
      });

      jest.spyOn(patientRepository, 'create').mockReturnValue(mockPatient as any);
      jest.spyOn(patientRepository, 'save').mockResolvedValue(mockPatient as any);

      const result = await service.create('test-tenant-id', 'test-user-id', createPatientDto);

      expect(phiEncryptionService.encryptDemographics).toHaveBeenCalledWith(createPatientDto.demographics);
      expect(patientRepository.create).toHaveBeenCalledWith({
        tenant_id: 'test-tenant-id',
        clinic_id: 'test-clinic-id',
        patient_external_id: 'EXT-001',
        encrypted_demographics: encryptedData,
        demographics_key_id: keyId,
        tags: ['vip'],
        consent_flags: { marketing: true },
        medical_alert_flags: { allergies: true },
        created_by: 'test-user-id',
      });
      expect(patientRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockPatient);
    });

    it('should throw error if encryption fails', async () => {
      const createPatientDto: CreatePatientDto = {
        clinic_id: 'test-clinic-id',
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
        },
      };

      jest.spyOn(phiEncryptionService, 'encryptDemographics').mockRejectedValue(new Error('Encryption failed'));

      await expect(service.create('test-tenant-id', 'test-user-id', createPatientDto))
        .rejects.toThrow('Encryption failed');
    });
  });

  describe('findAll', () => {
    it('should return all patients for a tenant', async () => {
      const patients = [mockPatient];
      jest.spyOn(patientRepository, 'find').mockResolvedValue(patients as any);

      const result = await service.findAll('test-tenant-id');

      expect(patientRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: 'test-tenant-id' },
        relations: ['tenant', 'created_by_user'],
      });
      expect(result).toEqual(patients);
    });

    it('should apply filters when provided', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPatient]),
        getCount: jest.fn().mockResolvedValue(1),
      };

      jest.spyOn(patientRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await service.findAll('test-tenant-id', {
        clinic_id: 'test-clinic-id',
        tags: ['vip'],
        limit: 10,
        offset: 0,
      });

      expect(queryBuilder.where).toHaveBeenCalledWith('patient.tenant_id = :tenantId', { tenantId: 'test-tenant-id' });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('patient.clinic_id = :clinicId', { clinicId: 'test-clinic-id' });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('patient.tags @> :tags', { tags: JSON.stringify(['vip']) });
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual({
        patients: [mockPatient],
        total: 1,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('findOne', () => {
    it('should return a patient by ID', async () => {
      jest.spyOn(patientRepository, 'findOne').mockResolvedValue(mockPatient as any);
      jest.spyOn(phiEncryptionService, 'decryptDemographics').mockResolvedValue({
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        phone_number: '+1234567890',
        email: 'john.doe@example.com',
      });

      const result = await service.findOne('test-patient-id', 'test-tenant-id');

      expect(patientRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-patient-id', tenant_id: 'test-tenant-id' },
        relations: ['tenant', 'created_by_user', 'insurances'],
      });
      expect(phiEncryptionService.decryptDemographics).toHaveBeenCalledWith(
        mockPatient.encrypted_demographics,
        mockPatient.demographics_key_id,
      );
      expect(result).toEqual({
        ...mockPatient,
        demographics: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          phone_number: '+1234567890',
          email: 'john.doe@example.com',
        },
      });
    });

    it('should throw error if patient not found', async () => {
      jest.spyOn(patientRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id', 'test-tenant-id'))
        .rejects.toThrow('Patient not found');
    });
  });

  describe('update', () => {
    it('should update a patient', async () => {
      const updatePatientDto: UpdatePatientDto = {
        demographics: {
          first_name: 'Jane',
          last_name: 'Doe',
        },
        tags: ['vip', 'premium'],
      };

      const encryptedData = Buffer.from('new-encrypted-data');
      const keyId = 'new-key-id';

      jest.spyOn(service, 'findOne').mockResolvedValue(mockPatient as any);
      jest.spyOn(phiEncryptionService, 'encryptDemographics').mockResolvedValue({
        encryptedData,
        keyId,
      });
      jest.spyOn(patientRepository, 'save').mockResolvedValue({
        ...mockPatient,
        encrypted_demographics: encryptedData,
        demographics_key_id: keyId,
        tags: ['vip', 'premium'],
      } as any);

      const result = await service.update('test-patient-id', 'test-tenant-id', updatePatientDto);

      expect(phiEncryptionService.encryptDemographics).toHaveBeenCalled();
      expect(patientRepository.save).toHaveBeenCalled();
      expect(result.tags).toEqual(['vip', 'premium']);
    });

    it('should throw error if patient not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new Error('Patient not found'));

      await expect(service.update('non-existent-id', 'test-tenant-id', {}))
        .rejects.toThrow('Patient not found');
    });
  });

  describe('remove', () => {
    it('should soft delete a patient', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPatient as any);
      jest.spyOn(patientRepository, 'save').mockResolvedValue({
        ...mockPatient,
        deleted_at: new Date(),
      } as any);

      const result = await service.remove('test-patient-id', 'test-tenant-id');

      expect(patientRepository.save).toHaveBeenCalledWith({
        ...mockPatient,
        deleted_at: expect.any(Date),
      });
      expect(result.deleted_at).toBeDefined();
    });

    it('should throw error if patient not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new Error('Patient not found'));

      await expect(service.remove('non-existent-id', 'test-tenant-id'))
        .rejects.toThrow('Patient not found');
    });
  });

  describe('restore', () => {
    it('should restore a soft deleted patient', async () => {
      const deletedPatient = { ...mockPatient, deleted_at: new Date() };
      jest.spyOn(service, 'findOne').mockResolvedValue(deletedPatient as any);
      jest.spyOn(patientRepository, 'save').mockResolvedValue({
        ...deletedPatient,
        deleted_at: null,
      } as any);

      const result = await service.restore('test-patient-id', 'test-tenant-id');

      expect(patientRepository.save).toHaveBeenCalledWith({
        ...deletedPatient,
        deleted_at: null,
      });
      expect(result.deleted_at).toBeNull();
    });
  });
});
