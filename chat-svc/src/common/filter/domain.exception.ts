import { HttpException, HttpStatus } from '@nestjs/common';
import { DomainCode, DomainCodeMessage } from './domain.code';

export type DomainExceptionMetadata = Record<string, unknown>;

export class DomainException extends HttpException {
  constructor(
    public readonly code: DomainCode,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly metadata?: DomainExceptionMetadata,
  ) {
    super(DomainCodeMessage[code], status);
  }
}
