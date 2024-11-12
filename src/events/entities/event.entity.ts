import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { EventSchedule } from './event-schedule.entity';
import { EventAdditionalInfo } from './event-additional-info.entity';

export enum EventCategory {
  CONCERT = 'CONCERT',
  MUSICAL = 'MUSICAL',
  EXHIBITION = 'EXHIBITION',
  EVENT = 'EVENT',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EventCategory,
  })
  category: EventCategory;

  @Column()
  address: string;

  @Column()
  @Index()
  title: string;

  @Column('int')
  duration: number;

  @Column('int')
  viewingAge: number;

  @Column({ nullable: true })
  posterImage: string;

  @Column({ nullable: true })
  ticketImage: string;

  @Column()
  startAvailable: Date;

  @Column()
  endAvailable: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @OneToMany(() => EventSchedule, (schedule) => schedule.event)
  schedule: EventSchedule[];

  @OneToMany(() => EventAdditionalInfo, (info) => info.event)
  additionalInfo: EventAdditionalInfo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
