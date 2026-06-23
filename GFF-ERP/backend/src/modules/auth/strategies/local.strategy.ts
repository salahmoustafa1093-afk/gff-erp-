import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: number;
    roleCode: string;
    branchId: string;
  }> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid email or password.',
        error: 'InvalidCredentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      roleCode: user.roleCode,
      branchId: user.branchId,
    };
  }
}
