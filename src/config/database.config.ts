import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  provider: process.env.DATABASE_PROVIDER,
  url: process.env.DATABASE_URL,
}));
