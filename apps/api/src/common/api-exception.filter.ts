import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    let code = status === 429 ? 'RATE_LIMITED' : `HTTP_${status}`;
    let message =
      status === 429
        ? 'Terlalu banyak percobaan. Silakan coba lagi nanti.'
        : 'Permintaan tidak dapat diproses.';
    let details: { path: string; message: string }[] = [];

    if (exception instanceof ZodValidationException) {
      code = 'VALIDATION_ERROR';
      message = 'Periksa kembali data yang Anda masukkan.';
      const error = exception.getZodError();
      if (error instanceof ZodError) {
        details = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: 'Nilai tidak valid.',
        }));
      }
    } else if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'code' in payload &&
        'message' in payload
      ) {
        if (typeof payload.code === 'string') code = payload.code;
        if (typeof payload.message === 'string') message = payload.message;
      }
    } else {
      code = 'INTERNAL_ERROR';
      message = 'Terjadi gangguan pada sistem. Silakan coba lagi.';
      this.logger.error('Unhandled API failure; request details withheld.');
    }
    response.status(status).json({ error: { code, message, details } });
  }
}
