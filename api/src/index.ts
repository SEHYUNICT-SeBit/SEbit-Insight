// ============================================================
// SEbit Insight v1.0 - Hono App Entry Point
// ============================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createMiddleware } from 'hono/factory';
import { authMiddleware } from './middleware/auth';
import authRoute from './routes/auth';
import permissionRequestsRoute from './routes/permission-requests';
import departmentsRoute from './routes/departments';
import employeesRoute from './routes/employees';
import clientsRoute from './routes/clients';
import projectsRoute from './routes/projects';
import staffingRoute from './routes/staffing';
import expensesRoute from './routes/expenses';
import costAnalysisRoute from './routes/cost-analysis';
import settlementsRoute from './routes/settlements';
import dashboardRoute from './routes/dashboard';
import performanceRoute from './routes/performance';
import rateCardsRoute from './routes/rate-cards';
import adminRoute from './routes/admin';
import { runSync } from './services/nw-sync';
import type { AppBindings } from './types';

export type Env = {
  DB: D1Database;
  ENVIRONMENT: string;
  ACCESS_TEAM_DOMAIN: string;
  NW_CLIENT_ID?: string;
  NW_CLIENT_SECRET?: string;
  NW_REDIRECT_URI?: string;
  JWT_SECRET?: string;
  FRONTEND_URL?: string;
  NW_SERVICE_ACCOUNT_ID?: string;
  NW_PRIVATE_KEY?: string;
};

const app = new Hono<AppBindings>();

// Global CORS (쿠키 전송을 위한 credentials 설정 포함)
app.use(
  '*',
  cors({
    origin: ['https://insight.sebit.co.kr', 'https://sebit-insight.pages.dev', 'https://sebit-insight-web.pages.dev', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3100'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cf-Access-Jwt-Assertion', 'X-Dev-Email'],
  })
);

// Health check (인증 불필요)
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ---------- 인증 미들웨어 (선택적 적용) ----------
// /api/auth/login, /api/auth/callback, /api/auth/dev-login은 인증 불필요
// 그 외 모든 /api/* 경로에 인증 적용
const AUTH_SKIP_PATHS = ['/api/auth/login', '/api/auth/callback', '/api/auth/dev-login'];

app.use('/api/*', createMiddleware<AppBindings>(async (c, next) => {
  const path = new URL(c.req.url).pathname;

  // 인증이 불필요한 경로는 skip
  if (AUTH_SKIP_PATHS.includes(path)) {
    await next();
    return;
  }

  // 그 외 경로에 인증 미들웨어 적용
  return authMiddleware(c, next);
}));

// ---------- Route 마운트 ----------

// Auth 라우트 (일부 엔드포인트는 인증 불필요)
app.route('/api/auth', authRoute);

// Permission requests 라우트
app.route('/api/permission-requests', permissionRequestsRoute);

// 기존 라우트
app.route('/api/departments', departmentsRoute);
app.route('/api/employees', employeesRoute);
app.route('/api/clients', clientsRoute);
app.route('/api/projects', projectsRoute);
app.route('/api/projects', staffingRoute);
app.route('/api/projects', expensesRoute);
app.route('/api/projects', costAnalysisRoute);
app.route('/api/settlements', settlementsRoute);
app.route('/api/dashboard', dashboardRoute);
app.route('/api/dashboard', performanceRoute);
app.route('/api/rate-cards', rateCardsRoute);
app.route('/api/admin', adminRoute);

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    { error: 'INTERNAL_ERROR', message: 'Internal server error' },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    { error: 'NOT_FOUND', message: 'Route not found' },
    404
  );
});

// Scheduled handler for daily 네이버 웍스 sync
const scheduled: ExportedHandlerScheduledHandler<Env> = async (event, env, ctx) => {
  console.log(`[Cron] Employee sync triggered at ${new Date().toISOString()}`);
  ctx.waitUntil(
    runSync(env, env.DB)
      .then((result) => console.log('[Cron] Sync complete:', JSON.stringify(result)))
      .catch((err) => console.error('[Cron] Sync error:', err))
  );
};

export default { fetch: app.fetch, scheduled };
