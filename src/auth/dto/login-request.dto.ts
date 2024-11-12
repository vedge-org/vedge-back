import { IsPhoneNumber, IsString } from 'class-validator';

export class LoginRequestDto {
  @IsString()
  @IsPhoneNumber('KR')
  phoneNumber: string;
}
