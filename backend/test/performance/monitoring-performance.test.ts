import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { PerformanceInterceptor } from '../../src/common/interceptors/performance.interceptor';
import { of, throwError } from 'rxjs';

describe('Performance Monitoring Tests', () => {
  let interceptor: PerformanceInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PerformanceInterceptor],
    }).compile();

    interceptor = module.get<PerformanceInterceptor>(PerformanceInterceptor);

    // Mock request and response
    mockRequest = {
      method: 'GET',
      url: '/api/patients',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test Browser'),
    };

    mockResponse = {
      statusCode: 200,
    };

    // Mock execution context
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      getHandler: jest.fn().mockReturnValue({
        name: 'findAllPatients',
      }),
    } as any;

    // Mock call handler
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({})),
    } as any;
  });

  describe('Performance Tracking', () => {
    it('should track fast requests (< 500ms)', async () => {
      const testData = [{ id: '1', name: 'Patient 1' }];
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      // Mock console methods to avoid actual logging
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: resolve,
        });
      });

      expect(mockCallHandler.handle).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log moderate requests (500ms - 1000ms)', async () => {
      const testData = [{ id: '1', name: 'Patient 1' }];
      
      // Simulate a slow response
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          setTimeout(() => resolve(testData), 600);
        }).then(data => of(data))
      );

      const loggerSpy = jest.spyOn(interceptor['logger'], 'log').mockImplementation();

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: resolve,
        });
      });

      // Wait for the delayed response
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Moderate request: GET /api/patients')
      );
      
      loggerSpy.mockRestore();
    });

    it('should log slow requests (> 1000ms)', async () => {
      const testData = [{ id: '1', name: 'Patient 1' }];
      
      // Simulate a very slow response
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          setTimeout(() => resolve(testData), 1100);
        }).then(data => of(data))
      );

      const loggerSpy = jest.spyOn(interceptor['logger'], 'warn').mockImplementation();

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: resolve,
        });
      });

      // Wait for the delayed response
      await new Promise(resolve => setTimeout(resolve, 1200));

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow request detected: GET /api/patients')
      );
      
      loggerSpy.mockRestore();
    });

    it('should track request errors', async () => {
      const error = new Error('Database connection failed');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(() => error));

      const loggerSpy = jest.spyOn(interceptor['logger'], 'error').mockImplementation();

      await new Promise((resolve, reject) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: resolve,
          error: reject,
        });
      }).catch(() => {
        // Expected error
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Request failed: GET /api/patients'),
        expect.any(String)
      );
      
      loggerSpy.mockRestore();
    });
  });

  describe('Request Information Extraction', () => {
    it('should extract request details correctly', async () => {
      const testData = [{ id: '1', name: 'Patient 1' }];
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      const loggerSpy = jest.spyOn(interceptor['logger'], 'debug').mockImplementation();
      
      // Set NODE_ENV to development to trigger debug logging
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: resolve,
        });
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/patients')
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Handler: findAllPatients')
      );

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
      loggerSpy.mockRestore();
    });
  });
});
