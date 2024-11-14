import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, ROLES_KEY } from '../decorators/roles.decorator';
import { Session } from 'express-session';

interface SessionData {
  userId: string;
  user: {
    role: UserRole;
    [key: string]: any;
  };
}

interface CustomSession extends Session {
  data: SessionData;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const session = request.session as CustomSession;

    if (!session?.data?.user) {
      throw new UnauthorizedException('권한이 없습니다.');
    }

    return requiredRoles.some((role) => session.data.user.role === role);
  }
}
