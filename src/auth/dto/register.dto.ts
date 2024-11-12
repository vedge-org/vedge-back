import { IsEnum, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { UserRole } from '../decorators/roles.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsString()
  @IsPhoneNumber('KR')
  @ApiProperty({ description: '휴대폰 번호' })
  phoneNumber: string;

  @IsString()
  @MinLength(2)
  @ApiProperty({ description: '이름' })
  name: string;

  @IsEnum(['USER', 'ADMIN'])
  @ApiProperty({ description: '사용자 권한' })
  role?: UserRole;
}
