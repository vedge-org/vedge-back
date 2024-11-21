import { IsEnum, IsString, IsNumber, IsDate, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EventCategory } from '../entities/event.entity';
import { CreateSeatMapDto } from 'src/seats/dto/create-seat-map.dto';

export class CreateEventScheduleDto {
  @IsDate()
  @Type(() => Date)
  @ApiProperty({ example: '2024-10-04' })
  date: Date;

  @IsString()
  @ApiProperty({ example: '19:00' })
  time: string;
}

export class CreateEventDetailImageDto {
  @IsString()
  @ApiProperty({ example: 'https://s3.bucket url' })
  imageUrl: string;
}

export class CreateEventDto {
  @IsEnum(EventCategory)
  @ApiProperty({ enum: EventCategory })
  category: EventCategory;

  @IsString()
  @ApiProperty({ example: '올림픽공원 체조경기장' })
  address: string;

  @IsString()
  @ApiProperty({ example: '2NE1 COMEBACK CONCERT' })
  title: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 180 })
  duration: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 15 })
  viewingAge: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  posterImage?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  ticketImage?: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ example: '2024-09-20T10:00:00Z' })
  startAvailable: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ example: '2024-10-03T15:00:00Z' })
  endAvailable: Date;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 110000 })
  amount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventScheduleDto)
  @ApiProperty({ type: [CreateEventScheduleDto] })
  schedule: CreateEventScheduleDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventDetailImageDto)
  @ApiProperty({ type: [CreateEventDetailImageDto] })
  detailImages: CreateEventDetailImageDto[];

  @ValidateNested()
  @Type(() => CreateSeatMapDto)
  @ApiProperty({ type: CreateSeatMapDto })
  seatMap: CreateSeatMapDto;
}
