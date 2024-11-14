import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventSchedule } from 'src/events/entities/event-schedule.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository, DataSource } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { differenceInHours } from 'date-fns';
import { ReserveTicketDto } from './dto/reserve-ticket.dto';
import { SeatsService } from '../seats/seats.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(EventSchedule)
    private eventScheduleRepository: Repository<EventSchedule>,
    private readonly seatsService: SeatsService,
    private readonly dataSource: DataSource,
  ) {}

  async reserveTickets(reserveTicketDto: ReserveTicketDto, user: User): Promise<Ticket> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const schedule = await queryRunner.manager.findOne(EventSchedule, {
        where: { id: reserveTicketDto.eventScheduleId },
        relations: ['event'],
      });

      if (!schedule) {
        throw new NotFoundException('존재하지 않는 공연 일정입니다.');
      }

      const seatIds = JSON.parse(reserveTicketDto.seatMap);
      if (!Array.isArray(seatIds)) {
        throw new BadRequestException('잘못된 좌석 정보입니다.');
      }

      // 좌석 서비스를 통한 검증 및 예약
      const { isAvailable, isLocked } = await this.seatsService.validateAndLockSeats(seatIds, user.id, schedule.id);

      if (!isAvailable) {
        throw new BadRequestException('이미 예매된 좌석이 포함되어 있습니다.');
      }

      if (!isLocked) {
        throw new BadRequestException('좌석 잠금이 없거나 만료되었습니다.');
      }

      const ticket = queryRunner.manager.create(Ticket, {
        eventSchedule: schedule,
        seatMap: reserveTicketDto.seatMap,
        count: seatIds.length,
        user: user,
      });

      await queryRunner.manager.save(ticket);
      await queryRunner.commitTransaction();

      return ticket;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findTicketsByUser(userId: string, page: number, limit: number): Promise<{ tickets: Ticket[]; total: number }> {
    const [tickets, total] = await this.ticketRepository.findAndCount({
      where: { userId, cancel: false },
      relations: ['eventSchedule', 'eventSchedule.event'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { tickets, total };
  }

  async findTicketDetail(ticketId: string, userId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, userId },
      relations: ['eventSchedule', 'eventSchedule.event'],
    });

    if (!ticket) {
      throw new NotFoundException('티켓을 찾을 수 없습니다.');
    }

    return ticket;
  }

  async cancelTicket(ticketId: string, userId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ticket = await queryRunner.manager.findOne(Ticket, {
        where: { id: ticketId, userId, cancel: false },
        relations: ['eventSchedule', 'eventSchedule.event'],
      });

      if (!ticket) {
        throw new BadRequestException('취소할 수 없는 티켓입니다.');
      }

      const now = new Date();
      const scheduleDate = new Date(`${ticket.eventSchedule.date} ${ticket.eventSchedule.time}`);
      const hoursDiff = differenceInHours(scheduleDate, now);

      if (hoursDiff < 24) {
        throw new BadRequestException('공연 24시간 전에는 취소할 수 없습니다.');
      }

      // 좌석 서비스를 통한 취소 처리
      const seatIds = JSON.parse(ticket.seatMap);
      await this.seatsService.unlockSeats(seatIds);

      ticket.cancel = true;
      await queryRunner.manager.save(ticket);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAvailableSeats(scheduleId: string) {
    const schedule = await this.eventScheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['event'],
    });

    if (!schedule) {
      throw new NotFoundException('존재하지 않는 공연 일정입니다.');
    }

    return this.seatsService.findAvailableSeats(scheduleId);
  }
}
