// upload/upload.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { multerOptions } from '../multer.config';
import { UploadService } from './upload.service';

@ApiTags('파일 업로드')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

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
  @UseInterceptors(FileInterceptor('file', multerOptions('poster')))
  async uploadPoster(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileInfo = await this.uploadService.saveFileInfo(
      file.filename,
      file.originalname,
      'poster',
      `uploads/posters/${file.filename}`,
    );

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
  @UseInterceptors(FileInterceptor('file', multerOptions('ticket')))
  async uploadTicket(@UploadedFile() file: Express.Multer.File) {
    const fileInfo = await this.uploadService.saveFileInfo(
      file.filename,
      file.originalname,
      'ticket',
      `uploads/tickets/${file.filename}`,
    );

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
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions('other')))
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    const uploadedFiles = await Promise.all(
      files.map((file) =>
        this.uploadService.saveFileInfo(file.filename, file.originalname, 'other', `uploads/others/${file.filename}`),
      ),
    );

    return {
      message: `${files.length}개의 파일이 업로드되었습니다.`,
      files: uploadedFiles,
    };
  }
}
