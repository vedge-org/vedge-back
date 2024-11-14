import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { FileType } from '../type/fileType';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column()
  type: FileType;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  url: string;
}
