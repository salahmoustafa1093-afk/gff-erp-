import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  appName: string;
  appVersion: string;
  appDescription: string;
  corsOrigin: string | string[] | boolean;
  corsCredentials: boolean;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  requestTimeout: number;
  maxFileSize: number;
  uploadDir: string;
  logLevel: string;
  logDir: string;
  timezone: string;
  defaultLanguage: string;
  defaultCurrency: string;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api',
    appName: process.env.APP_NAME || 'GFF ERP',
    appVersion: process.env.APP_VERSION || '1.0.0',
    appDescription:
      process.env.APP_DESCRIPTION ||
      'GFF ERP Enterprise - Feed Manufacturing & Poultry Management System',
    corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
    corsCredentials: process.env.CORS_CREDENTIALS === 'true',
    rateLimitWindowMs: parseInt(
      process.env.RATE_LIMIT_WINDOW_MS || '900000',
      10,
    ), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    requestTimeout: parseInt(
      process.env.REQUEST_TIMEOUT || '30000',
      10,
    ), // 30 seconds
    maxFileSize: parseInt(
      process.env.MAX_FILE_SIZE || '10485760',
      10,
    ), // 10 MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    logLevel: process.env.LOG_LEVEL || 'info',
    logDir: process.env.LOG_DIR || './logs',
    timezone: process.env.TZ || 'Africa/Cairo',
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'ar',
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'EGP',
  }),
);

function parseCorsOrigin(
  value: string | undefined,
): string | string[] | boolean {
  if (!value) {
    return true; // Allow all origins by default in development
  }

  if (value === 'true') return true;
  if (value === 'false') return false;

  const origins = value.split(',').map(o => o.trim());
  return origins.length === 1 ? origins[0] : origins;
}
