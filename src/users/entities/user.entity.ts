import { UserRole } from 'src/auth/decorators/roles.decorator';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column()
  name: string;

  @OneToMany(() => Ticket, (ticket) => ticket.user)
  ticketList: Ticket[];

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;
}
