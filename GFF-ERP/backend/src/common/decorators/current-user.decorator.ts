import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  branchId: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export const CurrentUser = createParamDecorator(
  <K extends keyof AuthenticatedUser>(
    key: K | undefined,
    ctx: ExecutionContext,
  ): AuthenticatedUser | AuthenticatedUser[K] | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      return undefined;
    }

    if (key) {
      return user[key];
    }

    return user;
  },
);
