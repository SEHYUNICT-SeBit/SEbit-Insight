// ============================================================
// SEbit Insight v1.0 - CORS Configuration
// ============================================================

import { cors } from 'hono/cors';

/**
 * CORS middleware configuration.
 *
 * In production, restricts to the official domain.
 * In development, allows localhost origins for testing.
 */
export const corsMiddleware = (environment: string) =>
  cors({
    origin:
      environment === 'production'
        ? ['https://insight.sebit.co.kr']
        : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'Cf-Access-Jwt-Assertion',
      'X-Dev-Email',
    ],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
  });
