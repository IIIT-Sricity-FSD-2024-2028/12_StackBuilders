import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
