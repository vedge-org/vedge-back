import { Controller, Get, Post, Body, Param, UseGuards, Query, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionGuard } from 'src/auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SeatsService } from './seats.service';
import { CreateSeatMapDto } from './dto/create-seat-map.dto';
import { LockSeatDto } from './dto/lock-seat.dto';
import { User } from '../users/entities/user.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';

@ApiTags('좌석')
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post('map')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Auth()
  @ApiOperation({ summary: '좌석 배치도 생성', description: '관리자가 공연장의 좌석 배치도를 생성합니다.' })
  @ApiResponse({ status: 201, description: '좌석 배치도 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
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
  @ApiOperation({ summary: '예매 가능한 좌석 조회', description: '특정 공연 일정의 예매 가능한 좌석을 조회합니다.' })
  @ApiResponse({ status: 200, description: '좌석 조회 성공' })
  @ApiResponse({ status: 404, description: '일정을 찾을 수 없음' })
  async getAvailableSeats(@Param('scheduleId') scheduleId: string) {
    try {
      const seats = await this.seatsService.findAvailableSeats(scheduleId);
      return {
        statusCode: HttpStatus.OK,
        message: '좌석 조회 성공',
        data: seats,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('lock')
  @UseGuards(SessionGuard)
  @Auth()
  @ApiOperation({ summary: '좌석 임시 잠금', description: '예매 진행 중 좌석을 임시로 잠금 처리합니다.' })
  @ApiResponse({ status: 200, description: '좌석 잠금 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async lockSeats(@Body() lockSeatDto: LockSeatDto, @CurrentUser() user: User) {
    try {
      const result = await this.seatsService.lockSeats(lockSeatDto.seatIds, lockSeatDto.name, user.id);
      return {
        statusCode: HttpStatus.OK,
        message: '좌석이 잠금 처리되었습니다.',
        data: {
          lockedSeats: lockSeatDto.seatIds,
          name: lockSeatDto.name,
          expiresAt: result.expiresAt,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('map/:scheduleId')
  @Auth()
  @ApiOperation({ summary: '좌석 배치도 조회', description: '특정 공연 일정의 전체 좌석 배치도를 조회합니다.' })
  @ApiResponse({ status: 200, description: '좌석 배치도 조회 성공' })
  @ApiResponse({ status: 404, description: '일정을 찾을 수 없음' })
  async getSeatMap(@Param('scheduleId') scheduleId: string) {
    try {
      const seatMap = await this.seatsService.getSeatMap(scheduleId);
      return {
        statusCode: HttpStatus.OK,
        message: '좌석 배치도 조회 성공',
        data: seatMap,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':seatId')
  @ApiOperation({ summary: '좌석 상세 정보 조회', description: '개별 좌석의 상세 정보를 조회합니다.' })
  @ApiResponse({ status: 200, description: '좌석 상세 정보 조회 성공' })
  @ApiResponse({ status: 404, description: '좌석을 찾을 수 없음' })
  async getSeatDetails(@Param('seatId') seatId: string) {
    try {
      const seatDetails = await this.seatsService.getSeatDetails(seatId);
      return {
        statusCode: HttpStatus.OK,
        message: '좌석 상세 정보 조회 성공',
        data: seatDetails,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
