import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PhoneVerificationDto } from './dto/phone-verification.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { LoginRequestDto } from './dto/login-request.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('phone/request')
  @ApiOperation({ summary: '휴대폰 인증번호 요청 (회원가입)' })
  async requestVerification(@Body() data: PhoneVerificationDto) {
    return this.authService.sendVerificationCode(data.phoneNumber, 'register');
  }

  @Post('login/request')
  @ApiOperation({ summary: '로그인 인증번호 요청' })
  async requestLoginVerification(@Body() data: LoginRequestDto) {
    return this.authService.sendVerificationCode(data.phoneNumber, 'login');
  }

  @Post('phone/verify')
  @ApiOperation({ summary: '인증번호 확인 (회원가입)' })
  async verifyPhone(@Body() data: VerifyCodeDto) {
    return this.authService.verifyPhone(data, 'register');
  }

  @Post('login/verify')
  @ApiOperation({ summary: '로그인 인증번호 확인' })
  async verifyLogin(@Body() data: VerifyCodeDto) {
    return this.authService.verifyPhone(data, 'login');
  }

  @Post('register')
  @ApiOperation({ summary: '회원가입 (인증완료 후)' })
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }
}
