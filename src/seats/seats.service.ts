// src/seats/services/seats.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, LessThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Seat } from './entities/seat.entity';
import { SeatLock } from './entities/seat-lock.entity';
import { CreateSeatMapDto } from './dto/create-seat-map.dto';
import { SeatStatus } from './enums/seat-status.enum';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SeatsService {
  private readonly LOCK_DURATION = 180;

  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(SeatLock)
    private readonly seatLockRepository: Repository<SeatLock>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createSeatMap(createSeatMapDto: CreateSeatMapDto): Promise<Seat[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const seats: Seat[] = [];

      for (const row of createSeatMapDto.rows) {
        for (let number = 1; number <= row.seatsPerRow; number++) {
          const seat = this.seatRepository.create({
            eventScheduleId: createSeatMapDto.eventScheduleId,
            row: row.rowName,
            number,
            status: SeatStatus.AVAILABLE,
          });
          seats.push(seat);
        }
      }

      const createdSeats = await queryRunner.manager.save(seats);
      await queryRunner.commitTransaction();

      return createdSeats;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('좌석 배치도 생성에 실패했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  async findAvailableSeats(scheduleId: string): Promise<Seat[]> {
    return this.seatRepository.find({
      where: {
        eventScheduleId: scheduleId,
        status: SeatStatus.AVAILABLE,
      },
      order: {
        row: 'ASC',
        number: 'ASC',
      },
    });
  }

  async lockSeats(seatIds: string[], name: string, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const seats = await queryRunner.manager.findBy(Seat, {
        id: In(seatIds),
      });

      if (seats.length !== seatIds.length) {
        throw new NotFoundException('일부 좌석을 찾을 수 없습니다.');
      }

      const unavailableSeats = seats.filter((seat) => seat.status !== SeatStatus.AVAILABLE);

      if (unavailableSeats.length > 0) {
        throw new ConflictException('이미 예약된 좌석이 포함되어 있습니다.');
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.LOCK_DURATION * 1000);

      await queryRunner.manager.update(Seat, { id: In(seatIds) }, { status: SeatStatus.PENDING });

      const seatLocks = seatIds.map((seatId) => ({
        seatId,
        userId,
        name,
        expiresAt,
      }));

      await queryRunner.manager.insert(SeatLock, seatLocks);
      await queryRunner.commitTransaction();

      // 이벤트 발생
      this.eventEmitter.emit('seats.locked', {
        seatIds,
        userId,
        expiresAt,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getSeatMap(scheduleId: string) {
    const seats = await this.seatRepository.find({
      where: { eventScheduleId: scheduleId },
      order: { row: 'ASC', number: 'ASC' },
      relations: ['eventSchedule'],
    });

    if (!seats.length) {
      throw new NotFoundException('좌석 정보를 찾을 수 없습니다.');
    }

    const seatMap: Record<string, any> = {};
    const rows = new Set(seats.map((seat) => seat.row));

    Array.from(rows)
      .sort()
      .forEach((row) => {
        seatMap[row] = seats
          .filter((seat) => seat.row === row)
          .sort((a, b) => a.number - b.number)
          .map((seat) => ({
            id: seat.id,
            number: seat.number,
            status: seat.status,
          }));
      });

    return {
      seatMap,
      totalSeats: seats.length,
      availableSeats: seats.filter((seat) => seat.status === SeatStatus.AVAILABLE).length,
    };
  }

  async getSeatDetails(seatId: string) {
    const seat = await this.seatRepository.findOne({
      where: { id: seatId },
      relations: ['eventSchedule'],
    });

    if (!seat) {
      throw new NotFoundException('좌석을 찾을 수 없습니다.');
    }

    const lock = await this.seatLockRepository.findOne({
      where: { seatId },
      relations: ['user'],
    });

    return {
      ...seat,
      isLocked: !!lock,
      lockInfo: lock
        ? {
            expiresAt: lock.expiresAt,
            userName: lock.name,
          }
        : null,
    };
  }

  @Cron('*/1 * * * *')
  async releaseExpiredLocks() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 만료된 잠금 찾기
      const expiredLocks = await queryRunner.manager.find(SeatLock, {
        where: {
          expiresAt: LessThan(new Date()),
        },
        relations: ['seat'],
      });

      if (expiredLocks.length > 0) {
        const seatIds = expiredLocks.map((lock) => lock.seatId);

        // 좌석 상태 업데이트
        await queryRunner.manager.update(Seat, { id: In(seatIds) }, { status: SeatStatus.AVAILABLE });

        // 만료된 잠금 삭제
        await queryRunner.manager.delete(SeatLock, {
          id: In(expiredLocks.map((lock) => lock.id)),
        });

        await queryRunner.commitTransaction();

        // 이벤트 발생
        this.eventEmitter.emit('seats.locks.expired', {
          seatIds,
          count: seatIds.length,
        });
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Failed to release expired locks:', error);
    } finally {
      await queryRunner.release();
    }
  }

  async validateSeats(seatIds: string[]): Promise<boolean> {
    const seats = await this.seatRepository.findBy({
      id: In(seatIds),
    });

    if (seats.length !== seatIds.length) {
      return false;
    }

    return seats.every((seat) => seat.status === SeatStatus.AVAILABLE);
  }

  async getReservedSeats(scheduleId: string): Promise<Seat[]> {
    return this.seatRepository.find({
      where: {
        eventScheduleId: scheduleId,
        status: SeatStatus.RESERVED,
      },
      order: {
        row: 'ASC',
        number: 'ASC',
      },
    });
  }
}
