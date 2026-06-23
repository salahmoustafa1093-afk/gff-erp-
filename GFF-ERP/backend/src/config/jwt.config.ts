import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
  algorithm: string;
  clockTolerance: number;
}

export default registerAs(
  'jwt',
  (): JwtConfig => ({
    secret:
      process.env.JWT_SECRET ||
      'gff-erp-jwt-secret-key-change-in-production-2024',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'gff-erp-jwt-refresh-secret-key-change-in-production-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'gff-erp-api',
    audience: process.env.JWT_AUDIENCE || 'gff-erp-client',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    clockTolerance: parseInt(
      process.env.JWT_CLOCK_TOLERANCE || '30',
      10,
    ), // 30 seconds
  }),
);
