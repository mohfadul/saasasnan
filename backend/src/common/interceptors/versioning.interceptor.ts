import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ApiVersionOptions, API_VERSION_KEY } from '../decorators/api-version.decorator';

export interface ApiResponse<T = any> {
  data: T;
  meta: {
    version: string;
    timestamp: string;
    deprecated?: boolean;
    deprecationInfo?: {
      deprecatedSince?: string;
      removalDate?: string;
      alternativeEndpoint?: string;
      migrationGuide?: string;
    };
  };
}

@Injectable()
export class VersioningInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const versionOptions = this.reflector.getAllAndOverride<ApiVersionOptions>(API_VERSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const version = versionOptions?.version || 'v1';
    const isDeprecated = versionOptions?.deprecated || false;

    return next.handle().pipe(
      map(data => ({
        data,
        meta: {
          version,
          timestamp: new Date().toISOString(),
          deprecated: isDeprecated,
          deprecationInfo: isDeprecated ? {
            deprecatedSince: versionOptions?.deprecatedSince,
            removalDate: versionOptions?.removalDate,
            alternativeEndpoint: versionOptions?.alternativeEndpoint,
            migrationGuide: versionOptions?.migrationGuide,
          } : undefined,
        },
      })),
    );
  }
}
