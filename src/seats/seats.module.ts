import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatsService } from './seats.service';
import { SeatsController } from './seats.controller';
import { Cell, SeatMap } from './entities/seat.entity';
import { SeatLock } from './entities/seat-lock.entity';
import { EventsModule } from 'src/events/events.module';
import { EventsService } from 'src/events/events.service';
import { SeatWaitList } from './entities/seat-waiting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cell, SeatLock, SeatMap, SeatWaitList]), EventsModule],
  controllers: [SeatsController],
  providers: [SeatsService],
  exports: [SeatsService],
})
export class SeatsModule {}
