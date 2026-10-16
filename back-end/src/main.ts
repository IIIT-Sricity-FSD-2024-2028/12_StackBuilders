import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Ensure file-backed middleware/logging destinations exist in clean environments.
  mkdirSync(join(process.cwd(), 'logs'), { recursive: true });
  mkdirSync(join(process.cwd(), 'uploads'), { recursive: true });
  const videoDirectory = join(process.cwd(), 'uploads', 'videos');
  const thumbnailDirectory = join(process.cwd(), 'uploads', 'thumbnails');
  mkdirSync(videoDirectory, { recursive: true });
  mkdirSync(thumbnailDirectory, { recursive: true });

  // Expose only generated video and thumbnail files. Generic uploads (which
  // may include private documents) remain outside these public media paths.
  app.useStaticAssets(videoDirectory, { prefix: '/media/videos', index: false });
  app.useStaticAssets(thumbnailDirectory, { prefix: '/media/thumbnails', index: false });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Wellness Platform API')
    .setDescription(
      'REST APIs for the evaluation backend. Authorization is enforced using the request header role.',
    )
    .setVersion('1.0.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'role',
        in: 'header',
        description:
          'Role required for RBAC. Supported values: Admin, HR, Employee, Wellness Expert',
      },
      'role',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const docsDirectory = join(process.cwd(), 'docs');
  mkdirSync(docsDirectory, { recursive: true });
  writeFileSync(
    join(docsDirectory, 'swagger.json'),
    JSON.stringify(swaggerDocument, null, 2),
    'utf-8',
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
