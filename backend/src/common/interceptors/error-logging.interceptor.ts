import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CacheService } from '../services/cache.service';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorLoggingInterceptor.name);

  constructor(private readonly cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();

    const requestId = this.generateRequestId();
    const endpoint = `${request.method} ${request.route?.path || request.path}`;

    // Add request ID to request object for logging
    (request as any).requestId = requestId;

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log successful requests
        this.logger.log(
          `Request completed: ${endpoint} - ${statusCode} - ${duration}ms`,
          {
            requestId,
            method: request.method,
            url: request.url,
            statusCode,
            duration,
            userAgent: request.get('User-Agent'),
            ip: request.ip,
            userId: (request as any).user?.id,
            tenantId: (request as any).user?.tenantId,
          }
        );

        // Store metrics for successful requests
        this.storeRequestMetrics({
          requestId,
          endpoint,
          method: request.method,
          statusCode,
          duration,
          timestamp: new Date().toISOString(),
          userId: (request as any).user?.id,
          tenantId: (request as any).user?.tenantId,
          error: null,
        }).catch(err => {
          this.logger.error('Failed to store request metrics', err);
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log errors
        this.logger.error(
          `Request failed: ${endpoint} - ${statusCode} - ${duration}ms`,
          error.stack,
          {
            requestId,
            method: request.method,
            url: request.url,
            statusCode,
            duration,
            error: error.message,
            errorCode: error.code,
            userAgent: request.get('User-Agent'),
            ip: request.ip,
            userId: (request as any).user?.id,
            tenantId: (request as any).user?.tenantId,
          }
        );

        // Store metrics for failed requests
        this.storeRequestMetrics({
          requestId,
          endpoint,
          method: request.method,
          statusCode,
          duration,
          timestamp: new Date().toISOString(),
          userId: (request as any).user?.id,
          tenantId: (request as any).user?.tenantId,
          error: {
            message: error.message,
            code: error.code,
            stack: error.stack,
          },
        }).catch(err => {
          this.logger.error('Failed to store error metrics', err);
        });

        return throwError(() => error);
      })
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeRequestMetrics(metrics: any): Promise<void> {
    try {
      const { requestId, endpoint, method, statusCode, duration, timestamp, userId, tenantId, error } = metrics;

      const requestMetrics = {
        requestId,
        endpoint,
        method,
        statusCode,
        duration,
        timestamp,
        userId,
        tenantId,
        errorCode: error?.code,
        errorMessage: error?.message,
      };

      // Store individual request metric
      await this.cacheService.set(`request:${requestId}`, metrics, 7 * 24 * 60 * 60); // 7 days

      // Update daily statistics
      const dailyStatsKey = `daily_stats:${endpoint}:${new Date().toISOString().split('T')[0]}`;
      const existingStats = (await this.cacheService.get(dailyStatsKey) as any) || {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalDuration: 0,
        averageDuration: 0,
        errorCodes: {},
      };

      existingStats.totalRequests++;
      existingStats.totalDuration += duration;
      existingStats.averageDuration = existingStats.totalDuration / existingStats.totalRequests;

      if (statusCode >= 200 && statusCode < 400) {
        existingStats.successfulRequests++;
      } else {
        existingStats.failedRequests++;
        if (error?.code) {
          existingStats.errorCodes[error.code] = (existingStats.errorCodes[error.code] || 0) + 1;
        }
      }

      await this.cacheService.set(dailyStatsKey, existingStats, 30 * 24 * 60 * 60); // 30 days
    } catch (error) {
      this.logger.error('Failed to store request metrics', error);
    }
  }
}