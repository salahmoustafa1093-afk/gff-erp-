import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles from the handler or class level
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      this.logger.warn('No authenticated user found for roles check');
      throw new ForbiddenException({
        message: 'Authentication required.',
        error: 'NoAuthenticatedUser',
        code: 'NO_AUTH_USER',
      });
    }

    // SUPER_ADMIN always has access to everything
    if (user.roleCode === 'SUPER_ADMIN') {
      return true;
    }

    // Check if the user has one of the required roles
    const hasRole = requiredRoles.includes(user.roleCode);

    if (!hasRole) {
      this.logger.warn(
        `User ${user.email} with role ${user.roleCode} attempted to access resource requiring one of: [${requiredRoles.join(', ')}]`,
      );
      throw new ForbiddenException({
        message: `Access denied. Required role(s): ${requiredRoles.join(', ')}. Your role: ${user.roleCode}.`,
        error: 'InsufficientRole',
        code: 'INSUFFICIENT_ROLE',
        details: {
          requiredRoles,
          userRole: user.roleCode,
        },
      });
    }

    return true;
  }
}
