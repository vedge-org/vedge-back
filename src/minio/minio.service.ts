import * as Minio from 'minio';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileType } from 'src/upload/type/fileType';

const BUCKET_NAME = 'vedge';

@Injectable()
export class MinioService {
  constructor(private readonly configService: ConfigService) {}

  async uploadFile(file: File, fileName: string, type: FileType) {
    const minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_URL'),
      useSSL: true,
      accessKey: this.configService.get('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get('MINIO_SECRET_KEY'),
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = type ? `${type}/${fileName}` : fileName;
    await minioClient.putObject(BUCKET_NAME, path, buffer, file.size);
    return `https://${this.configService.get('MINIO_URL')}/${BUCKET_NAME}/${path}`;
  }
}
