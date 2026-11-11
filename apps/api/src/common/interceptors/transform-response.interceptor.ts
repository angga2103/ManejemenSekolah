import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@edusaas/api-contracts';
import { Request } from 'express';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        message: data?.message || 'Operation successful',
        data: data?.data !== undefined ? data.data : data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId:
            (request.headers['x-request-id'] as string) || `req_${Date.now()}`,
          pagination: data?.meta?.pagination,
        },
      })),
    );
  }
}
