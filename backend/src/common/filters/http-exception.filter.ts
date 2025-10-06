import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = undefined;

    // Handle HTTP Exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;
        details = (exceptionResponse as any).details;
      }
    }
    // Handle Database Errors
    else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Error';
      
      // Don't expose database details in production
      if (process.env.NODE_ENV === 'production') {
        message = 'A database error occurred';
      } else {
        message = exception.message;
        details = {
          query: exception.query,
          parameters: exception.parameters,
        };
      }
    }
    // Handle unknown errors
    else if (exception instanceof Error) {
      // Don't expose error details in production
      if (process.env.NODE_ENV === 'production') {
        message = 'An unexpected error occurred';
      } else {
        message = exception.message;
        details = {
          stack: exception.stack,
        };
      }
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    // Sanitize sensitive information from error messages
    const sanitizedMessage = this.sanitizeErrorMessage(message);

    // Send response
    response.status(status).json({
      statusCode: status,
      error,
      message: sanitizedMessage,
      details: process.env.NODE_ENV === 'production' ? undefined : details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    const sensitivePatterns = [
      /password[^\s]*/gi,
      /token[^\s]*/gi,
      /secret[^\s]*/gi,
      /api[_-]key[^\s]*/gi,
      /authorization[^\s]*/gi,
    ];

    // Ensure message is a string
    let sanitized = typeof message === 'string' ? message : JSON.stringify(message);
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }
}

