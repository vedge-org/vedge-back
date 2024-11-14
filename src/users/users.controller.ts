import { Controller, Get, Put, Delete, UseGuards, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SessionGuard } from 'src/auth/guards/session.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(SessionGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Auth()
  @ApiOperation({ summary: '내 정보 조회' })
  async getMe(@CurrentUser() user: User) {
    return user;
  }

  @Put('me')
  @Auth()
  @ApiOperation({ summary: '내 정보 수정' })
  async updateMe(@CurrentUser() user: User, @Body() updateDto: UpdateUserDto) {
    return this.usersService.updateUser(user.id, updateDto);
  }
}
