import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { version: string };

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('HTTP');
  const configService = app.get(ConfigService);
  const demoAuthEnabled = configService.get<string>('DEMO_AUTH_ENABLED') === 'true';
  const nodeEnv = configService.get<string>('NODE_ENV');

  if (demoAuthEnabled && nodeEnv === 'production') {
    throw new Error('DEMO_AUTH_ENABLED cannot be true when NODE_ENV is production.');
  }

  if (demoAuthEnabled) {
    logger.warn('DEMO AUTH ENABLED - fixed OTP login is active');
  }

  const configuredCorsOrigins = configService.get<string>('CORS_ORIGINS');
  const corsOrigins = configuredCorsOrigins === undefined
    ? ['http://localhost:5173', 'http://localhost:4200']
    : configuredCorsOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', () => {
      logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`,
      );
    });

    res.on('close', () => {
      if (!res.writableFinished) {
        logger.warn(`${req.method} ${req.originalUrl} connection closed before response`);
      }
    });

    next();
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('BloodConnect API')
    .setDescription('REST API for blood donors, hospitals, alerts, and administration.')
    .setVersion(packageJson.version)
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server running on http://localhost:3000/api/v1`);
}
bootstrap();