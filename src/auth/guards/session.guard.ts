import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Session } from 'express-session';

// 세션 인터페이스 정의
interface SessionData {
  userId: string;
  user: any;
  verified?: boolean;
  verificationType?: 'login' | 'register';
  phoneNumber?: string;
  cookie: {
    maxAge?: number;
  };
}

interface CustomSession extends Session {
  data: SessionData;
}

@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = request.session as CustomSession;

    if (!session?.data?.userId) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    return true;
  }
}
