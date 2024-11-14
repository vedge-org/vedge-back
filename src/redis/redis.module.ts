import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { Store } from 'express-session';

export class RedisStore extends Store {
  constructor(options: { client: Redis; prefix?: string; ttl?: number }) {
    super();
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'SESSION_STORE',
      useFactory: (redisClient: Redis) => {
        return new RedisStore({
          client: redisClient,
          prefix: 'sess:',
          ttl: 60 * 60, // 1 hour
        });
      },
      inject: ['REDIS_CLIENT'],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', 'SESSION_STORE', RedisService],
})
export class RedisModule {}
