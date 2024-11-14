import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { UserRole } from './decorators/roles.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly smsService: SmsService,
    private readonly redisService: RedisService,
    private readonly userService: UsersService,
  ) {}

  async sendVerificationCode(phoneNumber: string, type: 'login' | 'register'): Promise<{ message: string }> {
    try {
      const existingUser = await this.userService.findByPhone(phoneNumber);

      if (type === 'register' && existingUser) {
        throw new Error('이미 가입된 휴대폰 번호입니다.');
      }

      if (type === 'login' && !existingUser) {
        throw new Error('가입되지 않은 휴대폰 번호입니다.');
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const requestKey = `sms:count:${phoneNumber}`;
      const requestCount = await this.redisService.get(requestKey);

      if (requestCount && parseInt(requestCount) >= 3) {
        throw new Error('너무 많은 요청입니다. 1시간 후 다시 시도해주세요.');
      }

      // Session ID를 포함한 키 생성
      const verificationKey = `verification:${type}:${phoneNumber}`;
      await this.redisService.set(verificationKey, verificationCode, 300);
      await this.redisService.set(requestKey, requestCount ? (parseInt(requestCount) + 1).toString() : '1', 3600);

      await this.smsService.sendSMS(
        phoneNumber,
        `[Vedge]\n[인증번호: ${verificationCode}] ${type === 'register' ? '회원가입' : '로그인'} 인증번호입니다.`,
      );

      return { message: '인증번호가 발송되었습니다.' };
    } catch (error) {
      throw new Error(error.message || '인증번호 발송에 실패했습니다.');
    }
  }

  async verifyPhone(
    data: VerifyCodeDto,
    type: 'login' | 'register',
    session: Record<string, any>,
  ): Promise<{ verified: boolean; token?: string }> {
    const { phoneNumber, code } = data;
    const verificationKey = `verification:${type}:${phoneNumber}`;

    const savedCode = await this.redisService.get(verificationKey);
    if (!savedCode || savedCode !== code) {
      throw new Error(savedCode ? '잘못된 인증번호입니다.' : '인증번호가 만료되었습니다.');
    }

    // 인증 성공 시 세션에 저장
    session.verified = true;
    session.phoneNumber = phoneNumber;
    session.verificationType = type;

    if (type === 'login') {
      const user = await this.userService.findByPhone(phoneNumber);
      session.userId = user.id;
      session.user = user;

      await this.redisService.del(verificationKey);
      return { verified: true };
    }

    return { verified: true };
  }

  async register(data: RegisterDto, session: Record<string, any>): Promise<any> {
    const { phoneNumber, name, role = UserRole.USER } = data;

    if (!session.verified || session.verificationType !== 'register' || session.phoneNumber !== phoneNumber) {
      throw new Error('휴대폰 인증이 필요합니다.');
    }

    const user = await this.userService.createUser({
      phoneNumber,
      name,
      role,
    });

    // 세션 업데이트
    session.userId = user.id;
    session.user = user;
    session.verified = false;
    session.verificationType = null;

    return { user };
  }

  async logout(session: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      session.destroy((err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}
