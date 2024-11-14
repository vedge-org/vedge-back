import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Event, EventCategory } from './entities/event.entity';
import { EventSchedule } from './entities/event-schedule.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventSchedule)
    private readonly scheduleRepository: Repository<EventSchedule>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      schedule: createEventDto.schedule.map((schedule) => {
        const eventSchedule = this.scheduleRepository.create({
          ...schedule,
          seatMap: createEventDto.seatMap
            ? {
                sections: createEventDto.seatMap.sections,
              }
            : null,
        });
        return eventSchedule;
      }),
    });

    return this.eventRepository.save(event);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    category?: EventCategory,
    searchTerm?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.schedule', 'schedule')
      .leftJoinAndSelect('event.additionalInfo', 'additionalInfo')
      .leftJoinAndSelect('schedule.seatMap', 'seatMap')
      .leftJoinAndSelect('seatMap.sections', 'sections');

    if (category) {
      queryBuilder.andWhere('event.category = :category', { category });
    }

    if (searchTerm) {
      queryBuilder.andWhere('(event.title LIKE :searchTerm OR event.address LIKE :searchTerm)', {
        searchTerm: `%${searchTerm}%`,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('schedule.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const [events, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      events,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['schedule', 'additionalInfo', 'schedule.seatMap', 'schedule.seatMap.sections'],
    });

    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    // 이벤트 기본 정보 업데이트
    Object.assign(event, updateEventDto);

    // 스케줄 업데이트
    if (updateEventDto.schedule) {
      event.schedule = updateEventDto.schedule.map((schedule) => this.scheduleRepository.create(schedule));
    }

    return this.eventRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }

  async getUpcoming(limit: number = 5): Promise<Event[]> {
    const now = new Date();
    return this.eventRepository.find({
      where: {
        schedule: {
          date: Between(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)), // 30일 이내
        },
      },
      relations: ['schedule', 'schedule.seatMap', 'schedule.seatMap.sections'],
      take: limit,
      order: {
        schedule: {
          date: 'ASC',
        },
      },
    });
  }

  async getEventSchedule(eventId: string): Promise<EventSchedule[]> {
    return this.scheduleRepository.find({
      where: { event: { id: eventId } },
      relations: ['seats', 'seatMap', 'seatMap.sections', 'seatMap.sections.columns'],
    });
  }

  async getEventScheduleByIdRelation(scheduleId: string): Promise<EventSchedule> {
    return this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: [
        'seats',
        'seats.column',
        'seats.column.section',
        'seats.column.section.seatMap',
        'seatMap',
        'seatMap.sections',
        'seatMap.sections.columns',
      ],
    });
  }
}
