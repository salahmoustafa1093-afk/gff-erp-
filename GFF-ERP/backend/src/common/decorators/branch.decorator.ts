import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Decorator to extract the branch ID from the authenticated user.
 * If a key is provided, returns that specific property from the user's branch context.
 *
 * @example
 * @Branch() branchId: string
 * @Branch('id') id: string
 */
export const Branch = createParamDecorator(
  (key: string | undefined, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as
      | { branchId: string; branchCode?: string; branchName?: string }
      | undefined;

    if (!user) {
      return undefined;
    }

    if (key === 'id' || key === undefined) {
      return user.branchId;
    }

    if (key === 'code') {
      return user.branchCode;
    }

    if (key === 'name') {
      return user.branchName;
    }

    return undefined;
  },
);
