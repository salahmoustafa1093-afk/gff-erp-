import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtConfig } from '@/config/jwt.config';
import { AuthenticatedUser } from '@/common/decorators/current-user.decorator';
import { TokenPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtConfig = configService.get<JwtConfig>('jwt')!;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      clockTolerance: jwtConfig.clockTolerance,
      algorithms: [jwtConfig.algorithm],
    });
  }

  async validate(payload: TokenPayload): Promise<AuthenticatedUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException({
        message: 'Invalid token type.',
        error: 'InvalidTokenType',
        code: 'INVALID_TOKEN_TYPE',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        message: 'User not found or inactive.',
        error: 'UserNotFound',
        code: 'USER_NOT_FOUND',
      });
    }

    const permissions = user.role.rolePermissions.map(
      rp => `${rp.permission.module}:${rp.permission.action}`,
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      roleCode: user.role.code,
      roleName: user.role.name,
      branchId: user.branchId,
      permissions,
      iat: payload.iat || 0,
      exp: payload.exp || 0,
    };
  }
}
