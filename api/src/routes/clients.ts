// ============================================================
// SEbit Insight v1.0 - Clients Routes
// GET, POST /api/clients
// ============================================================

import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireRole } from '../middleware/role';
import { generateId } from '../db/helpers';

const route = new Hono<AppBindings>();

/**
 * GET /api/clients
 * 계약처 목록 조회 (all roles)
 * Query: search (회사명/담당자 검색)
 */
route.get('/', async (c) => {
  try {
    const search = c.req.query('search') || null;

    let sql = 'SELECT id, name, business_no, contact, phone FROM clients WHERE 1=1';
    const params: any[] = [];

    if (search) {
      sql += " AND (name LIKE '%' || ? || '%' OR contact LIKE '%' || ? || '%')";
      params.push(search, search);
    }

    sql += ' ORDER BY name';

    const { results } = await c.env.DB
      .prepare(sql)
      .bind(...params)
      .all();

    return c.json({ data: results });
  } catch (err) {
    console.error('GET /clients error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/clients
 * 계약처 등록 (manager, admin)
 */
route.post('/', requireRole('manager', 'admin'), async (c) => {
  try {
    const body = await c.req.json<{
      name: string;
      business_no?: string;
      contact?: string;
      phone?: string;
    }>();

    // Validation
    if (!body.name) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'name is required' },
        400
      );
    }

    const id = generateId('cli');

    await c.env.DB
      .prepare(
        `INSERT INTO clients (id, name, business_no, contact, phone)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(id, body.name, body.business_no || null, body.contact || null, body.phone || null)
      .run();

    const created = await c.env.DB
      .prepare('SELECT id, name, business_no, contact, phone FROM clients WHERE id = ?')
      .bind(id)
      .first();

    return c.json(created, 201);
  } catch (err) {
    console.error('POST /clients error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
