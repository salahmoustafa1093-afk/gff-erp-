import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeoutMs: number;
  queryTimeoutMs: number;
  logQueries: boolean;
  ssl: boolean;
  shadowDatabaseUrl?: string;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/gff_erp?schema=public',
    maxConnections: parseInt(
      process.env.DB_MAX_CONNECTIONS || '20',
      10,
    ),
    connectionTimeoutMs: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || '10000',
      10,
    ),
    queryTimeoutMs: parseInt(
      process.env.DB_QUERY_TIMEOUT || '30000',
      10,
    ),
    logQueries: process.env.DB_LOG_QUERIES === 'true',
    ssl: process.env.DB_SSL === 'true',
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  }),
);
