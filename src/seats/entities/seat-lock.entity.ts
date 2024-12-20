import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Cell } from './seat.entity';

@Entity('seat_locks')
@Index(['seatId', 'expiresAt'])
@Index(['userId', 'expiresAt'])
export class SeatLock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  seatId: string;

  @ManyToOne(() => Cell, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seatId' })
  seat: Cell;

  @Column('uuid')
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 100 })
  name: string;

  @Column('datetime')
  @Index()
  expiresAt: Date;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
