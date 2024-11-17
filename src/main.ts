import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RoleErrorFilter } from './common/filters/role-error.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as session from 'express-session';
import Redis from 'ioredis';
import RedisStore from 'connect-redis';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
  });
  app.enableCors({
    origin: ['http://localhost:5173', 'https://vedgeweb.apne2a.algorix.cloud'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Set-Cookie'],
  });

  // 세션 설정 수정
  app.use(
    session({
      store: new RedisStore({
        client: redisClient,
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      name: 'sessionId',
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // production에서만 true
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // production에서는 none, 개발환경에서는 lax
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/', // 쿠키 경로 지정
        domain:
          process.env.NODE_ENV === 'production'
            ? '.yourdomain.com' // production 환경에서의 도메인
            : undefined, // 개발 환경에서는 기본값 사용
      },
    }),
  );

  app.use((req: any, res: any, next: any) => {
    if (!req.session.data) {
      req.session.data = {};
    }
    next();
  });

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

bootstrap()
  .then(() => console.log('🎫 Vedge API Started Successfully!'))
  .catch((error) => console.error('Failed to start Vedge API:', error));
