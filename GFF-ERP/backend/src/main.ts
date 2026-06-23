import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER, WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { buildSwaggerDocument } from './config/swagger.config';
import { AppConfig } from './config/app.config';
import { SwaggerConfig } from './config/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Winston as the logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app')!;
  const swaggerConfig = configService.get<SwaggerConfig>('swagger')!;

  const logger = new Logger('Bootstrap');

  // ============================================
  // SECURITY
  // ============================================
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'https:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ============================================
  // CORS
  // ============================================
  app.enableCors({
    origin: appConfig.corsOrigin,
    credentials: appConfig.corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-correlation-id',
      'x-branch-id',
      'x-api-key',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['x-request-id', 'x-total-count'],
    maxAge: 86400, // 24 hours
  });

  // ============================================
  // API PREFIX
  // ============================================
  app.setGlobalPrefix(appConfig.apiPrefix, {
    exclude: ['health', 'version', 'swagger-ui', 'swagger-ui/(.*)'],
  });

  // ============================================
  // API VERSIONING
  // ============================================
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // ============================================
  // GLOBAL PIPES
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: appConfig.nodeEnv === 'production',
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // ============================================
  // GLOBAL FILTERS
  // ============================================
  const httpAdapterHost = app.get(HttpAdapterHost);
  const winstonLogger = app.get(WINSTON_MODULE_PROVIDER);
  app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));

  // ============================================
  // GLOBAL INTERCEPTORS
  // ============================================
  app.useGlobalInterceptors(
    new LoggingInterceptor(winstonLogger),
    new TransformInterceptor(),
  );

  // ============================================
  // SWAGGER DOCUMENTATION
  // ============================================
  if (swaggerConfig.enabled) {
    const swaggerDocumentConfig = buildSwaggerDocument(swaggerConfig);
    const document = SwaggerModule.createDocument(app, swaggerDocumentConfig, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        `${controllerKey.replace('Controller', '')}_${methodKey}`,
      deepScanRoutes: true,
    });

    SwaggerModule.setup(swaggerConfig.path, app, document, {
      swaggerOptions: {
        persistAuthorization: swaggerConfig.persistAuthorization,
        tagsSorter: swaggerConfig.tagSorter,
        operationsSorter: 'alpha',
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
      },
      customSiteTitle: `${swaggerConfig.title} - Documentation`,
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #1a472a; }
        .swagger-ui .scheme-container { background: #f8f9fa; }
      `,
    });

    logger.log(
      `Swagger documentation available at /${swaggerConfig.path}`,
    );
  }

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================
  app.enableShutdownHooks();

  // Handle graceful shutdown signals
  const gracefulShutdown = (signal: string): void => {
    logger.log(`${signal} received. Starting graceful shutdown...`);
    app.close().then(
      () => {
        logger.log('Application closed gracefully');
        process.exit(0);
      },
      (err: Error) => {
        logger.error('Error during graceful shutdown:', err.message);
        process.exit(1);
      },
    );
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error.message, error.stack);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Rejection:', reason);
  });

  // ============================================
  // START SERVER
  // ============================================
  const port = appConfig.port;

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 ${appConfig.appName} v${appConfig.appVersion} is running on port ${port}`);
  logger.log(`📖 Environment: ${appConfig.nodeEnv}`);
  logger.log(`🌐 API Base URL: http://localhost:${port}/${appConfig.apiPrefix}`);

  if (swaggerConfig.enabled) {
    logger.log(`📚 API Docs: http://localhost:${port}/${swaggerConfig.path}`);
  }
}

bootstrap();
