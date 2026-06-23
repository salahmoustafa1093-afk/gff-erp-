import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    const handlerName = context.getHandler().name;
    const className = context.getClass().name;
    const now = Date.now();

    const requestId =
      request.headers['x-request-id']?.toString() ||
      request.headers['x-correlation-id']?.toString() ||
      this.generateRequestId();

    const logData = {
      requestId,
      method: request.method,
      path: request.url,
      handler: `${className}.${handlerName}`,
      userAgent: request.headers['user-agent'],
      ip: this.getClientIp(request),
      body: this.sanitizeBody(request.body),
      query: request.query,
      params: request.params,
      user: request.user ? (request.user as { id: string; email: string }).email : 'anonymous',
    };

    this.logger.info('HTTP Request Started', logData);

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          const duration = Date.now() - now;
          const statusCode = response.statusCode;

          const responseLog = {
            ...logData,
            statusCode,
            duration: `${duration}ms`,
            responseSize: this.getResponseSize(data),
          };

          if (statusCode >= 400) {
            this.logger.warn('HTTP Request Completed with Warning', responseLog);
          } else {
            this.logger.info('HTTP Request Completed', responseLog);
          }
        },
        error: (error: Error) => {
          const duration = Date.now() - now;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const statusCode = (error as any).status || 500;

          this.logger.error('HTTP Request Failed', {
            ...logData,
            statusCode,
            duration: `${duration}ms`,
            errorMessage: error.message,
            errorName: error.name,
          });
        },
      }),
    );
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || 'unknown';
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> | string {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'newPassword', 'currentPassword', 'token', 'secret', 'refreshToken'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  private getResponseSize(data: unknown): number {
    if (data === null || data === undefined) return 0;
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
