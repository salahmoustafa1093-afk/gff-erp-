import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for accessing a route.
 * The user must have ALL of the specified permissions.
 *
 * @example
 * @Permissions({ module: 'SALES', action: 'CREATE' })
 * @Permissions({ module: 'SALES', action: 'READ' }, { module: 'CUSTOMERS', action: 'READ' })
 */
export interface PermissionRequirement {
  module: string;
  action: string;
}

export const Permissions = (...permissions: PermissionRequirement[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
