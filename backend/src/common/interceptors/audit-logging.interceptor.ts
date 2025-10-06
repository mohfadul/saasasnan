import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

interface AuditLog {
  timestamp: string;
  userId: string | null;
  tenantId: string | null;
  method: string;
  endpoint: string;
  ip: string;
  userAgent: string;
  statusCode?: number;
  duration?: number;
  error?: string;
}

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const user = (request as any).user;
    const startTime = Date.now();

    const auditLog: AuditLog = {
      timestamp: new Date().toISOString(),
      userId: user?.id || null,
      tenantId: user?.tenant_id || null,
      method,
      endpoint: url,
      ip,
      userAgent: headers['user-agent'] || 'Unknown',
    };

    // Only log mutations (POST, PUT, PATCH, DELETE)
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap(
        () => {
          if (isMutation) {
            auditLog.statusCode = context.switchToHttp().getResponse().statusCode;
            auditLog.duration = Date.now() - startTime;
            this.logAudit(auditLog);
          }
        },
        (error) => {
          if (isMutation) {
            auditLog.statusCode = error.status || 500;
            auditLog.duration = Date.now() - startTime;
            auditLog.error = error.message;
            this.logAudit(auditLog, true);
          }
        },
      ),
    );
  }

  private logAudit(auditLog: AuditLog, isError: boolean = false) {
    const logMessage = `[${auditLog.method}] ${auditLog.endpoint} - User: ${auditLog.userId || 'Anonymous'} - Tenant: ${auditLog.tenantId || 'N/A'} - Status: ${auditLog.statusCode} - Duration: ${auditLog.duration}ms`;

    if (isError) {
      this.logger.error(`${logMessage} - Error: ${auditLog.error}`);
    } else {
      this.logger.log(logMessage);
    }

    // TODO: Store audit logs in database for compliance
    // await this.auditLogRepository.save(auditLog);
  }
}

