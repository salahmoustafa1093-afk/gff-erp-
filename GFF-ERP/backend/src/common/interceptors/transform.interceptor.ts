import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  timestamp: string;
  path: string;
  method: string;
  statusCode: number;
  pagination?: PaginationMeta;
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse<Response>();

    const requestId =
      request.headers['x-request-id']?.toString() ||
      request.headers['x-correlation-id']?.toString();

    return next.handle().pipe(
      map((data: T) => {
        const isPaginated = this.isPaginatedResponse(data);

        if (isPaginated) {
          const paginatedData = data as unknown as {
            data: T;
            pagination: PaginationMeta;
          };
          return {
            success: true,
            data: paginatedData.data,
            meta: {
              timestamp: new Date().toISOString(),
              path: request.url,
              method: request.method,
              statusCode: response.statusCode,
              pagination: paginatedData.pagination,
              ...(requestId && { requestId }),
            },
          };
        }

        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            statusCode: response.statusCode,
            ...(requestId && { requestId }),
          },
        };
      }),
    );
  }

  private isPaginatedResponse<T>(data: T): boolean {
    return (
      data !== null &&
      typeof data === 'object' &&
      'data' in data &&
      'pagination' in data &&
      data.pagination !== null &&
      typeof data.pagination === 'object'
    );
  }
}
