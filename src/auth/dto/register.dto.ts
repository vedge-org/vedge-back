import { IsEnum, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { UserRole } from '../decorators/roles.decorator';

export class RegisterDto {
  @IsString()
  @IsPhoneNumber('KR')
  phoneNumber: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(['USER', 'ADMIN'])
  role?: UserRole;
}
