import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventSchedule } from 'src/events/entities/event-schedule.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository, Connection, EntityManager } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { differenceInHours, parseISO } from 'date-fns';
import { ReserveTicketDto } from './dto/reserve-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(EventSchedule)
    private eventScheduleRepository: Repository<EventSchedule>,
    private readonly connection: Connection,
  ) {}

  async reserveTickets(reserveTicketDto: ReserveTicketDto, user: User): Promise<Ticket> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const schedule = await queryRunner.manager.findOne(EventSchedule, {
        where: { id: reserveTicketDto.eventScheduleId },
        relations: ['event'],
      });

      if (!schedule) {
        throw new Error('존재하지 않는 공연 일정입니다.');
      }

      const isSeatsAvailable = await this.validateSeats(queryRunner.manager, schedule.id, reserveTicketDto.seatMap);

      if (!isSeatsAvailable) {
        throw new Error('이미 예매된 좌석이 포함되어 있습니다.');
      }

      const ticket = queryRunner.manager.create(Ticket, {
        eventSchedule: schedule,
        seatMap: reserveTicketDto.seatMap,
        count: reserveTicketDto.count,
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
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ticket = await queryRunner.manager.findOne(Ticket, {
        where: { id: ticketId, userId, cancel: false },
        relations: ['eventSchedule', 'eventSchedule.event'],
      });

      if (!ticket) {
        throw new Error('취소할 수 없는 티켓입니다.');
      }

      const now = new Date();
      const scheduleDate = new Date(`${ticket.eventSchedule.date} ${ticket.eventSchedule.time}`);
      const hoursDiff = differenceInHours(scheduleDate, now);

      if (hoursDiff < 24) {
        throw new Error('공연 24시간 전에는 취소할 수 없습니다.');
      }

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

  async findAvailableSeats(scheduleId: string): Promise<any> {
    const schedule = await this.eventScheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['event'],
    });

    if (!schedule) {
      throw new NotFoundException('존재하지 않는 공연 일정입니다.');
    }

    const reservedTickets = await this.ticketRepository.find({
      where: { eventScheduleId: scheduleId, cancel: false },
      select: ['seatMap'],
    });

    const reservedSeatsMap = new Set();
    reservedTickets.forEach((ticket) => {
      const seatMap = JSON.parse(ticket.seatMap);
      seatMap.forEach((seat) => reservedSeatsMap.add(`${seat.row}-${seat.number}`));
    });

    return {
      schedule,
      reservedSeats: Array.from(reservedSeatsMap),
    };
  }

  private async validateSeats(manager: EntityManager, scheduleId: string, seatMap: string): Promise<boolean> {
    const parsedSeatMap = JSON.parse(seatMap);
    const seatKeys = parsedSeatMap.map((seat) => `${seat.row}-${seat.number}`);

    const existingTickets = await manager.find(Ticket, {
      where: {
        eventScheduleId: scheduleId,
        cancel: false,
      },
      select: ['seatMap'],
    });

    const reservedSeats = new Set();
    existingTickets.forEach((ticket) => {
      const ticketSeatMap = JSON.parse(ticket.seatMap);
      ticketSeatMap.forEach((seat) => reservedSeats.add(`${seat.row}-${seat.number}`));
    });

    return !seatKeys.some((key) => reservedSeats.has(key));
  }
}
