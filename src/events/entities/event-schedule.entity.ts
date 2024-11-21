import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Event } from './event.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Cell, SeatMap } from '../../seats/entities/seat.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('event_schedules')
@Index(['eventId', 'date', 'time'], { unique: true })
export class EventSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  eventId: string;

  @ManyToOne(() => Event, (event) => event.schedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column('time')
  @ApiProperty({
    example: '14:00',
    description: '공연 시작 시간',
  })
  time: string;

  @Column('date')
  @ApiProperty({
    example: '2021-12-31',
    description: '공연 날짜',
  })
  date: Date;

  @OneToMany(() => Ticket, (ticket) => ticket.eventSchedule)
  tickets: Ticket[];

  @ManyToOne(() => SeatMap, (seatMap) => seatMap.schedules, { onDelete: 'CASCADE' })
  seatMap: SeatMap;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
