import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173'
  ).split(','),
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}));

export const googleConfig = registerAs('google', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackUrl: process.env.GOOGLE_CALLBACK_URL,
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
}));

export const infinitepayConfig = registerAs('infinitepay', () => ({
  apiKey: process.env.INFINITEPAY_API_KEY,
  webhookSecret: process.env.INFINITEPAY_WEBHOOK_SECRET,
}));
