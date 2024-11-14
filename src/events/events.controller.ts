import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionGuard } from 'src/auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventCategory } from './entities/event.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(SessionGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Auth()
  @ApiOperation({ summary: '이벤트 생성' })
  @ApiResponse({ status: 201, description: '이벤트 생성 성공' })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: '이벤트 목록 조회' })
  @ApiResponse({ status: 200, description: '이벤트 목록 조회 성공' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: EventCategory,
    @Query('search') search?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.eventsService.findAll(page, limit, category, search, startDate, endDate);
  }

  @Get('upcoming')
  @ApiOperation({ summary: '다가오는 이벤트 조회' })
  @ApiResponse({ status: 200, description: '다가오는 이벤트 조회 성공' })
  getUpcoming(@Query('limit') limit?: number) {
    return this.eventsService.getUpcoming(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '이벤트 상세 조회' })
  @ApiResponse({ status: 200, description: '이벤트 상세 조회 성공' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Auth()
  @ApiOperation({ summary: '이벤트 수정' })
  @ApiResponse({ status: 200, description: '이벤트 수정 성공' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Auth()
  @ApiOperation({ summary: '이벤트 삭제' })
  @ApiResponse({ status: 200, description: '이벤트 삭제 성공' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
