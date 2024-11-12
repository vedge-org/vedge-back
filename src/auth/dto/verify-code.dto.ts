import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @IsPhoneNumber('KR')
  @ApiProperty({
    type: String,
    description: '휴대폰 번호',
    example: '01012345678',
  })
  phoneNumber: string;

  @IsString()
  @Length(6, 6)
  @ApiProperty({
    type: String,
    description: '인증 코드',
    example: '123456',
  })
  code: string;
}
