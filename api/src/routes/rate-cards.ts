// ============================================================
// SEbit Insight v1.0 - Rate Cards Routes
// GET /api/rate-cards
// ============================================================

import { Hono } from 'hono';
import type { AppBindings } from '../types';

const route = new Hono<AppBindings>();

/**
 * GET /api/rate-cards
 * 직급별 단가 기준표 조회 (all roles)
 */
route.get('/', async (c) => {
  try {
    const { results } = await c.env.DB
      .prepare(
        `SELECT id, position, monthly_rate, is_default
         FROM rate_cards
         ORDER BY monthly_rate ASC`
      )
      .all();

    return c.json({ data: results });
  } catch (err) {
    console.error('GET /rate-cards error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
