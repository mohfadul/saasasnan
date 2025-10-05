import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { API_VERSION_KEY, ApiVersionOptions } from '../decorators/api-version.decorator';

@Injectable()
export class ApiVersionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const versionOptions = this.reflector.getAllAndOverride<ApiVersionOptions>(API_VERSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!versionOptions) {
      return true; // No version constraint, allow access
    }

    const request = context.switchToHttp().getRequest<Request>();
    const requestedVersion = this.extractApiVersion(request);

    if (!requestedVersion) {
      // Default to v1 if no version specified
      return versionOptions.version === 'v1';
    }

    // Check if requested version matches the endpoint version
    const isVersionMatch = requestedVersion === versionOptions.version;

    if (!isVersionMatch) {
      throw new BadRequestException({
        error: 'Invalid API Version',
        message: `This endpoint requires API version ${versionOptions.version}, but ${requestedVersion} was requested`,
        requestedVersion,
        requiredVersion: versionOptions.version,
        code: 'INVALID_API_VERSION',
      });
    }

    // Check if endpoint is deprecated
    if (versionOptions.deprecated) {
      this.addDeprecationHeaders(request, versionOptions);
    }

    return true;
  }

  private extractApiVersion(request: Request): string | null {
    // Extract version from URL path (e.g., /api/v1/users)
    const pathVersion = request.path.match(/\/api\/(v\d+)\//);
    if (pathVersion) {
      return pathVersion[1];
    }

    // Extract version from Accept header (e.g., application/vnd.api+json;version=2)
    const acceptHeader = request.headers.accept;
    if (acceptHeader) {
      const versionMatch = acceptHeader.match(/version=(\d+)/);
      if (versionMatch) {
        return `v${versionMatch[1]}`;
      }
    }

    // Extract version from custom header (e.g., X-API-Version: v2)
    const apiVersionHeader = request.headers['x-api-version'] as string;
    if (apiVersionHeader) {
      return apiVersionHeader.startsWith('v') ? apiVersionHeader : `v${apiVersionHeader}`;
    }

    // Extract version from query parameter (e.g., ?version=v2)
    const queryVersion = request.query.version as string;
    if (queryVersion) {
      return queryVersion.startsWith('v') ? queryVersion : `v${queryVersion}`;
    }

    return null;
  }

  private addDeprecationHeaders(request: Request, options: ApiVersionOptions): void {
    const response = request.res;
    if (!response) return;

    response.setHeader('Deprecation', 'true');
    
    if (options.deprecatedSince) {
      response.setHeader('Sunset', options.deprecatedSince);
    }

    if (options.removalDate) {
      response.setHeader('Sunset', options.removalDate);
    }

    if (options.alternativeEndpoint) {
      response.setHeader('Link', `<${options.alternativeEndpoint}>; rel="successor-version"`);
    }

    if (options.migrationGuide) {
      response.setHeader('Link', `<${options.migrationGuide}>; rel="help"`);
    }

    // Add warning header
    const warningMessage = `This API endpoint is deprecated since ${options.deprecatedSince || 'unknown'}`;
    if (options.removalDate) {
      response.setHeader('Warning', `299 - "${warningMessage}. Will be removed on ${options.removalDate}"`);
    } else {
      response.setHeader('Warning', `299 - "${warningMessage}"`);
    }
  }
}
