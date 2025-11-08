import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from './domain.exception';
import { DomainCode, DomainCodeMessage } from './domain.code';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Default status
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown> = {
      message: DomainCodeMessage[DomainCode.UNKNOWN_ERROR],
      code: DomainCode.UNKNOWN_ERROR,
    };

    if (exception instanceof DomainException) {
      status = exception.getStatus();
      body = {
        code: exception.code,
        message: exception.message,
        ...(exception.metadata && { metadata: exception.metadata }),
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      body =
        typeof exceptionResponse === 'string'
          ? { message: exceptionResponse }
          : (exceptionResponse as Record<string, unknown>);
    }

    if (!('code' in body)) {
      body.code = DomainCode.UNKNOWN_ERROR;
    }

    response.status(status).json({
      ...body,
    });
  }
}
