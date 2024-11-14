import { ConfigModule } from '@nestjs/config';
import { MinioService } from './minio.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule],
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}
