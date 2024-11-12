import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString } from 'class-validator';

export class PhoneVerificationDto {
  @IsString()
  @IsPhoneNumber('KR')
  @ApiProperty({
    type: String,
    description: '휴대폰 번호',
    example: '01012345678',
  })
  phoneNumber: string;
}
