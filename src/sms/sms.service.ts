import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SolapiMessageService } from 'solapi';

@Injectable()
export class SmsService {
  private readonly messageService: any;
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SOLAPI_API_KEY');
    const apiSecret = this.configService.get<string>('SOLAPI_API_SECRET');
    this.messageService = new SolapiMessageService(apiKey, apiSecret);
  }

  async sendSMS(to: string, verificationCode: string): Promise<any> {
    try {
      const message = {
        text: `[Vedge]\n인증번호는 [${verificationCode}]입니다.`,
        to,
        from: this.configService.get<string>('SOLAPI_SENDER_NUMBER'),
      };

      const result = await this.messageService.sendMany([message]);
      this.logger.log(`SMS sent successfully to ${to}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
      throw error;
    }
  }
}
