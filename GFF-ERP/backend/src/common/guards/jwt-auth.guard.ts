import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Otherwise, proceed with JWT authentication
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest<TUser = never>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _context: ExecutionContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status?: any,
  ): TUser {
    // Handle specific JWT errors
    if (info) {
      const infoName = (info as Error).name || '';
      const infoMessage = (info as Error).message || '';

      if (infoName === 'TokenExpiredError' || infoMessage.includes('jwt expired')) {
        this.logger.warn('JWT token expired');
        throw new UnauthorizedException({
          message: 'Your session has expired. Please log in again.',
          error: 'TokenExpired',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (infoName === 'JsonWebTokenError' || infoMessage.includes('jwt')) {
        this.logger.warn(`JWT error: ${infoMessage}`);
        throw new UnauthorizedException({
          message: 'Invalid authentication token. Please log in again.',
          error: 'InvalidToken',
          code: 'INVALID_TOKEN',
        });
      }

      if (infoName === 'NotBeforeError') {
        this.logger.warn('JWT token not active yet');
        throw new UnauthorizedException({
          message: 'Token not active yet. Please log in again.',
          error: 'TokenNotActive',
          code: 'TOKEN_NOT_ACTIVE',
        });
      }
    }

    if (err) {
      this.logger.error(`Authentication error: ${err.message}`);
      throw new UnauthorizedException({
        message: 'Authentication failed.',
        error: 'AuthenticationError',
        code: 'AUTH_FAILED',
      });
    }

    if (!user) {
      this.logger.warn('No user found in JWT token');
      throw new UnauthorizedException({
        message: 'Authentication required. Please log in.',
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    return user;
  }
}
