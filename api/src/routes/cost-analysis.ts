// ============================================================
// SEbit Insight v1.0 - Cost Analysis Routes
// GET, POST, PUT /api/projects/:id/cost-analysis
// ============================================================

import { Hono } from 'hono';
import type { AppBindings, CostAnalysisResult, ProjectStaffing, ProjectExpense } from '../types';
import { requireRole } from '../middleware/role';
import { generateId } from '../db/helpers';

const route = new Hono<AppBindings>();

// ---------- Helper: Calculate cost analysis for a project ----------
async function calcCostAnalysis(
  projectId: string,
  db: D1Database
): Promise<CostAnalysisResult | null> {
  // Get project info
  const project = await db
    .prepare(
      `SELECT p.id, p.name, p.type, p.contract_amount
       FROM projects p WHERE p.id = ?`
    )
    .bind(projectId)
    .first<{ id: string; name: string; type: 'SI' | 'SM'; contract_amount: number }>();

  if (!project) {
    return null;
  }

  // Get staffing data
  const { results: staffingRows } = await db
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

  // Get expense data
  const { results: expenseRows } = await db
    .prepare(
      `SELECT id, project_id, category, amount, description, expense_date
       FROM project_expenses
       WHERE project_id = ?
       ORDER BY expense_date DESC`
    )
    .bind(projectId)
    .all();

  // Calculate totals
  const totalLaborResult = await db
    .prepare('SELECT SUM(total_cost) as labor FROM project_staffing WHERE project_id = ?')
    .bind(projectId)
    .first<{ labor: number | null }>();

  const totalExpenseResult = await db
    .prepare('SELECT SUM(amount) as expense FROM project_expenses WHERE project_id = ?')
    .bind(projectId)
    .first<{ expense: number | null }>();

  const totalLabor = totalLaborResult?.labor ?? 0;
  const totalExpense = totalExpenseResult?.expense ?? 0;
  const totalCost = totalLabor + totalExpense;
  const contractAmt = project.contract_amount;
  const profit = contractAmt - totalCost;
  const profitRate = contractAmt > 0 ? (profit / contractAmt) * 100 : 0;

  return {
    project_id: projectId,
    project_name: project.name,
    type: project.type,
    contract_amount: contractAmt,
    total_labor_cost: totalLabor,
    total_expense: totalExpense,
    total_cost: totalCost,
    operating_profit: profit,
    profit_rate: Math.round(profitRate * 100) / 100,
    staffing: staffingRows as unknown as ProjectStaffing[],
    expenses: expenseRows as unknown as ProjectExpense[],
  };
}

/**
 * GET /api/projects/:id/cost-analysis
 * 원가 분석 조회 (all roles)
 */
route.get('/:id/cost-analysis', async (c) => {
  try {
    const projectId = c.req.param('id');

    const result = await calcCostAnalysis(projectId, c.env.DB);

    if (!result) {
      return c.json({ error: 'NOT_FOUND', message: 'Project not found' }, 404);
    }

    return c.json(result);
  } catch (err) {
    console.error('GET /projects/:id/cost-analysis error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/projects/:id/cost-analysis
 * 원가 분석 저장 - staffing 및 expenses 일괄 upsert (manager, admin)
 */
route.post('/:id/cost-analysis', requireRole('manager', 'admin'), async (c) => {
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
      staffing?: Array<{
        id?: string;
        employee_id?: string;
        position: string;
        man_month: number;
        monthly_rate: number;
        note?: string;
      }>;
      expenses?: Array<{
        id?: string;
        category: string;
        amount: number;
        description?: string;
        expense_date?: string;
      }>;
    }>();

    // Delete existing and re-insert staffing
    if (body.staffing) {
      await c.env.DB
        .prepare('DELETE FROM project_staffing WHERE project_id = ?')
        .bind(projectId)
        .run();

      for (const s of body.staffing) {
        const id = s.id || generateId('staff');
        await c.env.DB
          .prepare(
            `INSERT INTO project_staffing (id, project_id, employee_id, position, man_month, monthly_rate, note)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            id, projectId,
            s.employee_id || null,
            s.position,
            s.man_month,
            s.monthly_rate,
            s.note || null
          )
          .run();
      }
    }

    // Delete existing and re-insert expenses
    if (body.expenses) {
      await c.env.DB
        .prepare('DELETE FROM project_expenses WHERE project_id = ?')
        .bind(projectId)
        .run();

      for (const e of body.expenses) {
        const id = e.id || generateId('exp');
        await c.env.DB
          .prepare(
            `INSERT INTO project_expenses (id, project_id, category, amount, description, expense_date)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .bind(
            id, projectId,
            e.category,
            e.amount,
            e.description || null,
            e.expense_date || null
          )
          .run();
      }
    }

    // Return updated cost analysis
    const result = await calcCostAnalysis(projectId, c.env.DB);
    return c.json(result, 200);
  } catch (err) {
    console.error('POST /projects/:id/cost-analysis error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * PUT /api/projects/:id/cost-analysis
 * 원가 분석 갱신 - same as POST but semantically for update (manager, admin)
 */
route.put('/:id/cost-analysis', requireRole('manager', 'admin'), async (c) => {
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
      staffing?: Array<{
        id?: string;
        employee_id?: string;
        position: string;
        man_month: number;
        monthly_rate: number;
        note?: string;
      }>;
      expenses?: Array<{
        id?: string;
        category: string;
        amount: number;
        description?: string;
        expense_date?: string;
      }>;
    }>();

    // Delete existing and re-insert staffing
    if (body.staffing) {
      await c.env.DB
        .prepare('DELETE FROM project_staffing WHERE project_id = ?')
        .bind(projectId)
        .run();

      for (const s of body.staffing) {
        const id = s.id || generateId('staff');
        await c.env.DB
          .prepare(
            `INSERT INTO project_staffing (id, project_id, employee_id, position, man_month, monthly_rate, note)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            id, projectId,
            s.employee_id || null,
            s.position,
            s.man_month,
            s.monthly_rate,
            s.note || null
          )
          .run();
      }
    }

    // Delete existing and re-insert expenses
    if (body.expenses) {
      await c.env.DB
        .prepare('DELETE FROM project_expenses WHERE project_id = ?')
        .bind(projectId)
        .run();

      for (const e of body.expenses) {
        const id = e.id || generateId('exp');
        await c.env.DB
          .prepare(
            `INSERT INTO project_expenses (id, project_id, category, amount, description, expense_date)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .bind(
            id, projectId,
            e.category,
            e.amount,
            e.description || null,
            e.expense_date || null
          )
          .run();
      }
    }

    // Return updated cost analysis
    const result = await calcCostAnalysis(projectId, c.env.DB);
    return c.json(result, 200);
  } catch (err) {
    console.error('PUT /projects/:id/cost-analysis error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
