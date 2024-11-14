import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { HttpException, HttpStatus } from '@nestjs/common';

export const multerConfig = {
  poster: {
    dest: './uploads/posters/',
  },
  ticket: {
    dest: './uploads/tickets/',
  },
  other: {
    dest: './uploads/others/',
  },
};

Object.values(multerConfig).forEach(({ dest }) => {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
});

export const multerOptions = (fileType: 'poster' | 'ticket' | 'other') => ({
  storage: diskStorage({
    destination: multerConfig[fileType].dest,
    filename: (req, file, cb) => {
      // 파일 이름을 유니크하게 생성
      const uniqueName = `${uuid()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      cb(null, true);
    } else {
      cb(new HttpException('지원하지 않는 파일 형식입니다.', HttpStatus.BAD_REQUEST), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
