import { Session } from 'express-session';
import { Request } from 'express';

declare module 'express-session' {
  interface SessionData {
    data: {
      userId?: string;
      user?: any;
      verified?: boolean;
      verificationType?: 'login' | 'register';
      phoneNumber?: string;
    };
  }
}

declare module 'express' {
  interface Request {
    session: Session & {
      data: {
        userId?: string;
        user?: any;
        verified?: boolean;
        verificationType?: 'login' | 'register';
        phoneNumber?: string;
      };
    };
  }
}
