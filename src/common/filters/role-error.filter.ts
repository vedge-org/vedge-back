import { ExceptionFilter, Catch, ArgumentsHost, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';

@Catch(ForbiddenException)
export class RoleErrorFilter implements ExceptionFilter {
  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(403).json({
      statusCode: 403,
      message: '이 작업을 수행할 권한이 없습니다.',
      error: 'Forbidden',
    });
  }
}
