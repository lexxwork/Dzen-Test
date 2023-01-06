import { User } from '@prisma/client';

export type JwtUser = Pick<User, 'id' | 'email'>;
export type JwtPayload = JwtUser & { iat: number; exp: number };
