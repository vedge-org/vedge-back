import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface SessionData {
  userId: string;
  user: any;
  verified?: boolean;
  verificationType?: 'login' | 'register';
  phoneNumber?: string;
}

export const CurrentUser = createParamDecorator((data: keyof SessionData | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const session = request.session as { data: SessionData };

  if (data) {
    return session.data[data];
  }

  return session.data.user;
});
