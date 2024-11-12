import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNumber, Min } from 'class-validator';

export class ReserveTicketDto {
  @IsUUID()
  @ApiProperty({ description: '공연 일정 ID' })
  eventScheduleId: string;

  @IsString()
  @ApiProperty({ description: '좌석 정보 (JSON string)' })
  seatMap: string;

  @IsNumber()
  @Min(1)
  @ApiProperty({ description: '예매 매수' })
  count: number;
}
