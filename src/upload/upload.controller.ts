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
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { multerOptions } from '../multer.config';
import { UploadService } from './upload.service';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('poster')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
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
  @ApiConsumes('multipart/form-data')
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
  @ApiConsumes('multipart/form-data')
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
