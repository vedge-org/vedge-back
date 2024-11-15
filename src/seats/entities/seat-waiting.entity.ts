import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Cell } from './seat.entity';

@Entity('seat_wait_list')
@Index(['cellId', 'userId'], { unique: true })
export class SeatWaitList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cell, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cellId' })
  cell: Cell;

  @Column()
  @Index()
  cellId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
