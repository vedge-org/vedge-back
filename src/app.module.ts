import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { SeatsModule } from './seats/seats.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { SmsModule } from './sms/sms.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),

    // 스케줄러 (배치 작업)
    ScheduleModule.forRoot(),

    // 기능 모듈
    EventsModule,
    SeatsModule,
    TicketsModule,
    UsersModule,
    AuthModule,
    SmsModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
