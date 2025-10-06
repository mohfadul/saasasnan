import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientsService } from '../../src/patients/patients.service';
import { Patient } from '../../src/patients/entities/patient.entity';
import { PHIEncryptionService } from '../../src/common/services/phi-encryption.service';
import { CacheService } from '../../src/common/services/cache.service';

describe('Database Performance Tests', () => {
  let patientsService: PatientsService;
  let patientRepository: Repository<Patient>;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: PHIEncryptionService,
          useValue: {
            decryptPatientDemographics: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidatePattern: jest.fn(),
          },
        },
      ],
    }).compile();

    patientsService = module.get<PatientsService>(PatientsService);
    patientRepository = module.get<Repository<Patient>>(getRepositoryToken(Patient));
    cacheService = module.get<CacheService>(CacheService);
  });

  describe('Patient List Performance', () => {
    it('should load patients list efficiently with caching', async () => {
      const mockPatients = Array.from({ length: 100 }, (_, i) => ({
        id: `patient-${i}`,
        tenant_id: 'test-tenant',
        encrypted_demographics: Buffer.from('encrypted-data'),
        demographics_key_id: 'key-123',
        created_at: new Date(),
      }));

      // Mock cache miss
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      
      // Mock database query
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPatients),
      };
      
      jest.spyOn(patientRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      
      // Mock decryption service
      jest.spyOn(patientsService['phiEncryptionService'], 'decryptPatientDemographics')
        .mockResolvedValue({ firstName: 'John', lastName: 'Doe' });

      const startTime = Date.now();
      
      const result = await patientsService.findAll('test-tenant');
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should use cache when available', async () => {
      const cachedPatients = [{ id: 'cached-patient', demographics: { firstName: 'Jane' } }];
      
      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedPatients);

      const startTime = Date.now();
      
      const result = await patientsService.findAll('test-tenant');
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).toEqual(cachedPatients);
      expect(duration).toBeLessThan(50); // Cache should be very fast
      expect(patientRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('Cache Performance', () => {
    it('should handle cache operations efficiently', async () => {
      const testData = { test: 'data', timestamp: Date.now() };
      
      // Test set operation
      const setStartTime = Date.now();
      await cacheService.set('test-key', testData, 300);
      const setDuration = Date.now() - setStartTime;
      
      expect(setDuration).toBeLessThan(100);
      
      // Test get operation
      const getStartTime = Date.now();
      const result = await cacheService.get('test-key');
      const getDuration = Date.now() - getStartTime;
      
      expect(result).toEqual(testData);
      expect(getDuration).toBeLessThan(50);
    });
  });
});
