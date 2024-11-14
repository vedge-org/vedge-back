import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { RedisModule } from 'src/redis/redis.module';
import { SmsModule } from 'src/sms/sms.module';
import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import Redis from 'ioredis';

@Module({
  imports: [UsersModule, RedisModule, SmsModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
