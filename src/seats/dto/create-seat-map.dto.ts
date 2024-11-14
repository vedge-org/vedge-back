import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsEnum,
  IsInt,
  Min,
  ArrayMinSize,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CellType } from '../entities/seat.entity';

export class CreateCellDto {
  @ApiProperty({ enum: CellType, description: '좌석 타입 (SEAT/EMPTY/AISLE)' })
  @IsEnum(CellType)
  type: CellType;

  @ApiProperty({ description: '좌석의 행 인덱스' })
  @IsInt()
  @Min(0)
  rowIndex: number;
}

export class CreateSeatColumnDto {
  @ApiProperty({ enum: CellType, description: '열 타입 (SEAT/EMPTY/AISLE)' })
  @IsEnum(CellType)
  type: CellType;

  @ApiProperty({ description: '열 인덱스' })
  @IsInt()
  @Min(0)
  columnIndex: number;

  @ApiProperty({ type: [CreateCellDto], description: '좌석 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCellDto)
  cells: CreateCellDto[];
}

export class CreateSectionDto {
  @ApiProperty({ type: [Number], description: '통로 인덱스 배열' })
  @IsArray()
  @IsInt({ each: true })
  aisleIndex: number[];

  @ApiProperty({ description: '구역 행 인덱스' })
  @IsInt()
  @Min(0)
  rowIndex: number;

  @ApiProperty({ type: [CreateSeatColumnDto], description: '열 목록' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSeatColumnDto)
  columns: CreateSeatColumnDto[];
}

export class CreateSeatMapDto {
  @ApiProperty({ description: '좌석 배치도 이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: [CreateSectionDto], description: '구역 목록' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateSectionDto)
  sections: CreateSectionDto[];
}
