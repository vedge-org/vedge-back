import { IsString, IsNumber, IsUUID, IsArray, ValidateNested, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SeatRow {
  @IsString()
  @ApiProperty({ example: 'A' })
  rowName: string;

  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 20 })
  seatsPerRow: number;
}

export class CreateSeatMapDto {
  @IsUUID()
  @ApiProperty({ example: 'event-schedule-uuid' })
  eventScheduleId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatRow)
  @ApiProperty({ type: [SeatRow] })
  rows: SeatRow[];
}
