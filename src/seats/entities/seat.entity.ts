import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  VersionColumn,
} from 'typeorm';
import { EventSchedule } from '../../events/entities/event-schedule.entity';
import { SeatStatus } from '../enums/seat-status.enum';

@Entity('seats')
@Index(['eventScheduleId', 'status'])
@Index(['row', 'number', 'eventScheduleId'], { unique: true })
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  eventScheduleId: string;

  @ManyToOne(() => EventSchedule, (schedule) => schedule.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventScheduleId' })
  eventSchedule: EventSchedule;

  @Column()
  row: string;

  @Column()
  number: number;

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  @Column()
  phone: string;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
