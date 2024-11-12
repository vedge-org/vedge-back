import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @IsPhoneNumber('KR')
  phoneNumber: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
