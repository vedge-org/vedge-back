import { Controller, Get, Put, Delete, UseGuards, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  async getMe(@CurrentUser() user: User) {
    return user;
  }

  @Put('me')
  @ApiOperation({ summary: '내 정보 수정' })
  async updateMe(@CurrentUser() user: User, @Body() updateDto: UpdateUserDto) {
    return this.usersService.updateUser(user.id, updateDto);
  }
}
