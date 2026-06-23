import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for accessing a route.
 * The user must have at least one of the specified roles.
 *
 * @example
 * @Roles('SUPER_ADMIN', 'ADMIN')
 * @Roles('MANAGER', 'ACCOUNTANT')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
