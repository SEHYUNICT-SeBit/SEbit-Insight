// ============================================================
// SEbit Insight v1.0 - Settlements Routes
// GET, POST, PUT /api/settlements
// ============================================================

import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireRole } from '../middleware/role';
import { generateId, parsePagination, paginationResult, calcOffset, nowISO } from '../db/helpers';

const route = new Hono<AppBindings>();

/**
 * GET /api/settlements
 * 정산 목록 조회 (all roles)
 * Query: project_id, period (YYYY-MM), status, page, limit
 */
route.get('/', async (c) => {
  try {
    const projectId = c.req.query('project_id') || null;
    const period = c.req.query('period') || null;
    const status = c.req.query('status') || null;
    const pagination = parsePagination(c.req.query());

    let where = ' WHERE 1=1';
    const params: any[] = [];

    if (projectId) {
      where += ' AND s.project_id = ?';
      params.push(projectId);
    }

    if (period) {
      where += ' AND s.period = ?';
      params.push(period);
    }

    if (status) {
      where += ' AND s.status = ?';
      params.push(status);
    }

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM settlements s ${where}`;
    const countResult = await c.env.DB
      .prepare(countSql)
      .bind(...params)
      .first<{ total: number }>();

    const total = countResult?.total ?? 0;

    // Fetch data with pagination
    const dataSql = `
      SELECT
        s.id, s.project_id,
        p.name AS project_name,
        s.period, s.revenue, s.total_labor, s.total_expense,
        s.operating_profit, s.profit_rate,
        s.status, s.note, s.created_at
      FROM settlements s
      LEFT JOIN projects p ON s.project_id = p.id
      ${where}
      ORDER BY s.period DESC, s.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, pagination.limit, calcOffset(pagination)];

    const { results } = await c.env.DB
      .prepare(dataSql)
      .bind(...dataParams)
      .all();

    return c.json({
      data: results,
      pagination: paginationResult(total, pagination),
    });
  } catch (err) {
    console.error('GET /settlements error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/settlements
 * 정산 등록 (manager, admin)
 */
route.post('/', requireRole('manager', 'admin'), async (c) => {
  try {
    const body = await c.req.json<{
      project_id: string;
      period: string;
      revenue: number;
      total_labor?: number;
      total_expense?: number;
      status?: string;
      note?: string;
    }>();

    // Validation
    if (!body.project_id || !body.period || body.revenue === undefined) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'project_id, period, and revenue are required' },
        400
      );
    }

    // Validate period format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(body.period)) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'period must be in YYYY-MM format' },
        400
      );
    }

    // Check project exists
    const project = await c.env.DB
      .prepare('SELECT id FROM projects WHERE id = ?')
      .bind(body.project_id)
      .first();

    if (!project) {
      return c.json({ error: 'NOT_FOUND', message: 'Project not found' }, 404);
    }

    // Check for duplicate (project_id + period)
    const existing = await c.env.DB
      .prepare('SELECT id FROM settlements WHERE project_id = ? AND period = ?')
      .bind(body.project_id, body.period)
      .first();

    if (existing) {
      return c.json(
        { error: 'CONFLICT', message: 'Settlement for this project and period already exists' },
        409
      );
    }

    const id = generateId('stl');
    const totalLabor = body.total_labor ?? 0;
    const totalExpense = body.total_expense ?? 0;
    const revenue = body.revenue;
    const profitRate = revenue > 0
      ? Math.round(((revenue - totalLabor - totalExpense) / revenue) * 100 * 100) / 100
      : 0;
    const status = body.status || 'pending';
    const now = nowISO();

    await c.env.DB
      .prepare(
        `INSERT INTO settlements (id, project_id, period, revenue, total_labor, total_expense, profit_rate, status, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        body.project_id,
        body.period,
        revenue,
        totalLabor,
        totalExpense,
        profitRate,
        status,
        body.note || null,
        now,
        now
      )
      .run();

    // Return created settlement with project name
    const created = await c.env.DB
      .prepare(
        `SELECT
           s.id, s.project_id,
           p.name AS project_name,
           s.period, s.revenue, s.total_labor, s.total_expense,
           s.operating_profit, s.profit_rate,
           s.status, s.note, s.created_at
         FROM settlements s
         LEFT JOIN projects p ON s.project_id = p.id
         WHERE s.id = ?`
      )
      .bind(id)
      .first();

    return c.json(created, 201);
  } catch (err) {
    console.error('POST /settlements error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * PUT /api/settlements/:id
 * 정산 수정/상태 변경 (manager, admin)
 */
route.put('/:id', requireRole('manager', 'admin'), async (c) => {
  try {
    const settlementId = c.req.param('id');

    // Check settlement exists
    const existing = await c.env.DB
      .prepare('SELECT id FROM settlements WHERE id = ?')
      .bind(settlementId)
      .first();

    if (!existing) {
      return c.json({ error: 'NOT_FOUND', message: 'Settlement not found' }, 404);
    }

    const body = await c.req.json<{
      revenue?: number;
      total_labor?: number;
      total_expense?: number;
      profit_rate?: number;
      status?: string;
      note?: string;
    }>();

    const now = nowISO();
    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (body.revenue !== undefined) { fields.push('revenue = ?'); values.push(body.revenue); }
    if (body.total_labor !== undefined) { fields.push('total_labor = ?'); values.push(body.total_labor); }
    if (body.total_expense !== undefined) { fields.push('total_expense = ?'); values.push(body.total_expense); }
    if (body.profit_rate !== undefined) { fields.push('profit_rate = ?'); values.push(body.profit_rate); }
    if (body.status !== undefined) {
      const validStatuses = ['pending', 'completed', 'on_hold'];
      if (!validStatuses.includes(body.status)) {
        return c.json({ error: 'VALIDATION_ERROR', message: 'Invalid status value' }, 400);
      }
      fields.push('status = ?'); values.push(body.status);
    }
    if (body.note !== undefined) { fields.push('note = ?'); values.push(body.note); }

    values.push(settlementId);

    await c.env.DB
      .prepare(`UPDATE settlements SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    // If revenue/labor/expense changed, recalculate profit_rate
    if (body.revenue !== undefined || body.total_labor !== undefined || body.total_expense !== undefined) {
      const updated = await c.env.DB
        .prepare('SELECT revenue, total_labor, total_expense FROM settlements WHERE id = ?')
        .bind(settlementId)
        .first<{ revenue: number; total_labor: number; total_expense: number }>();

      if (updated && updated.revenue > 0) {
        const profitRate = Math.round(
          ((updated.revenue - updated.total_labor - updated.total_expense) / updated.revenue) * 100 * 100
        ) / 100;

        await c.env.DB
          .prepare('UPDATE settlements SET profit_rate = ? WHERE id = ?')
          .bind(profitRate, settlementId)
          .run();
      }
    }

    // Return updated settlement
    const result = await c.env.DB
      .prepare(
        `SELECT
           s.id, s.project_id,
           p.name AS project_name,
           s.period, s.revenue, s.total_labor, s.total_expense,
           s.operating_profit, s.profit_rate,
           s.status, s.note, s.created_at
         FROM settlements s
         LEFT JOIN projects p ON s.project_id = p.id
         WHERE s.id = ?`
      )
      .bind(settlementId)
      .first();

    return c.json(result);
  } catch (err) {
    console.error('PUT /settlements/:id error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
