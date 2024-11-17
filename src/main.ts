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

  // CORS를 세션 설정보다 먼저 설정
  app.enableCors({
    origin: [
      'http://localhost:3000', // 프론트엔드 개발 서버
      'http://localhost:5173', // Vite 기본 포트
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'https://vedgeweb.apne2a.algorix.cloud',
      // 프로덕션 도메인들도 추가
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Set-Cookie'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  // 세션 설정
  app.use(
    session({
      store: new RedisStore({
        client: redisClient,
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      name: 'sessionId',
      proxy: true, // 프록시 뒤에서 실행되는 경우 필요
      cookie: {
        httpOnly: true,
        secure: false, // 개발환경에서는 false로 설정
        sameSite: 'lax', // 개발환경에서는 'lax'로 설정
        maxAge: 60 * 60 * 1000, // 1 hour
      },
    }),
  );

  // 세션 초기화 미들웨어
  app.use((req: any, res: any, next: any) => {
    if (!req.session.data) {
      req.session.data = {};
    }
    next();
  });

  // Swagger 설정
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
