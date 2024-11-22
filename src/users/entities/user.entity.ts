import { UserRole } from 'src/auth/decorators/roles.decorator';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

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

  @Column('text')
  embedding: string;

  // JSON -> String (저장 전 변환)
  @BeforeInsert()
  @BeforeUpdate()
  stringifyEmbedding() {
    if (this.embedding && typeof this.embedding !== 'string') {
      this.embedding = JSON.stringify(this.embedding);
    }
  }

  // String -> JSON (조회 후 변환)
  @AfterLoad()
  parseEmbedding() {
    if (this.embedding) {
      this.embedding = JSON.parse(this.embedding);
    }
  }
}
