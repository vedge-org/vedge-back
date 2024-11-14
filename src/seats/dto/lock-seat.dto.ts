import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LockSeatDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @ApiProperty({
    description: '잠금 처리할 좌석 ID 배열',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  seatIds: string[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '예매자 이름',
    example: '홍길동',
  })
  name: string;
}
