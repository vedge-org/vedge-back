import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
