import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { User } from '../users/entities/user.entity';
import { ReserveTicketDto } from './dto/reserve-ticket.dto';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('reserve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '티켓 예매' })
  @ApiResponse({ status: 201, description: '티켓 예매 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async reserveTickets(@Body() reserveTicketDto: ReserveTicketDto, @CurrentUser() user: User) {
    try {
      const result = await this.ticketsService.reserveTickets(reserveTicketDto, user);
      return {
        statusCode: HttpStatus.CREATED,
        message: '티켓 예매가 완료되었습니다.',
        data: result,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 티켓 목록 조회' })
  @ApiResponse({ status: 200, description: '티켓 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyTickets(@CurrentUser() user: User, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    const tickets = await this.ticketsService.findTicketsByUser(user.id, page, limit);
    return {
      statusCode: HttpStatus.OK,
      message: '티켓 목록 조회 성공',
      data: tickets,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '티켓 상세 조회' })
  @ApiResponse({ status: 200, description: '티켓 상세 조회 성공' })
  async getTicketDetail(@Param('id') id: string, @CurrentUser() user: User) {
    const ticket = await this.ticketsService.findTicketDetail(id, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: '티켓 상세 조회 성공',
      data: ticket,
    };
  }

  @Post('cancel/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '티켓 취소' })
  @ApiResponse({ status: 200, description: '티켓 취소 성공' })
  async cancelTicket(@Param('id') id: string, @CurrentUser() user: User) {
    try {
      await this.ticketsService.cancelTicket(id, user.id);
      return {
        statusCode: HttpStatus.OK,
        message: '티켓이 취소되었습니다.',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('available/:scheduleId')
  @ApiOperation({ summary: '예매 가능한 좌석 조회' })
  @ApiResponse({ status: 200, description: '좌석 조회 성공' })
  async getAvailableSeats(@Param('scheduleId') scheduleId: string) {
    const seats = await this.ticketsService.findAvailableSeats(scheduleId);
    return {
      statusCode: HttpStatus.OK,
      message: '좌석 조회 성공',
      data: seats,
    };
  }
}
