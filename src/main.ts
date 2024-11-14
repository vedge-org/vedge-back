import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RoleErrorFilter } from './common/filters/role-error.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Vedge API')
    .setDescription('암표 방지 티켓 예매 서비스 Vedge API 문서')
    .setVersion('1.0')
    .addTag('vedge')
    .addCookieAuth('sessionId')
    .build();
  app.useGlobalFilters(new RoleErrorFilter());
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: 'api-docs/json',
    explorer: true,
    yamlDocumentUrl: 'api-docs/yaml',
  });
  await app.listen(process.env.PORT || 3000);
}

bootstrap().then((r) => console.log('🎫 Vedge API Started Successfully!'));
