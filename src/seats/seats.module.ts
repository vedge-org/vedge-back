import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatsService } from './seats.service';
import { SeatsController } from './seats.controller';
import { Seat } from './entities/seat.entity';
import { SeatLock } from './entities/seat-lock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Seat, SeatLock])],
  controllers: [SeatsController],
  providers: [SeatsService],
  exports: [SeatsService],
})
export class SeatsModule {}
