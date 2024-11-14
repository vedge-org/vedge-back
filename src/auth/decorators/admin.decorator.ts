import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from './roles.decorator';
import { SessionGuard } from '../guards/session.guard';

export function Admin() {
  return applyDecorators(
    Roles(UserRole.ADMIN),
    UseGuards(SessionGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: '권한이 없습니다.' }),
  );
}
