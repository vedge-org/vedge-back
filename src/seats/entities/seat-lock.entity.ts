import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Seat } from './seat.entity';

@Entity('seat_locks')
@Index(['seatId', 'expiresAt'])
@Index(['userId', 'expiresAt'])
export class SeatLock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  seatId: string;

  @ManyToOne(() => Seat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seatId' })
  seat: Seat;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column()
  @Index()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
