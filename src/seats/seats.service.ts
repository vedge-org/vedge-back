import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, MoreThan, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SeatMap, Section, SeatColumn, Cell, CellType } from './entities/seat.entity';
import { SeatLock } from './entities/seat-lock.entity';
import { CreateSeatMapDto } from './dto/create-seat-map.dto';
import { EventSchedule } from '../events/entities/event-schedule.entity';
import { EventsService } from 'src/events/events.service';
import { SeatWaitList } from './entities/seat-waiting.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class SeatsService {
  constructor(
    @InjectRepository(SeatMap)
    private seatMapRepository: Repository<SeatMap>,
    @InjectRepository(Cell)
    private cellRepository: Repository<Cell>,
    @InjectRepository(SeatLock)
    private seatLockRepository: Repository<SeatLock>,
    @InjectRepository(SeatWaitList)
    private seatWaitingRepository: Repository<SeatWaitList>,
    private eventService: EventsService,
    private dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredLocks() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const expiredLocks = await this.seatLockRepository.find({
        where: {
          expiresAt: LessThan(new Date()),
        },
        relations: ['seat'],
      });

      if (expiredLocks.length > 0) {
        await queryRunner.manager.delete(SeatLock, {
          id: In(expiredLocks.map((lock) => lock.id)),
        });
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Failed to cleanup expired seat locks:', error);
    } finally {
      await queryRunner.release();
    }
  }

  async createSeatMap(createSeatMapDto: CreateSeatMapDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const seatMap = this.seatMapRepository.create(createSeatMapDto);
      await queryRunner.manager.save(seatMap);
      await queryRunner.commitTransaction();
      return seatMap;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAvailableSeats(scheduleId: string, user: User) {
    const schedule = await this.eventService.getEventSchedule(scheduleId);

    if (!schedule) {
      throw new NotFoundException('공연 일정을 찾을 수 없습니다.');
    }

    const cell = await this.cellRepository.find({
      where: {
        eventScheduleId: scheduleId,
        type: CellType.SEAT,
        isAvailable: true,
      },
      relations: ['column', 'column.section'],
    });

    const waitList = await this.seatWaitingRepository
      .createQueryBuilder()
      .leftJoinAndSelect('seatWaiting.cell', 'cell')
      .groupBy('cell.id')
      .where('cell.eventScheduleId = :scheduleId', { scheduleId })
      .andWhere('seatWaiting.userId = :userId', { userId: user.id })
      .getMany();

    return cell.filter((seat) => {
      if (waitList.some((waiting) => waiting.cell.id === seat.id)) {
        if (waitList.some((waiting) => waiting.userId === user.id)) return true;

        return false;
      }

      return true;
    });
  }

  async findAvailableWaitListSeats(scheduleId: string): Promise<Cell[]> {
    const waitList = await this.seatWaitingRepository
      .createQueryBuilder()
      .leftJoinAndSelect('seatWaiting.cell', 'cell')
      .groupBy('cell.id')
      .having('COUNT(cell.id) < 5')
      .where('cell.eventScheduleId = :scheduleId', { scheduleId })
      .andWhere('cell.isAvailable = :isAvailable', { isAvailable: false })
      .getMany();

    return waitList.map((waiting) => waiting.cell);
  }

  async unlockSeats(seatIds: string[]): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Cell, { id: In(seatIds) }, { isAvailable: true });

      await queryRunner.manager.delete(SeatLock, {
        seatId: In(seatIds),
      });

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findSeatWaitListBySeatIds(scheduleId: string, seatIds: string[]): Promise<SeatWaitList[]> {
    return await this.seatWaitingRepository
      .createQueryBuilder()
      .leftJoinAndSelect('seatWaiting.cell', 'cell')
      .groupBy('cell.id')
      .having('COUNT(cell.id) < 5')
      .where('cell.eventScheduleId = :scheduleId', { scheduleId })
      .andWhere('cell.id IN (:...seatIds)', { seatIds })
      .getMany();
  }

  async validateAndLockSeats(
    seatIds: string[],
    userId: string,
    scheduleId: string,
  ): Promise<{ isAvailable: boolean; isLocked: boolean }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lockedSeats = await queryRunner.manager
        .createQueryBuilder(SeatLock, 'lock')
        .where('lock.seatId IN (:...seatIds)', { seatIds })
        .andWhere('lock.userId = :userId', { userId })
        .andWhere('lock.expiresAt > :now', { now: new Date() })
        .getMany();

      if (lockedSeats.length !== seatIds.length) {
        await queryRunner.rollbackTransaction();
        return { isAvailable: false, isLocked: false };
      }

      const cells = await queryRunner.manager
        .createQueryBuilder(Cell, 'cell')
        .where('cell.id IN (:...seatIds)', { seatIds })
        .andWhere('cell.eventScheduleId = :scheduleId', { scheduleId })
        .andWhere('cell.isAvailable = :isAvailable', { isAvailable: true })
        .getMany();

      if (cells.length !== seatIds.length) {
        await queryRunner.rollbackTransaction();
        return { isAvailable: false, isLocked: true };
      }

      await queryRunner.manager.update(Cell, { id: In(seatIds) }, { isAvailable: false });

      await queryRunner.manager.delete(SeatLock, {
        id: In(lockedSeats.map((lock) => lock.id)),
      });

      await queryRunner.manager.delete(SeatWaitList, {
        cellId: In(seatIds),
        userId,
      });

      await queryRunner.commitTransaction();
      return { isAvailable: true, isLocked: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async lockSeats(seatIds: string[], name: string, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cells = await this.cellRepository.find({
        where: {
          id: In(seatIds),
          isAvailable: true,
          type: CellType.SEAT,
        },
      });

      if (cells.length !== seatIds.length) {
        throw new BadRequestException('이미 예약된 좌석이 포함되어 있습니다.');
      }

      const existingLocks = await this.seatLockRepository.find({
        where: {
          seatId: In(seatIds),
          expiresAt: MoreThan(new Date()),
        },
      });

      if (existingLocks.length > 0) {
        throw new BadRequestException('이미 잠금 처리된 좌석이 포함되어 있습니다.');
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 3); // 3분으로 변경

      const seatLocks = cells.map((cell) => {
        return this.seatLockRepository.create({
          seatId: cell.id,
          userId,
          name,
          expiresAt,
        });
      });

      await queryRunner.manager.save(SeatLock, seatLocks);
      await queryRunner.commitTransaction();

      return {
        cells,
        expiresAt,
        lockIds: seatLocks.map((lock) => lock.id),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getSeatMap(scheduleId: string) {
    const schedule = await this.eventService.getEventScheduleByIdRelation(scheduleId);

    if (!schedule) {
      throw new NotFoundException('공연 일정을 찾을 수 없습니다.');
    }

    return schedule.seatMap;
  }

  async getSeatDetails(seatId: string) {
    const cell = await this.cellRepository.findOne({
      where: { id: seatId },
      relations: ['column', 'column.section', 'column.section.seatMap', 'eventSchedule'],
    });

    if (!cell) {
      throw new NotFoundException('좌석을 찾을 수 없습니다.');
    }

    return cell;
  }
}
