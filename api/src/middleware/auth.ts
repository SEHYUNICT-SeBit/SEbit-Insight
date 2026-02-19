// ============================================================
// SEbit Insight v1.0 - Auth Middleware (Session-based + Bearer Token)
// ============================================================

import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import type { AppBindings, AuthUser } from '../types';

/**
 * 세션 ID로 사용자 인증 시도
 * 유효한 세션이면 AuthUser 반환, 아니면 null
 */
async function authenticateBySession(
  db: D1Database,
  sessionId: string
): Promise<AuthUser | null> {
  const session = await db
    .prepare('SELECT id, employee_id, expires_at FROM sessions WHERE id = ?')
    .bind(sessionId)
    .first<{ id: string; employee_id: string; expires_at: string }>();

  if (!session) return null;

  const now = new Date();
  const expiresAt = new Date(session.expires_at);

  if (expiresAt <= now) {
    // 만료된 세션 삭제
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    return null;
  }

  return db
    .prepare('SELECT id, name, role FROM employees WHERE id = ? AND is_active = 1')
    .bind(session.employee_id)
    .first<AuthUser>();
}

/**
 * 인증 미들웨어
 * 1. Cookie session_id 확인
 * 2. Authorization: Bearer <sessionId> 헤더 확인
 * 3. 둘 다 없으면 dev fallback 또는 401
 */
export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  // 1차: 쿠키에서 세션 확인
  const cookieSessionId = getCookie(c, 'session_id');
  if (cookieSessionId) {
    try {
      const user = await authenticateBySession(c.env.DB, cookieSessionId);
      if (user) {
        c.set('user', user);
        await next();
        return;
      }
    } catch (err) {
      console.error('Auth middleware cookie session error:', err);
    }
  }

  // 2차: Authorization Bearer 헤더에서 세션 확인
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7);
    try {
      const user = await authenticateBySession(c.env.DB, bearerToken);
      if (user) {
        c.set('user', user);
        await next();
        return;
      }
    } catch (err) {
      console.error('Auth middleware bearer token error:', err);
    }
  }

  // 개발 환경: 세션이 없으면 기본 master 사용자로 fallback
  if (c.env.ENVIRONMENT !== 'production') {
    const masterUser = await c.env.DB
      .prepare("SELECT id, name, role FROM employees WHERE role = 'master' AND is_active = 1 LIMIT 1")
      .first<AuthUser>();

    if (masterUser) {
      c.set('user', masterUser);
      await next();
      return;
    }

    c.set('user', {
      id: 'dev_master',
      name: 'Dev Master',
      role: 'master',
    });
    await next();
    return;
  }

  // 프로덕션에서 인증 실패
  return c.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
});
