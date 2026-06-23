import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcryptjs from 'bcryptjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtConfig } from '@/config/jwt.config';

export interface LoginDto {
  email: string;
  password: string;
  branchId?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId?: number;
  branchId?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleCode: string;
    roleName: string;
    branchId: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
}

export interface TokenPayload {
  sub: string;
  email: string;
  roleId: number;
  roleCode: string;
  branchId: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: WinstonLogger,
  ) {}

  async validateUser(email: string, password: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: number;
    roleCode: string;
    branchId: string;
    isActive: boolean;
    password: string;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      roleCode: user.role.code,
      branchId: user.branchId,
      isActive: user.isActive,
      password: user.password,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      this.winstonLogger.warn('Login failed: invalid credentials', {
        email: dto.email,
      });
      throw new UnauthorizedException({
        message: 'Invalid email or password.',
        error: 'InvalidCredentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const passwordValid = await bcryptjs.compare(dto.password, user.password);

    if (!passwordValid) {
      this.winstonLogger.warn('Login failed: wrong password', {
        email: dto.email,
        userId: user.id,
      });
      throw new UnauthorizedException({
        message: 'Invalid email or password.',
        error: 'InvalidCredentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user);

    this.winstonLogger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      role: user.roleCode,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleCode: user.roleCode,
        roleName: '', // Will be populated by controller
        branchId: user.branchId,
      },
      tokens,
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException({
        message: 'An account with this email already exists.',
        error: 'EmailExists',
        code: 'EMAIL_EXISTS',
      });
    }

    // Validate password strength
    this.validatePasswordStrength(dto.password);

    const hashedPassword = await bcryptjs.hash(dto.password, 12);

    // Get default role (VIEWER) if not specified
    const roleId = dto.roleId || (await this.getDefaultRoleId());

    // Get default branch if not specified
    const branchId = dto.branchId || (await this.getDefaultBranchId());

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone?.trim() || null,
        roleId,
        branchId,
        isActive: true,
        emailVerified: false,
      },
      include: { role: true },
    });

    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      roleCode: user.role.code,
      branchId: user.branchId,
    });

    this.winstonLogger.info('New user registered', {
      userId: user.id,
      email: user.email,
      role: user.role.code,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleCode: user.role.code,
        roleName: user.role.name,
        branchId: user.branchId,
      },
      tokens,
    };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  }> {
    const jwtConfig = this.configService.get<JwtConfig>('jwt')!;

    try {
      const payload = this.jwtService.verify<TokenPayload>(dto.refreshToken, {
        secret: jwtConfig.refreshSecret,
        audience: jwtConfig.audience,
        issuer: jwtConfig.issuer,
        clockTolerance: jwtConfig.clockTolerance,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException({
          message: 'Invalid refresh token.',
          error: 'InvalidTokenType',
          code: 'INVALID_TOKEN_TYPE',
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException({
          message: 'User not found or inactive.',
          error: 'UserNotFound',
          code: 'USER_NOT_FOUND',
        });
      }

      const tokens = await this.generateTokens({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleCode: user.role.code,
        branchId: user.branchId,
      });

      return tokens;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${(error as Error).message}`);
      throw new UnauthorizedException({
        message: 'Invalid or expired refresh token. Please log in again.',
        error: 'InvalidRefreshToken',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }
  }

  async logout(userId: string): Promise<{ success: boolean }> {
    // In a more advanced implementation, you could blacklist the token here
    this.winstonLogger.info('User logged out', { userId });
    return { success: true };
  }

  async getMe(userId: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatar: string | null;
    roleCode: string;
    roleName: string;
    permissions: string[];
    branchId: string;
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new UnauthorizedException({
        message: 'User not found.',
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
      phone: user.phone,
      avatar: user.avatar,
      roleCode: user.role.code,
      roleName: user.role.name,
      permissions,
      branchId: user.branchId,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: number;
    roleCode: string;
    branchId: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  }> {
    const jwtConfig = this.configService.get<JwtConfig>('jwt')!;

    const accessPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleCode: user.roleCode,
      branchId: user.branchId,
      type: 'access',
    };

    const refreshPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleCode: user.roleCode,
      branchId: user.branchId,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: jwtConfig.secret,
        expiresIn: jwtConfig.expiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: jwtConfig.refreshSecret,
        expiresIn: jwtConfig.refreshExpiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }),
    ]);

    // Parse expiresIn to seconds
    const expiresInSeconds = this.parseExpiresIn(jwtConfig.expiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      tokenType: 'Bearer',
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 3600);
  }

  private async getDefaultRoleId(): Promise<number> {
    const role = await this.prisma.role.findUnique({
      where: { code: 'VIEWER' },
    });
    if (!role) {
      throw new BadRequestException('Default role not found');
    }
    return role.id;
  }

  private async getDefaultBranchId(): Promise<string> {
    const branch = await this.prisma.branch.findFirst({
      where: { isMain: true },
    });
    if (!branch) {
      throw new BadRequestException('Default branch not found');
    }
    return branch.id;
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException({
        message: 'Password must be at least 8 characters long.',
        error: 'WeakPassword',
        code: 'WEAK_PASSWORD',
      });
    }

    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException({
        message: 'Password must contain at least one uppercase letter.',
        error: 'WeakPassword',
        code: 'WEAK_PASSWORD',
      });
    }

    if (!/[a-z]/.test(password)) {
      throw new BadRequestException({
        message: 'Password must contain at least one lowercase letter.',
        error: 'WeakPassword',
        code: 'WEAK_PASSWORD',
      });
    }

    if (!/[0-9]/.test(password)) {
      throw new BadRequestException({
        message: 'Password must contain at least one number.',
        error: 'WeakPassword',
        code: 'WEAK_PASSWORD',
      });
    }
  }
}
