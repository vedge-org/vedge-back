import { Controller, Get, Post, Body, Param, UseGuards, Query, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SeatsService } from './seats.service';
import { CreateSeatMapDto } from './dto/create-seat-map.dto';
import { LockSeatDto } from './dto/lock-seat.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('seats')
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post('map')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '좌석 배치도 생성' })
  @ApiResponse({ status: 201, description: '좌석 배치도 생성 성공' })
  async createSeatMap(@Body() createSeatMapDto: CreateSeatMapDto) {
    try {
      const result = await this.seatsService.createSeatMap(createSeatMapDto);
      return {
        statusCode: HttpStatus.CREATED,
        message: '좌석 배치도가 생성되었습니다.',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('available/:scheduleId')
  @ApiOperation({ summary: '예매 가능한 좌석 조회' })
  @ApiResponse({ status: 200, description: '좌석 조회 성공' })
  async getAvailableSeats(@Param('scheduleId') scheduleId: string) {
    const seats = await this.seatsService.findAvailableSeats(scheduleId);
    return {
      statusCode: HttpStatus.OK,
      message: '좌석 조회 성공',
      data: seats,
    };
  }

  @Post('lock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '좌석 임시 잠금' })
  @ApiResponse({ status: 200, description: '좌석 잠금 성공' })
  async lockSeats(@Body() lockSeatDto: LockSeatDto, @CurrentUser() user: User) {
    try {
      const { seatIds, name } = lockSeatDto;
      await this.seatsService.lockSeats(seatIds, name, user.id);
      return {
        statusCode: HttpStatus.OK,
        message: '좌석이 잠금 처리되었습니다.',
        data: {
          lockedSeats: seatIds,
          name,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('map/:scheduleId')
  @ApiOperation({ summary: '좌석 배치도 조회' })
  @ApiResponse({ status: 200, description: '좌석 배치도 조회 성공' })
  async getSeatMap(@Param('scheduleId') scheduleId: string) {
    const seatMap = await this.seatsService.getSeatMap(scheduleId);
    return {
      statusCode: HttpStatus.OK,
      message: '좌석 배치도 조회 성공',
      data: seatMap,
    };
  }

  @Get(':seatId')
  @ApiOperation({ summary: '좌석 상세 정보 조회' })
  @ApiResponse({ status: 200, description: '좌석 상세 정보 조회 성공' })
  async getSeatDetails(@Param('seatId') seatId: string) {
    const seatDetails = await this.seatsService.getSeatDetails(seatId);
    return {
      statusCode: HttpStatus.OK,
      message: '좌석 상세 정보 조회 성공',
      data: seatDetails,
    };
  }
}
