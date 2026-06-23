import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route as public (no authentication required).
 * When applied to a controller class, all routes in that controller become public.
 * When applied to a method, only that specific route becomes public.
 *
 * @example
 * @Public()
 * @Public() // Class level
 * @Controller('auth')
 * export class AuthController { ... }
 *
 * @Public() // Method level
 * @Post('register')
 * async register() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
