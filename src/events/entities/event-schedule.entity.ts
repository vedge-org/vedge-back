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
  time: string;

  @Column('date')
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
