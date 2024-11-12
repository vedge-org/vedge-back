import { IsString, IsNotEmpty, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '홍길동', description: '사용자 이름' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^010\d{8}$/, { message: '올바른 전화번호 형식이 아닙니다.' })
  @ApiProperty({ example: '01012345678', description: '전화번호' })
  phone: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/, {
    message: '비밀번호는 최소 8자 이상, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.',
  })
  @ApiProperty({
    example: 'Password123!',
    description: '비밀번호 (8-20자, 대소문자, 숫자, 특수문자 포함)',
  })
  password: string;
}
