import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.tenant_id) {
      return false;
    }
    
    // Add tenant_id to request for use in services
    request.tenant_id = user.tenant_id;
    return true;
  }
}
