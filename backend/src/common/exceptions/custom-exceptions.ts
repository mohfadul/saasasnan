import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(message: string, errors?: any[]) {
    super(
      {
        message,
        errors: errors || [],
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class BusinessLogicException extends HttpException {
  constructor(message: string, errorCode?: string) {
    super(
      {
        message,
        errorCode: errorCode || 'BUSINESS_LOGIC_ERROR',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      },
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    
    super(
      {
        message,
        errorCode: 'RESOURCE_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class ConflictException extends HttpException {
  constructor(message: string, errorCode?: string) {
    super(
      {
        message,
        errorCode: errorCode || 'RESOURCE_CONFLICT',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}

export class InsufficientPermissionsException extends HttpException {
  constructor(action?: string) {
    const message = action 
      ? `Insufficient permissions to perform action: ${action}`
      : 'Insufficient permissions';
    
    super(
      {
        message,
        errorCode: 'INSUFFICIENT_PERMISSIONS',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN
    );
  }
}

export class RateLimitExceededException extends HttpException {
  constructor(retryAfter?: number) {
    super(
      {
        message: 'Rate limit exceeded. Please try again later.',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}

export class ExternalServiceException extends HttpException {
  constructor(service: string, originalError?: any) {
    super(
      {
        message: `External service '${service}' is currently unavailable`,
        errorCode: 'EXTERNAL_SERVICE_ERROR',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        originalError: process.env.NODE_ENV === 'development' ? originalError : undefined,
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}

export class DatabaseException extends HttpException {
  constructor(operation: string, originalError?: any) {
    super(
      {
        message: `Database operation '${operation}' failed`,
        errorCode: 'DATABASE_ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        originalError: process.env.NODE_ENV === 'development' ? originalError : undefined,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export class EncryptionException extends HttpException {
  constructor(operation: string, originalError?: any) {
    super(
      {
        message: `Encryption operation '${operation}' failed`,
        errorCode: 'ENCRYPTION_ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        originalError: process.env.NODE_ENV === 'development' ? originalError : undefined,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export class TenantIsolationException extends HttpException {
  constructor(message: string = 'Tenant isolation violation') {
    super(
      {
        message,
        errorCode: 'TENANT_ISOLATION_VIOLATION',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN
    );
  }
}

export class AuditLogException extends HttpException {
  constructor(operation: string, originalError?: any) {
    super(
      {
        message: `Audit logging for operation '${operation}' failed`,
        errorCode: 'AUDIT_LOG_ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        originalError: process.env.NODE_ENV === 'development' ? originalError : undefined,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

