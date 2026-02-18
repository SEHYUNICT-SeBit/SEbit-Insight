// ============================================================
// SEbit Insight v1.0 - Auth Middleware (Session-based)
// ============================================================

import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import type { AppBindings, AuthUser } from '../types';

/**
 * 인증 미들웨어 - 세션 쿠키 기반 인증
 *
 * 1. session_id 쿠키에서 세션 조회
 * 2. 만료 여부 확인
 * 3. employee 정보를 context에 설정
 *
 * 개발 환경 (ENVIRONMENT !== 'production'):
 *   세션 쿠키가 없으면 기본 master 사용자로 fallback (하위 호환성)
 */
export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const sessionId = getCookie(c, 'session_id');

  if (sessionId) {
    try {
      // 세션 조회
      const session = await c.env.DB
        .prepare('SELECT id, employee_id, expires_at FROM sessions WHERE id = ?')
        .bind(sessionId)
        .first<{ id: string; employee_id: string; expires_at: string }>();

      if (session) {
        // 만료 확인
        const now = new Date();
        const expiresAt = new Date(session.expires_at);

        if (expiresAt > now) {
          // 직원 정보 조회 (role 포함)
          const employee = await c.env.DB
            .prepare('SELECT id, name, role FROM employees WHERE id = ? AND is_active = 1')
            .bind(session.employee_id)
            .first<AuthUser>();

          if (employee) {
            c.set('user', employee);
            await next();
            return;
          }
        } else {
          // 만료된 세션 삭제
          await c.env.DB
            .prepare('DELETE FROM sessions WHERE id = ?')
            .bind(sessionId)
            .run();
        }
      }
    } catch (err) {
      console.error('Auth middleware session lookup error:', err);
    }
  }

  // 개발 환경: 세션이 없으면 기본 master 사용자로 fallback (하위 호환성)
  if (c.env.ENVIRONMENT !== 'production') {
    // dev_admin 또는 첫 번째 master 사용자 조회
    const masterUser = await c.env.DB
      .prepare("SELECT id, name, role FROM employees WHERE role = 'master' AND is_active = 1 LIMIT 1")
      .first<AuthUser>();

    if (masterUser) {
      c.set('user', masterUser);
      await next();
      return;
    }

    // master 사용자도 없으면 기본 fallback
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
