import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EventSchedule } from '../../events/entities/event-schedule.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  eventScheduleId: string;

  @ManyToOne(() => EventSchedule, (schedule) => schedule.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventScheduleId' })
  eventSchedule: EventSchedule;

  @Column('json')
  seatMap: string;

  @Column('int')
  count: number;

  @Column({ default: false })
  cancel: boolean;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.ticketList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
