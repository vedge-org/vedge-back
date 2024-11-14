import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { UserRole } from './decorators/roles.decorator';
import { Session } from 'express-session';

interface SessionData {
  userId?: string;
  user?: any;
  verified?: boolean;
  verificationType?: 'login' | 'register';
  phoneNumber?: string;
}

export interface CustomSession extends Session {
  data: SessionData;
  destroy: (callback?: (err?: any) => void) => void;
  cookie: {
    maxAge?: number;
  };
}

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

      const verificationKey = `verification:${type}:${phoneNumber}`;
      await this.redisService.set(verificationKey, verificationCode, 300);
      await this.redisService.set(requestKey, requestCount ? (parseInt(requestCount) + 1).toString() : '1', 3600);

      await this.smsService.sendSMS(
        phoneNumber,
        `[Vedge]\n${type === 'register' ? '회원가입' : '로그인'} 인증번호는 [${verificationCode}]입니다.`,
      );

      return { message: '인증번호가 발송되었습니다.' };
    } catch (error) {
      throw new Error(error.message || '인증번호 발송에 실패했습니다.');
    }
  }

  async verifyPhone(
    data: VerifyCodeDto,
    type: 'login' | 'register',
    session: CustomSession,
  ): Promise<{ verified: boolean }> {
    const { phoneNumber, code } = data;
    const verificationKey = `verification:${type}:${phoneNumber}`;

    const savedCode = await this.redisService.get(verificationKey);
    if (!savedCode || savedCode !== code) {
      throw new Error(savedCode ? '잘못된 인증번호입니다.' : '인증번호가 만료되었습니다.');
    }

    if (!session.data) {
      session.data = {};
    }

    session.data.verified = true;
    session.data.phoneNumber = phoneNumber;
    session.data.verificationType = type;

    if (type === 'login') {
      const user = await this.userService.findByPhone(phoneNumber);
      session.data.userId = user.id;
      session.data.user = user;

      await this.redisService.del(verificationKey);
    }

    return { verified: true };
  }

  async register(data: RegisterDto, session: CustomSession): Promise<any> {
    const { phoneNumber, name, role = UserRole.USER } = data;

    if (
      !session.data?.verified ||
      session.data?.verificationType !== 'register' ||
      session.data?.phoneNumber !== phoneNumber
    ) {
      throw new Error('휴대폰 인증이 필요합니다.');
    }

    const user = await this.userService.createUser({
      phoneNumber,
      name,
      role,
    });

    session.data.userId = user.id;
    session.data.user = user;
    session.data.verified = false;
    session.data.verificationType = undefined;

    return { user };
  }

  async logout(session: CustomSession): Promise<void> {
    return new Promise((resolve, reject) => {
      session.destroy((err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}
