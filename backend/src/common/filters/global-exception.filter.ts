import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CacheService } from '../services/cache.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly cacheService: CacheService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details: any = undefined;
    let timestamp = new Date().toISOString();

    // Extract information from the exception
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errorCode = responseObj.errorCode || 'HTTP_ERROR';
        details = responseObj.errors || responseObj.details;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = 'UNKNOWN_ERROR';
    }

    // Log the error with context
    const errorContext = {
      timestamp,
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      userId: (request as any).user?.id,
      tenantId: (request as any).user?.tenantId,
      status,
      errorCode,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    // Log based on severity
    if (status >= 500) {
      this.logger.error(`Server Error: ${message}`, exception instanceof Error ? exception.stack : undefined, errorContext);
    } else if (status >= 400) {
      this.logger.warn(`Client Error: ${message}`, errorContext);
    } else {
      this.logger.log(`Request Error: ${message}`, errorContext);
    }

    // Store error in cache for monitoring (if it's a server error)
    if (status >= 500) {
      this.storeErrorForMonitoring(errorContext).catch(err => {
        this.logger.error('Failed to store error for monitoring', err);
      });
    }

    // Prepare error response
    const errorResponse = {
      statusCode: status,
      errorCode,
      message,
      timestamp,
      path: request.url,
      method: request.method,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    // Remove sensitive information in production
    if (process.env.NODE_ENV === 'production') {
      delete errorResponse.stack;
    }

    response.status(status).json(errorResponse);
  }

  private async storeErrorForMonitoring(errorContext: any): Promise<void> {
    try {
      const errorKey = `error:${Date.now()}:${errorContext.userId || 'anonymous'}`;
      await this.cacheService.set(errorKey, errorContext, 24 * 60 * 60); // Store for 24 hours

      // Also increment error counter
      const counterKey = `error_count:${errorContext.errorCode}:${new Date().toISOString().split('T')[0]}`;
      const currentCount = await this.cacheService.get(counterKey) as number || 0;
      await this.cacheService.set(counterKey, currentCount + 1, 24 * 60 * 60);
    } catch (error) {
      this.logger.error('Failed to store error for monitoring', error);
    }
  }
}