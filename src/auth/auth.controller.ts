import { Controller, Post, Body, Session, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PhoneVerificationDto } from './dto/phone-verification.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { SessionGuard } from './guards/session.guard';

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
  @ApiOperation({ summary: '인증번호 확인 (회원가입)' })
  @ApiResponse({ status: 200, description: '인증번호 확인 성공' })
  async verifyPhone(@Body() data: VerifyCodeDto, @Session() session: Record<string, any>) {
    return this.authService.verifyPhone(data, 'register', session);
  }

  @Post('login/verify')
  @ApiOperation({ summary: '로그인 인증번호 확인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  async verifyLogin(@Body() data: VerifyCodeDto, @Session() session: Record<string, any>) {
    return this.authService.verifyPhone(data, 'login', session);
  }

  @Post('register')
  @ApiOperation({ summary: '회원가입 (인증완료 후)' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  async register(@Body() data: RegisterDto, @Session() session: Record<string, any>) {
    return this.authService.register(data, session);
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Session() session: Record<string, any>) {
    await this.authService.logout(session);
    return { message: '로그아웃되었습니다.' };
  }

  @Post('session/extend')
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: '세션 연장' })
  @ApiResponse({ status: 200, description: '세션 연장 성공' })
  async extendSession(@Session() session: Record<string, any>) {
    session.cookie.maxAge = 60 * 60 * 1000; // 1시간으로 연장
    return { message: '세션이 연장되었습니다.' };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: '현재 로그인된 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  async getMe(@Session() session: Record<string, any>) {
    return { user: session.user };
  }
}
