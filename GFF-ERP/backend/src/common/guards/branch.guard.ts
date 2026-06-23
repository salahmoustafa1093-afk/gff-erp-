import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Branch guard that ensures users can only access data from their assigned branch.
 * SUPER_ADMIN can access all branches.
 * Other users can only access data from their assigned branch.
 */
@Injectable()
export class BranchGuard implements CanActivate {
  private readonly logger = new Logger(BranchGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      this.logger.warn('No authenticated user found for branch check');
      throw new UnauthorizedException({
        message: 'Authentication required.',
        error: 'NoAuthenticatedUser',
        code: 'NO_AUTH_USER',
      });
    }

    // SUPER_ADMIN can access any branch - set branch from query/header or skip
    if (user.roleCode === 'SUPER_ADMIN') {
      const requestedBranchId = this.extractBranchId(request);
      if (requestedBranchId) {
        this.prisma.setBranchId(requestedBranchId);
        request.headers['x-branch-id'] = requestedBranchId;
      } else {
        this.prisma.setBranchId(user.branchId);
      }
      return true;
    }

    // For other users, check if they can access the requested branch
    const requestedBranchId = this.extractBranchId(request);

    if (requestedBranchId) {
      // User is requesting a specific branch - verify access
      const canAccess = await this.canAccessBranch(user, requestedBranchId);

      if (!canAccess) {
        this.logger.warn(
          `User ${user.email} (branch: ${user.branchId}) attempted to access branch ${requestedBranchId}`,
        );
        throw new ForbiddenException({
          message: 'Access denied. You do not have permission to access this branch.',
          error: 'BranchAccessDenied',
          code: 'BRANCH_ACCESS_DENIED',
          details: {
            userBranchId: user.branchId,
            requestedBranchId,
          },
        });
      }

      // Set the branch context for Prisma middleware
      this.prisma.setBranchId(requestedBranchId);
      request.headers['x-branch-id'] = requestedBranchId;
    } else {
      // No branch specified - use user's default branch
      this.prisma.setBranchId(user.branchId);
      request.headers['x-branch-id'] = user.branchId;
    }

    return true;
  }

  /**
   * Check if a user can access a specific branch.
   * For now, users can only access their assigned branch.
   * Future: support multi-branch access via user-branch assignments.
   */
  private async canAccessBranch(
    user: AuthenticatedUser,
    branchId: string,
  ): Promise<boolean> {
    // User can always access their own branch
    if (user.branchId === branchId) {
      return true;
    }

    // Check if user has explicit access to other branches
    // This would be expanded with a UserBranchAssignment table
    const branchAssignment = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        isActive: true,
      },
    });

    if (!branchAssignment) {
      return false;
    }

    // Check multi-branch assignment via UserBranch table if exists
    const userBranch = await this.prisma.userBranchAssignment.findFirst({
      where: {
        userId: user.userId,
        branchId: branchId,
        isActive: true,
      },
    });

    if (userBranch) {
      return true;
    }

    // Manager role can access branches they manage
    if (user.roleCode === 'MANAGER' || user.roleCode === 'ADMIN') {
      const managedBranch = await this.prisma.branch.findFirst({
        where: {
          id: branchId,
          managerId: user.userId,
        },
      });
      if (managedBranch) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract branch ID from request (header, query param, or body).
   */
  private extractBranchId(request: Request): string | undefined {
    // Check header first
    const headerBranchId = request.headers['x-branch-id'];
    if (
      headerBranchId &&
      typeof headerBranchId === 'string' &&
      headerBranchId.length > 0
    ) {
      return headerBranchId;
    }

    // Check query parameter
    const queryBranchId = request.query.branchId;
    if (
      queryBranchId &&
      typeof queryBranchId === 'string' &&
      queryBranchId.length > 0
    ) {
      return queryBranchId;
    }

    // Check body
    if (request.body && typeof request.body === 'object') {
      const bodyBranchId = (request.body as Record<string, unknown>).branchId;
      if (
        bodyBranchId &&
        typeof bodyBranchId === 'string' &&
        bodyBranchId.length > 0
      ) {
        return bodyBranchId;
      }
    }

    return undefined;
  }
}
