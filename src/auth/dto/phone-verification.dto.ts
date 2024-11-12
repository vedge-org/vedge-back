import { IsPhoneNumber, IsString } from 'class-validator';

export class PhoneVerificationDto {
  @IsString()
  @IsPhoneNumber('KR')
  phoneNumber: string;
}
