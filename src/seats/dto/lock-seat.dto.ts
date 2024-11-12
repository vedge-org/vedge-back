import { IsArray, IsUUID, ArrayMaxSize, ArrayMinSize, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LockSeatDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @IsUUID('4', { each: true })
  @ApiProperty({
    description: '잠금할 좌석 ID 배열',
    type: [String],
    example: ['uuid1', 'uuid2'],
  })
  seatIds: string[];

  @IsString()
  @ApiProperty({
    description: '예매자 이름',
    example: '홍길동',
  })
  name: string;
}
