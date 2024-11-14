import { EventSchedule } from 'src/events/entities/event-schedule.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Check,
  Index,
  JoinColumn,
} from 'typeorm';

// 좌석 타입 enum
export enum CellType {
  SEAT = 'SEAT',
  EMPTY = 'EMPTY',
  AISLE = 'AISLE',
}

@Entity()
@Index(['name'])
export class SeatMap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name: string;

  @OneToMany(() => Section, (section) => section.seatMap, {
    cascade: true,
    eager: true,
    nullable: false,
  })
  sections: Section[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => EventSchedule, (schedule) => schedule.seatMap, { onDelete: 'CASCADE' })
  schedules: EventSchedule[];

  @BeforeInsert()
  @BeforeUpdate()
  validateSections() {
    if (!this.sections || this.sections.length === 0) {
      throw new Error('SeatMap must have at least one section');
    }
  }
}

@Entity()
@Index(['seatMap', 'rowIndex'])
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('json', {
    nullable: false,
  })
  aisleIndex: number[];

  @ManyToOne(() => SeatMap, (seatMap) => seatMap.sections, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  seatMap: SeatMap;

  @OneToMany(() => SeatColumn, (column) => column.section, {
    cascade: true,
    eager: true,
    nullable: false,
  })
  columns: SeatColumn[];

  @Column('int')
  rowIndex: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  validateSection() {
    if (!this.columns || this.columns.length === 0) {
      throw new Error('Section must have at least one column');
    }

    if (this.aisleIndex) {
      const maxColumnIndex = this.columns.length - 1;
      for (const index of this.aisleIndex) {
        if (index < 0 || index > maxColumnIndex) {
          throw new Error('Invalid aisle index');
        }
      }
    }
  }
}

@Entity()
@Index(['section', 'columnIndex'])
@Check(`"type" IN ('${CellType.SEAT}', '${CellType.EMPTY}', '${CellType.AISLE}')`)
export class SeatColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CellType,
    default: CellType.SEAT,
    nullable: false,
  })
  type: CellType;

  @ManyToOne(() => Section, (section) => section.columns, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  section: Section;

  @OneToMany(() => Cell, (cell) => cell.column, {
    cascade: true,
    eager: true,
  })
  cells: Cell[];

  @Column('int')
  columnIndex: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  validateCells() {
    if ((this.type === CellType.AISLE || this.type === CellType.EMPTY) && this.cells?.length > 0) {
      throw new Error(`${this.type} columns cannot have cells`);
    }

    if (this.type === CellType.SEAT && (!this.cells || this.cells.length === 0)) {
      throw new Error('SEAT columns must have at least one cell');
    }
  }
}

@Entity()
@Index(['column', 'rowIndex'])
@Check(`"type" IN ('${CellType.SEAT}', '${CellType.EMPTY}', '${CellType.AISLE}')`)
export class Cell {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CellType,
    default: CellType.SEAT,
    nullable: false,
  })
  type: CellType;

  @Column({
    nullable: true,
    type: 'boolean',
  })
  isAvailable: boolean;

  @ManyToOne(() => SeatColumn, (column) => column.cells, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  column: SeatColumn;

  @Column('int')
  rowIndex: number;

  @Column()
  @Index()
  eventScheduleId: string;

  @ManyToOne(() => EventSchedule, (schedule) => schedule.seatMap, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventScheduleId' })
  eventSchedule: EventSchedule;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  validateCell() {
    if (this.type !== CellType.SEAT && this.isAvailable !== undefined) {
      throw new Error('isAvailable can only be set for SEAT type');
    }

    if (this.type === CellType.SEAT && this.isAvailable === undefined) {
      throw new Error('SEAT type must have isAvailable value');
    }
  }
}
