import { Controller, Post, Body, Session, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PhoneVerificationDto } from './dto/phone-verification.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { SessionGuard } from './guards/session.guard';
import { Session as ExpressSession } from 'express-session';

interface SessionData {
  userId?: string;
  user?: any;
  verified?: boolean;
  verificationType?: 'login' | 'register';
  phoneNumber?: string;
}

export interface CustomSession extends ExpressSession {
  data: SessionData;
  destroy: (callback?: (err?: any) => void) => void;
  cookie: {
    maxAge?: number;
  };
  save: (callback: (err?: any) => void) => void;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('phone/request')
  @ApiOperation({ summary: '휴대폰 인증번호 요청 (회원가입)' })
  @ApiResponse({ status: 200, description: '인증번호 발송 성공' })
  async requestVerification(@Body() data: PhoneVerificationDto) {
    return this.authService.sendVerificationCode(data.phoneNumber, 'register');
  }

  @Post('login/request')
  @ApiOperation({ summary: '로그인 인증번호 요청' })
  @ApiResponse({ status: 200, description: '인증번호 발송 성공' })
  async requestLoginVerification(@Body() data: LoginRequestDto) {
    return this.authService.sendVerificationCode(data.phoneNumber, 'login');
  }
  @Post('phone/verify')
  async verifyPhone(@Body() data: VerifyCodeDto, @Session() session: CustomSession) {
    if (!session.data) {
      session.data = {
        verified: false,
        phoneNumber: '',
        verificationType: undefined,
        userId: undefined,
        user: undefined,
      };
    }
    return this.authService.verifyPhone(data, 'register', session);
  }

  @Post('login/verify')
  async verifyLogin(@Body() data: VerifyCodeDto, @Session() session: CustomSession) {
    if (!session.data) {
      session.data = {
        verified: false,
        phoneNumber: '',
        verificationType: undefined,
        userId: undefined,
        user: undefined,
      };
    }
    return this.authService.verifyPhone(data, 'login', session);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  async getMe(@Session() session: CustomSession) {
    if (!session.data) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }
    return { user: session.data.user };
  }

  @Post('register')
  @ApiOperation({ summary: '회원가입 (인증완료 후)' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  async register(@Body() data: RegisterDto, @Session() session: CustomSession) {
    return this.authService.register(data, session);
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Session() session: CustomSession) {
    await this.authService.logout(session);
    return { message: '로그아웃되었습니다.' };
  }

  @Post('session/extend')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: '세션 연장' })
  @ApiResponse({ status: 200, description: '세션 연장 성공' })
  async extendSession(@Session() session: CustomSession) {
    if (!session.data) {
      throw new UnauthorizedException('세션 데이터가 없습니다.');
    }

    // 세션 쿠키 maxAge 업데이트 (1시간)
    session.cookie.maxAge = 60 * 60 * 1000;

    // 세션 저장
    await new Promise<void>((resolve, reject) => {
      session.save((err) => {
        if (err) reject(new Error('세션 저장 실패'));
        resolve();
      });
    });

    return {
      cookie: {
        originalMaxAge: session.cookie.maxAge,
        expires: new Date(Date.now() + session.cookie.maxAge!).toISOString(),
      },
      data: session.data,
    };
  }
}
