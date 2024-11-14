import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MinioService } from '../minio/minio.service';
import { UploadService } from './upload.service';
import { v4 as uuidv4 } from 'uuid';
import { FileType } from './type/fileType';

@ApiTags('파일 업로드')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly minioService: MinioService,
    private readonly uploadService: UploadService,
  ) {}

  private generateFilename(originalname: string): string {
    const extension = originalname.split('.').pop();
    return `${uuidv4()}.${extension}`;
  }

  @Post('poster')
  @ApiOperation({
    summary: '포스터 이미지 업로드',
    description: '공연 포스터 이미지를 업로드합니다. 최대 5MB, png/jpeg/jpg 형식만 허용됩니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '업로드할 포스터 이미지 파일',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '포스터 업로드 성공' })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식 또는 크기' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPoster(@UploadedFile() file: Express.Multer.File) {
    const filename = this.generateFilename(file.originalname);
    const url = await this.minioService.uploadFile(
      new File([file.buffer], file.originalname),
      filename,
      FileType.POSTER,
    );

    const fileInfo = await this.uploadService.saveFileInfo(filename, file.originalname, FileType.POSTER, url);

    return {
      message: '포스터가 업로드되었습니다.',
      file: fileInfo,
    };
  }

  @Post('ticket')
  @ApiOperation({ summary: '티켓 이미지 업로드', description: '공연 티켓 이미지를 업로드합니다.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '업로드할 티켓 이미지 파일',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '티켓 업로드 성공' })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식 또는 크기' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadTicket(@UploadedFile() file: Express.Multer.File) {
    const filename = this.generateFilename(file.originalname);
    const url = await this.minioService.uploadFile(
      new File([file.buffer], file.originalname),
      filename,
      FileType.TICKET,
    );

    const fileInfo = await this.uploadService.saveFileInfo(filename, file.originalname, FileType.TICKET, url);

    return {
      message: '티켓이 업로드되었습니다.',
      file: fileInfo,
    };
  }

  @Post('multiple')
  @ApiOperation({ summary: '다중 파일 업로드', description: '최대 10개의 파일을 한 번에 업로드합니다.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '업로드할 파일들 (최대 10개)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '다중 파일 업로드 성공' })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식 또는 크기' })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const filename = this.generateFilename(file.originalname);
        const url = await this.minioService.uploadFile(
          new File([file.buffer], file.originalname),
          filename,
          FileType.OTHER,
        );
        return this.uploadService.saveFileInfo(filename, file.originalname, FileType.OTHER, url);
      }),
    );

    return {
      message: `${files.length}개의 파일이 업로드되었습니다.`,
      files: uploadedFiles,
    };
  }
}
