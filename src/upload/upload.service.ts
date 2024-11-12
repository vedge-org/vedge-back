import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
  ) {}

  async saveFileInfo(fileName: string, originalName: string, type: string, url: string): Promise<FileEntity> {
    const fileInfo = this.fileRepository.create({
      fileName,
      originalName,
      type,
      url,
    });
    return await this.fileRepository.save(fileInfo);
  }

  async getFileInfo(id: number): Promise<FileEntity> {
    return await this.fileRepository.findOne({ where: { id } });
  }
}
