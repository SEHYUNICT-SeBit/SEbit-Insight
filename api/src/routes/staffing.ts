// ============================================================
// SEbit Insight v1.0 - Staffing Routes
// GET, POST, PUT /api/projects/:id/staffing
// ============================================================

import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireRole } from '../middleware/role';
import { generateId } from '../db/helpers';

const route = new Hono<AppBindings>();

/**
 * GET /api/projects/:id/staffing
 * 투입 인력 목록 조회 (all roles)
 */
route.get('/:id/staffing', async (c) => {
  try {
    const projectId = c.req.param('id');

    // Check project exists
    const project = await c.env.DB
      .prepare('SELECT id FROM projects WHERE id = ?')
      .bind(projectId)
      .first();

    if (!project) {
      return c.json({ error: 'NOT_FOUND', message: 'Project not found' }, 404);
    }

    const { results } = await c.env.DB
      .prepare(
        `SELECT
           s.id, s.project_id, s.employee_id,
           e.name AS employee_name,
           s.position, s.man_month, s.monthly_rate, s.total_cost, s.note
         FROM project_staffing s
         LEFT JOIN employees e ON s.employee_id = e.id
         WHERE s.project_id = ?
         ORDER BY s.created_at`
      )
      .bind(projectId)
      .all();

    // Calculate summary
    let totalManMonth = 0;
    let totalLaborCost = 0;
    for (const row of results) {
      totalManMonth += (row as any).man_month || 0;
      totalLaborCost += (row as any).total_cost || 0;
    }

    return c.json({
      data: results,
      summary: {
        total_man_month: Math.round(totalManMonth * 100) / 100,
        total_labor_cost: totalLaborCost,
      },
    });
  } catch (err) {
    console.error('GET /projects/:id/staffing error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/projects/:id/staffing
 * 투입 인력 추가 (manager, admin)
 */
route.post('/:id/staffing', requireRole('manager', 'admin'), async (c) => {
  try {
    const projectId = c.req.param('id');

    // Check project exists
    const project = await c.env.DB
      .prepare('SELECT id FROM projects WHERE id = ?')
      .bind(projectId)
      .first();

    if (!project) {
      return c.json({ error: 'NOT_FOUND', message: 'Project not found' }, 404);
    }

    const body = await c.req.json<{
      employee_id?: string;
      position: string;
      man_month: number;
      monthly_rate: number;
      note?: string;
    }>();

    // Validation
    if (!body.position || !body.man_month || !body.monthly_rate) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'position, man_month, and monthly_rate are required' },
        400
      );
    }

    if (body.man_month <= 0) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'man_month must be a positive number' },
        400
      );
    }

    if (body.monthly_rate <= 0) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'monthly_rate must be a positive number' },
        400
      );
    }

    const id = generateId('staff');

    await c.env.DB
      .prepare(
        `INSERT INTO project_staffing (id, project_id, employee_id, position, man_month, monthly_rate, note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id, projectId,
        body.employee_id || null,
        body.position,
        body.man_month,
        body.monthly_rate,
        body.note || null
      )
      .run();

    // Return created staffing with employee name
    const created = await c.env.DB
      .prepare(
        `SELECT
           s.id, s.project_id, s.employee_id,
           e.name AS employee_name,
           s.position, s.man_month, s.monthly_rate, s.total_cost, s.note
         FROM project_staffing s
         LEFT JOIN employees e ON s.employee_id = e.id
         WHERE s.id = ?`
      )
      .bind(id)
      .first();

    return c.json(created, 201);
  } catch (err) {
    console.error('POST /projects/:id/staffing error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * PUT /api/projects/:id/staffing/:sid
 * 투입 인력 수정 (manager, admin)
 */
route.put('/:id/staffing/:sid', requireRole('manager', 'admin'), async (c) => {
  try {
    const projectId = c.req.param('id');
    const staffingId = c.req.param('sid');

    // Check staffing record exists for this project
    const existing = await c.env.DB
      .prepare('SELECT id FROM project_staffing WHERE id = ? AND project_id = ?')
      .bind(staffingId, projectId)
      .first();

    if (!existing) {
      return c.json({ error: 'NOT_FOUND', message: 'Staffing record not found' }, 404);
    }

    const body = await c.req.json<{
      employee_id?: string;
      position?: string;
      man_month?: number;
      monthly_rate?: number;
      note?: string;
    }>();

    // Build dynamic update
    const fields: string[] = [];
    const values: any[] = [];

    if (body.employee_id !== undefined) { fields.push('employee_id = ?'); values.push(body.employee_id); }
    if (body.position !== undefined) { fields.push('position = ?'); values.push(body.position); }
    if (body.man_month !== undefined) {
      if (body.man_month <= 0) {
        return c.json({ error: 'VALIDATION_ERROR', message: 'man_month must be a positive number' }, 400);
      }
      fields.push('man_month = ?'); values.push(body.man_month);
    }
    if (body.monthly_rate !== undefined) {
      if (body.monthly_rate <= 0) {
        return c.json({ error: 'VALIDATION_ERROR', message: 'monthly_rate must be a positive number' }, 400);
      }
      fields.push('monthly_rate = ?'); values.push(body.monthly_rate);
    }
    if (body.note !== undefined) { fields.push('note = ?'); values.push(body.note); }

    if (fields.length === 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'No fields to update' }, 400);
    }

    values.push(staffingId);

    await c.env.DB
      .prepare(`UPDATE project_staffing SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    // Return updated staffing record
    const updated = await c.env.DB
      .prepare(
        `SELECT
           s.id, s.project_id, s.employee_id,
           e.name AS employee_name,
           s.position, s.man_month, s.monthly_rate, s.total_cost, s.note
         FROM project_staffing s
         LEFT JOIN employees e ON s.employee_id = e.id
         WHERE s.id = ?`
      )
      .bind(staffingId)
      .first();

    return c.json(updated);
  } catch (err) {
    console.error('PUT /projects/:id/staffing/:sid error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
