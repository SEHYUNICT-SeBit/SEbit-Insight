// ============================================================
// SEbit Insight v1.0 - Expenses Routes
// GET, POST, PUT /api/projects/:id/expenses
// ============================================================

import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireRole } from '../middleware/role';
import { generateId } from '../db/helpers';

const route = new Hono<AppBindings>();

const VALID_CATEGORIES = ['출장비', '장비', '외주', '기타'];

/**
 * GET /api/projects/:id/expenses
 * 경비 목록 조회 (all roles)
 */
route.get('/:id/expenses', async (c) => {
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
        `SELECT id, project_id, category, amount, description, expense_date
         FROM project_expenses
         WHERE project_id = ?
         ORDER BY expense_date DESC, created_at DESC`
      )
      .bind(projectId)
      .all();

    // Calculate summary
    let totalExpense = 0;
    const byCategory: Record<string, number> = {};

    for (const row of results) {
      const r = row as any;
      totalExpense += r.amount || 0;
      const cat = r.category || '기타';
      byCategory[cat] = (byCategory[cat] || 0) + (r.amount || 0);
    }

    return c.json({
      data: results,
      summary: {
        total_expense: totalExpense,
        by_category: byCategory,
      },
    });
  } catch (err) {
    console.error('GET /projects/:id/expenses error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/projects/:id/expenses
 * 경비 추가 (manager, admin)
 */
route.post('/:id/expenses', requireRole('manager', 'admin'), async (c) => {
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
      category: string;
      amount: number;
      description?: string;
      expense_date?: string;
    }>();

    // Validation
    if (!body.category || !body.amount) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'category and amount are required' },
        400
      );
    }

    if (!VALID_CATEGORIES.includes(body.category)) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        400
      );
    }

    if (body.amount <= 0) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'amount must be a positive number' },
        400
      );
    }

    const id = generateId('exp');

    await c.env.DB
      .prepare(
        `INSERT INTO project_expenses (id, project_id, category, amount, description, expense_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id, projectId,
        body.category,
        body.amount,
        body.description || null,
        body.expense_date || null
      )
      .run();

    const created = await c.env.DB
      .prepare(
        'SELECT id, project_id, category, amount, description, expense_date FROM project_expenses WHERE id = ?'
      )
      .bind(id)
      .first();

    return c.json(created, 201);
  } catch (err) {
    console.error('POST /projects/:id/expenses error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * PUT /api/projects/:id/expenses/:eid
 * 경비 수정 (manager, admin)
 */
route.put('/:id/expenses/:eid', requireRole('manager', 'admin'), async (c) => {
  try {
    const projectId = c.req.param('id');
    const expenseId = c.req.param('eid');

    // Check expense record exists for this project
    const existing = await c.env.DB
      .prepare('SELECT id FROM project_expenses WHERE id = ? AND project_id = ?')
      .bind(expenseId, projectId)
      .first();

    if (!existing) {
      return c.json({ error: 'NOT_FOUND', message: 'Expense record not found' }, 404);
    }

    const body = await c.req.json<{
      category?: string;
      amount?: number;
      description?: string;
      expense_date?: string;
    }>();

    // Build dynamic update
    const fields: string[] = [];
    const values: any[] = [];

    if (body.category !== undefined) {
      if (!VALID_CATEGORIES.includes(body.category)) {
        return c.json(
          { error: 'VALIDATION_ERROR', message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
          400
        );
      }
      fields.push('category = ?'); values.push(body.category);
    }
    if (body.amount !== undefined) {
      if (body.amount <= 0) {
        return c.json({ error: 'VALIDATION_ERROR', message: 'amount must be a positive number' }, 400);
      }
      fields.push('amount = ?'); values.push(body.amount);
    }
    if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
    if (body.expense_date !== undefined) { fields.push('expense_date = ?'); values.push(body.expense_date); }

    if (fields.length === 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'No fields to update' }, 400);
    }

    values.push(expenseId);

    await c.env.DB
      .prepare(`UPDATE project_expenses SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await c.env.DB
      .prepare(
        'SELECT id, project_id, category, amount, description, expense_date FROM project_expenses WHERE id = ?'
      )
      .bind(expenseId)
      .first();

    return c.json(updated);
  } catch (err) {
    console.error('PUT /projects/:id/expenses/:eid error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
