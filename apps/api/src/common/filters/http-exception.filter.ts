import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '@edusaas/api-contracts';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: Array<{ field?: string; issue: string }> | undefined = undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const respObj = exceptionResponse as Record<string, any>;
      message = respObj.message || message;
      errorCode = respObj.error || `HTTP_${status}`;

      if (Array.isArray(respObj.message)) {
        details = respObj.message.map((msg: string) => ({
          issue: msg,
        }));
        message = 'Validation error occurred';
        errorCode = 'VALIDATION_FAILED';
      }
    }

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - Error: ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}`,
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - Status ${status}: ${message}`);
    }

    const errorPayload: ApiErrorResponse = {
      success: false,
      statusCode: status,
      error: HttpStatus[status] || 'Error',
      message: Array.isArray(message) ? message[0] : message,
      errorCode,
      details,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (request.headers['x-request-id'] as string) || `req_${Date.now()}`,
      },
    };

    response.status(status).json(errorPayload);
  }
}
