import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import type { Environment } from './config/environment';

export async function createApp(logging = true) {
  const app = await NestFactory.create(AppModule, {
    logger: logging ? ['log', 'warn', 'error'] : false,
    abortOnError: false,
  });
  const config = app.get(ConfigService<Environment, true>);
  const logger = new Logger('HTTP');
  app.setGlobalPrefix('api/v1');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' } }));
  app.use(cookieParser());
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = randomUUID();
    const started = performance.now();
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Request-Id', requestId);
    response.on('finish', () => {
      if (logging)
        logger.log(
          `${request.method} ${response.statusCode} ${Math.round(performance.now() - started)}ms request=${requestId}`,
        );
    });
    next();
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('FA RENT CAR API')
      .setDescription(
        'Fase 0: sesi admin dan kesiapan layanan. Semua mutasi membutuhkan cookie serta header X-CSRF-Token.',
      )
      .setVersion('0.1.0')
      .addCookieAuth('fa_access')
      .build();
    const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, swaggerConfig));
    SwaggerModule.setup('api/docs', app, document);
  }
  app.enableShutdownHooks();
  return app;
}
