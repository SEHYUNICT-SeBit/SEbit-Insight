// ============================================================
// SEbit Insight v1.0 - Departments Routes
// GET, POST /api/departments
// ============================================================

import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireRole } from '../middleware/role';

const route = new Hono<AppBindings>();

/**
 * GET /api/departments
 * 부서 목록 조회 (all roles)
 */
route.get('/', async (c) => {
  try {
    const { results } = await c.env.DB
      .prepare('SELECT id, name, created_at FROM departments ORDER BY id')
      .all();

    return c.json({ data: results });
  } catch (err) {
    console.error('GET /departments error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/departments
 * 부서 등록 (admin only)
 */
route.post('/', requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json<{ id: string; name: string }>();

    // Validation
    if (!body.id || !body.name) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'id and name are required' },
        400
      );
    }

    // Check for duplicate
    const existing = await c.env.DB
      .prepare('SELECT id FROM departments WHERE id = ?')
      .bind(body.id)
      .first();

    if (existing) {
      return c.json(
        { error: 'CONFLICT', message: 'Department ID already exists' },
        409
      );
    }

    await c.env.DB
      .prepare('INSERT INTO departments (id, name) VALUES (?, ?)')
      .bind(body.id, body.name)
      .run();

    const created = await c.env.DB
      .prepare('SELECT id, name, created_at FROM departments WHERE id = ?')
      .bind(body.id)
      .first();

    return c.json(created, 201);
  } catch (err) {
    console.error('POST /departments error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
