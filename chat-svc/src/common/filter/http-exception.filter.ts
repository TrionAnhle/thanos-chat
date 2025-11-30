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
    console.log(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: number = DomainCode.UNKNOWN_ERROR;
    let message: string = DomainCodeMessage[DomainCode.UNKNOWN_ERROR];

    if (exception instanceof DomainException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      code = DomainCode.BAD_REQUEST;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const responseBody = exceptionResponse as Record<string, unknown>;
        const responseMessage = responseBody.message;

        if (Array.isArray(responseMessage)) {
          message = responseMessage[0];
        } else if (typeof responseMessage === 'string') {
          message = responseMessage;
        } else if (typeof responseBody.error === 'string') {
          message = responseBody.error;
        } else {
          message = DomainCodeMessage[DomainCode.UNKNOWN_ERROR];
        }
      }
    }

    response.status(status).json({
      code,
      message,
    });
  }
}
