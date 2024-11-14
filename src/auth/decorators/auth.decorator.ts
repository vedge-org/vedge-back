import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SessionGuard } from '../guards/session.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from './roles.decorator';

export function Auth(...roles: UserRole[]) {
  const decorators = [
    UseGuards(SessionGuard),
    ApiCookieAuth('sessionId'),
    ApiUnauthorizedResponse({ description: '로그인이 필요합니다.' }),
  ];

  return applyDecorators(...decorators);
}
