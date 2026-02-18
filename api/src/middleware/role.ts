// ============================================================
// SEbit Insight v1.0 - Role-based Access Control Middleware
// ============================================================

import { createMiddleware } from 'hono/factory';
import type { AppBindings } from '../types';

// ---------- Role Hierarchy ----------
const ROLE_HIERARCHY: Record<string, number> = {
  master: 4,
  admin: 3,
  manager: 2,
  user: 1,
};

/**
 * 특정 역할 목록 중 하나를 요구하는 미들웨어
 *
 * Usage:
 *   route.post('/', requireRole('manager', 'admin'), handler);
 *   route.delete('/:id', requireRole('admin'), handler);
 *
 * Roles:
 *   master  - 시스템 관리자 (모든 권한)
 *   admin   - Full CRUD + employee/department management + delete
 *   manager - Project/settlement/staffing/expense CRUD (no delete)
 *   user    - Read-only + own drafts
 */
export const requireRole = (...roles: string[]) =>
  createMiddleware<AppBindings>(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'UNAUTHORIZED', message: 'Missing or invalid JWT' }, 401);
    }

    // master는 모든 역할 권한 보유 (hierarchy 최상위)
    if (user.role === 'master') {
      await next();
      return;
    }

    if (!roles.includes(user.role)) {
      return c.json({ error: 'FORBIDDEN', message: 'Insufficient role' }, 403);
    }

    await next();
  });

/**
 * 최소 역할 등급을 요구하는 미들웨어 (hierarchy 기반)
 *
 * Usage:
 *   route.get('/', requireMinRole('manager'), handler);  // manager, admin, master 허용
 *   route.delete('/:id', requireMinRole('admin'), handler); // admin, master 허용
 */
export const requireMinRole = (minRole: string) =>
  createMiddleware<AppBindings>(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'UNAUTHORIZED', message: 'Missing user' }, 401);
    }

    const userLevel = ROLE_HIERARCHY[user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return c.json({ error: 'FORBIDDEN', message: 'Insufficient role' }, 403);
    }

    await next();
  });
