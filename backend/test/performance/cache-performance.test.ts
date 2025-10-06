import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../src/common/services/cache.service';

// Mock Redis
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    mget: jest.fn(),
    pipeline: jest.fn(() => ({
      setex: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    })),
    keys: jest.fn(),
    ttl: jest.fn(),
    expire: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  };
  return jest.fn(() => mockRedis);
});

describe('Cache Performance Tests', () => {
  let cacheService: CacheService;
  let mockRedis: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                REDIS_PASSWORD: '',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    cacheService = module.get<CacheService>(CacheService);
    
    // Get the mocked Redis instance
    const Redis = require('ioredis');
    mockRedis = new Redis();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get data efficiently', async () => {
      const testData = { id: '123', name: 'Test Patient', demographics: { firstName: 'John' } };
      
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const startTime = Date.now();
      
      // Test set operation
      await cacheService.set('test-key', testData, 300);
      
      // Test get operation
      const result = await cacheService.get('test-key');
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).toEqual(testData);
      expect(duration).toBeLessThan(100); // Should be very fast
      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(testData));
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should handle cache misses gracefully', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.get('non-existent-key');

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('non-existent-key');
    });

    it('should delete keys efficiently', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await cacheService.del('test-key');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('Batch Operations', () => {
    it('should handle multiple get operations efficiently', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = [
        JSON.stringify({ data: 'value1' }),
        JSON.stringify({ data: 'value2' }),
        null,
      ];
      
      mockRedis.mget.mockResolvedValue(values);

      const startTime = Date.now();
      const results = await cacheService.getMany(keys);
      const endTime = Date.now();

      expect(results).toEqual([
        { data: 'value1' },
        { data: 'value2' },
        null,
      ]);
      expect(endTime - startTime).toBeLessThan(50);
      expect(mockRedis.mget).toHaveBeenCalledWith(...keys);
    });

    it('should handle multiple set operations efficiently', async () => {
      const keyValuePairs = [
        { key: 'key1', value: { data: 'value1' }, ttl: 300 },
        { key: 'key2', value: { data: 'value2' }, ttl: 600 },
      ];

      const mockPipeline = {
        setex: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([['OK'], ['OK']]),
      };
      
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const startTime = Date.now();
      const result = await cacheService.setMany(keyValuePairs);
      const endTime = Date.now();

      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(100);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const tenantId = 'tenant-123';
      const patientId = 'patient-456';
      const clinicId = 'clinic-789';

      const patientKey = CacheService.getPatientKey(tenantId, patientId);
      const patientsListKey = CacheService.getPatientsListKey(tenantId, clinicId);
      const dashboardKey = CacheService.getDashboardKey(tenantId, { start_date: '2023-01-01' });

      expect(patientKey).toBe('patient:tenant-123:patient-456');
      expect(patientsListKey).toBe('patients:tenant-123:clinic:clinic-789');
      expect(dashboardKey).toContain('dashboard:tenant-123:');
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });

    it('should handle serialization errors gracefully', async () => {
      const circularObject = { name: 'test' };
      circularObject['self'] = circularObject; // Create circular reference

      const result = await cacheService.set('test-key', circularObject);

      expect(result).toBe(false); // Should return false on error
    });
  });
});
