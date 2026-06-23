import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  PERMISSIONS_KEY,
  PermissionRequirement,
} from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from the handler or class level
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionRequirement[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      this.logger.warn('No authenticated user found for permissions check');
      throw new ForbiddenException({
        message: 'Authentication required.',
        error: 'NoAuthenticatedUser',
        code: 'NO_AUTH_USER',
      });
    }

    // SUPER_ADMIN always has all permissions
    if (user.roleCode === 'SUPER_ADMIN') {
      return true;
    }

    // Check if the user has ALL required permissions
    const userPermissions = user.permissions || [];

    const missingPermissions: PermissionRequirement[] = [];

    for (const required of requiredPermissions) {
      const permissionString = `${required.module}:${required.action}`;
      const hasPermission = userPermissions.includes(permissionString);

      if (!hasPermission) {
        missingPermissions.push(required);
      }
    }

    if (missingPermissions.length > 0) {
      this.logger.warn(
        `User ${user.email} missing permissions: ${missingPermissions.map(p => `${p.module}:${p.action}`).join(', ')}`,
      );
      throw new ForbiddenException({
        message: `Access denied. Missing required permissions: ${missingPermissions.map(p => `${p.module}:${p.action}`).join(', ')}.`,
        error: 'InsufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        details: {
          missingPermissions: missingPermissions.map(
            p => `${p.module}:${p.action}`,
          ),
          userRole: user.roleCode,
        },
      });
    }

    return true;
  }
}
