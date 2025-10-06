import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    
    const startTime = Date.now();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          
          // Log slow requests
          if (duration > 1000) {
            this.logger.warn(
              `Slow request detected: ${method} ${url} - ${duration}ms - Status: ${statusCode} - IP: ${ip} - UserAgent: ${userAgent}`,
            );
          } else if (duration > 500) {
            this.logger.log(
              `Moderate request: ${method} ${url} - ${duration}ms - Status: ${statusCode}`,
            );
          }

          // Log all requests in development
          if (process.env.NODE_ENV === 'development') {
            this.logger.debug(
              `${method} ${url} - ${duration}ms - Status: ${statusCode} - Handler: ${handler.name}`,
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Request failed: ${method} ${url} - ${duration}ms - Error: ${error.message} - IP: ${ip}`,
            error.stack,
          );
        },
      }),
    );
  }
}
