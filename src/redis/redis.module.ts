import { Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'SESSION_STORE',
      useFactory: (redisClient: Redis) => {
        const RedisStore = require('connect-redis').default;
        return new RedisStore({ client: redisClient });
      },
      inject: ['REDIS_CLIENT'],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', 'SESSION_STORE', RedisService],
})
export class RedisModule {}
