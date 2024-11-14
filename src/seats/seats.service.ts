// src/seats/services/seats.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cell } from './entities/seat.entity';
import { SeatLock } from './entities/seat-lock.entity';

@Injectable()
export class SeatsService {
  private readonly LOCK_DURATION = 180;

  constructor(
    @InjectRepository(Cell)
    private readonly seatRepository: Repository<Cell>,
    @InjectRepository(SeatLock)
    private readonly seatLockRepository: Repository<SeatLock>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}


}
