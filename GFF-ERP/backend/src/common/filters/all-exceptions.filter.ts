import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

export interface ErrorResponse {
  success: boolean;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  method: string;
  correlationId: string;
  stackTrace?: string;
  details?: Record<string, unknown>;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly fallbackLogger = new Logger(AllExceptionsFilter.name);

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      request.headers['x-correlation-id']?.toString() ||
      request.headers['x-request-id']?.toString() ||
      this.generateCorrelationId();

    const { statusCode, message, error, details } =
      this.parseException(exception);

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
      ...(process.env.NODE_ENV === 'development' && {
        stackTrace:
          exception instanceof Error
            ? exception.stack
            : 'No stack trace available',
      }),
      ...(details && { details }),
    };

    this.logError(exception, request, errorResponse);

    response.status(statusCode).json(errorResponse);
  }

  private parseException(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
    details?: Record<string, unknown>;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string;
      let error: string;
      let details: Record<string, unknown> | undefined;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.constructor.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message =
          typeof responseObj.message === 'string'
            ? responseObj.message
            : Array.isArray(responseObj.message)
              ? (responseObj.message as string[]).join(', ')
              : 'An error occurred';
        error = typeof responseObj.error === 'string' ? responseObj.error : exception.constructor.name;
        details = responseObj.details as Record<string, unknown> | undefined;
      } else {
        message = 'An error occurred';
        error = exception.constructor.name;
      }

      return { statusCode: status, message, error, details };
    }

    // Handle Prisma errors
    if (exception instanceof Error && exception.constructor.name.startsWith('Prisma')) {
      return this.parsePrismaError(exception);
    }

    // Handle validation errors
    if (exception instanceof Error && exception.name === 'ValidationError') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
        error: 'ValidationError',
      };
    }

    // Unknown error
    const isError = exception instanceof Error;
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isError
        ? exception.message
        : 'Internal server error occurred',
      error: isError ? exception.name : 'UnknownError',
    };
  }

  private parsePrismaError(error: Error): {
    statusCode: number;
    message: string;
    error: string;
  } {
    const errorName = error.constructor.name;

    switch (errorName) {
      case 'PrismaClientKnownRequestError': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const code = (error as any).code as string;
        const prismaMessages: Record<string, { status: number; message: string; error: string }> = {
          P2000: { status: HttpStatus.BAD_REQUEST, message: 'Input data is too long', error: 'DataTooLong' },
          P2001: { status: HttpStatus.NOT_FOUND, message: 'Record not found', error: 'RecordNotFound' },
          P2002: { status: HttpStatus.CONFLICT, message: 'A record with this value already exists', error: 'UniqueConstraintViolation' },
          P2003: { status: HttpStatus.BAD_REQUEST, message: 'Foreign key constraint failed', error: 'ForeignKeyConstraintViolation' },
          P2004: { status: HttpStatus.BAD_REQUEST, message: 'A database constraint failed', error: 'ConstraintViolation' },
          P2014: { status: HttpStatus.BAD_REQUEST, message: 'Invalid relation', error: 'InvalidRelation' },
          P2025: { status: HttpStatus.NOT_FOUND, message: 'Record not found', error: 'RecordNotFound' },
        };

        const mappedError = prismaMessages[code];
        if (mappedError) {
          return {
            statusCode: mappedError.status,
            message: mappedError.message,
            error: mappedError.error,
          };
        }
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Database error: ${error.message}`,
          error: 'DatabaseError',
        };
      }
      case 'PrismaClientValidationError':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid data provided',
          error: 'ValidationError',
        };
      case 'PrismaClientInitializationError':
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Database connection failed',
          error: 'DatabaseConnectionError',
        };
      case 'PrismaClientRustPanicError':
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database engine error',
          error: 'DatabaseEngineError',
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error occurred',
          error: 'DatabaseError',
        };
    }
  }

  private logError(exception: unknown, request: Request, errorResponse: ErrorResponse): void {
    const logData = {
      correlationId: errorResponse.correlationId,
      statusCode: errorResponse.statusCode,
      method: request.method,
      path: request.url,
      body: this.sanitizeBody(request.body),
      query: request.query,
      params: request.params,
      error: errorResponse.error,
      message: errorResponse.message,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      timestamp: errorResponse.timestamp,
      stack:
        exception instanceof Error && process.env.NODE_ENV === 'development'
          ? exception.stack
          : undefined,
    };

    if (errorResponse.statusCode >= 500) {
      this.logger.error('Server Error', logData);
      this.fallbackLogger.error(
        `[${request.method}] ${request.url} - ${errorResponse.statusCode}: ${errorResponse.message}`,
      );
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn('Client Error', logData);
    }
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> | string {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'ssn'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
