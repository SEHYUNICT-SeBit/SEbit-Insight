// ============================================================
// SEbit Insight v1.0 - Admin Routes
// ============================================================

import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireRole } from '../middleware/role';
import { runSync } from '../services/nw-sync';

const route = new Hono<AppBindings>();

/**
 * POST /api/admin/sync-employees
 * 네이버 웍스 인사정보 동기화 (master 전용)
 */
route.post('/sync-employees', requireRole('master'), async (c) => {
  try {
    const result = await runSync(c.env, c.env.DB);
    return c.json({ data: result });
  } catch (err) {
    console.error('Sync failed:', err);
    return c.json(
      { error: 'SYNC_ERROR', message: err instanceof Error ? err.message : 'Sync failed' },
      500
    );
  }
});

/**
 * GET /api/admin/sync-status
 * 마지막 동기화 상태 조회
 */
route.get('/sync-status', requireRole('master'), async (c) => {
  try {
    const meta = await c.env.DB
      .prepare("SELECT value, updated_at FROM sync_meta WHERE key = 'last_sync'")
      .first<{ value: string; updated_at: string }>();

    if (!meta) {
      return c.json({ data: { status: 'never', synced_at: null } });
    }

    return c.json({ data: JSON.parse(meta.value) });
  } catch (err) {
    console.error('GET /admin/sync-status error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
