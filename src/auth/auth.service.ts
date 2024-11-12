import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { UserRole } from './decorators/roles.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly smsService: SmsService,
    private readonly redisService: RedisService,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  async sendVerificationCode(phoneNumber: string, type: 'login' | 'register'): Promise<{ message: string }> {
    try {
      // 사용자 존재 여부 확인
      const existingUser = await this.userService.findByPhone(phoneNumber);

      // 회원가입시 이미 가입된 번호면 에러
      if (type === 'register' && existingUser) {
        throw new Error('이미 가입된 휴대폰 번호입니다.');
      }

      // 로그인시 미가입 번호면 에러
      if (type === 'login' && !existingUser) {
        throw new Error('가입되지 않은 휴대폰 번호입니다.');
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // SMS 발송 횟수 제한 체크 (시간당 3회)
      const requestCount = await this.redisService.get(`sms:count:${phoneNumber}`);
      if (requestCount && parseInt(requestCount) >= 3) {
        throw new Error('너무 많은 요청입니다. 1시간 후 다시 시도해주세요.');
      }

      // Redis에 인증번호 저장 (5분 유효)
      await this.redisService.set(`verification:${type}:${phoneNumber}`, verificationCode, 300);

      // SMS 발송 횟수 카운트 (1시간 유효)
      await this.redisService.set(
        `sms:count:${phoneNumber}`,
        requestCount ? (parseInt(requestCount) + 1).toString() : '1',
        3600,
      );

      // SMS 발송
      await this.smsService.sendSMS(
        phoneNumber,
        `[인증번호: ${verificationCode}] ${type === 'register' ? '회원가입' : '로그인'} 인증번호입니다.`,
      );

      return { message: '인증번호가 발송되었습니다.' };
    } catch (error) {
      throw new Error(error.message || '인증번호 발송에 실패했습니다.');
    }
  }

  async verifyPhone(data: VerifyCodeDto, type: 'login' | 'register'): Promise<{ verified: boolean; token: string }> {
    const { phoneNumber, code } = data;

    const savedCode = await this.redisService.get(`verification:${type}:${phoneNumber}`);
    if (!savedCode) {
      throw new Error('인증번호가 만료되었습니다.');
    }

    if (savedCode !== code) {
      throw new Error('잘못된 인증번호입니다.');
    }

    // 인증 성공시 인증 토큰 발급 (30분 유효)
    const verificationToken = this.generateToken();
    await this.redisService.set(`verified:${type}:${phoneNumber}`, verificationToken, 1800);

    // 로그인인 경우 바로 JWT 토큰 발급
    if (type === 'login') {
      const user = await this.userService.findByPhone(phoneNumber);
      const accessToken = await this.generateAccessToken(user);

      // 인증 정보 삭제
      await this.redisService.del(`verified:${type}:${phoneNumber}`);

      return {
        verified: true,
        token: accessToken,
      };
    }

    // 회원가입인 경우 verification 토큰 반환
    return {
      verified: true,
      token: verificationToken,
    };
  }

  async register(data: RegisterDto): Promise<any> {
    const { phoneNumber, name, role = UserRole.USER } = data;

    // 인증 여부 확인
    const verificationToken = await this.redisService.get(`verified:register:${phoneNumber}`);
    if (!verificationToken) {
      throw new Error('휴대폰 인증이 필요합니다.');
    }

    // 사용자 생성
    const user = await this.userService.createUser({
      phoneNumber,
      name,
      role,
    });

    // 인증 정보 삭제
    await this.redisService.del(`verified:register:${phoneNumber}`);

    // JWT 토큰 발급
    const accessToken = await this.generateAccessToken(user);

    return {
      user,
      accessToken,
    };
  }

  private generateToken(): string {
    return Math.random().toString(36).substr(2);
  }

  private generateAccessToken(user: any): string {
    return this.jwtService.sign({
      sub: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });
  }
}
