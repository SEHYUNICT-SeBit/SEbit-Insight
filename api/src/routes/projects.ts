// ============================================================
// SEbit Insight v1.0 - Projects Routes
// CRUD + status inline change + drafts
// ============================================================

import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireRole } from '../middleware/role';
import {
  generateId,
  generateProjectCode,
  parsePagination,
  paginationResult,
  calcOffset,
  nowISO,
} from '../db/helpers';

const route = new Hono<AppBindings>();

// ---------- Helper: Build full project SELECT with JOINs ----------
const PROJECT_SELECT = `
  SELECT
    p.id, p.project_code, p.name, p.type, p.status,
    p.department_id,
    d.name AS department_name,
    p.client_id,
    c.name AS client_name,
    p.sales_rep_id,
    sr.name AS sales_rep_name,
    p.pm_id, p.pm_type,
    COALESCE(pm.name, p.pm_name) AS pm_name,
    p.contract_amount, p.start_date, p.end_date,
    p.description, p.is_draft, p.draft_step,
    p.created_by, p.created_at, p.updated_at
  FROM projects p
  LEFT JOIN departments d ON p.department_id = d.id
  LEFT JOIN clients c     ON p.client_id = c.id
  LEFT JOIN employees sr  ON p.sales_rep_id = sr.id
  LEFT JOIN employees pm  ON p.pm_id = pm.id
`;

// ---------- Helper: Get all departments for a project ----------
async function getProjectDepartments(db: D1Database, projectId: string) {
  const { results } = await db
    .prepare(`
      SELECT pd.department_id, d.name AS department_name, pd.is_primary
      FROM project_departments pd
      JOIN departments d ON pd.department_id = d.id
      WHERE pd.project_id = ?
      ORDER BY pd.is_primary DESC, d.name ASC
    `)
    .bind(projectId)
    .all();
  return results;
}

// ---------- Helper: Set departments for a project ----------
async function setProjectDepartments(db: D1Database, projectId: string, departmentIds: string[], primaryDeptId: string) {
  // Delete existing
  await db.prepare('DELETE FROM project_departments WHERE project_id = ?').bind(projectId).run();

  // Insert new
  for (const deptId of departmentIds) {
    const id = generateId('pd');
    await db
      .prepare('INSERT INTO project_departments (id, project_id, department_id, is_primary) VALUES (?, ?, ?, ?)')
      .bind(id, projectId, deptId, deptId === primaryDeptId ? 1 : 0)
      .run();
  }
}

/**
 * GET /api/projects/drafts
 * 임시 저장 목록 (본인이 생성한 draft만)
 * NOTE: This route MUST be defined before /:id to avoid conflicts
 */
route.get('/drafts', async (c) => {
  try {
    const user = c.get('user');

    const { results } = await c.env.DB
      .prepare(
        `SELECT id, name, draft_step, updated_at
         FROM projects
         WHERE is_draft = 1 AND created_by = ?
         ORDER BY updated_at DESC`
      )
      .bind(user.id)
      .all();

    return c.json({ data: results });
  } catch (err) {
    console.error('GET /projects/drafts error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/projects/drafts
 * 임시 저장 생성/갱신 (all users for own drafts)
 */
route.post('/drafts', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<{
      id?: string;
      draft_step?: number;
      name?: string;
      type?: string;
      department_id?: string;
      department_ids?: string[];
      client_id?: string;
      sales_rep_id?: string;
      pm_id?: string;
      contract_amount?: number;
      start_date?: string;
      end_date?: string;
      description?: string;
    }>();

    const now = nowISO();

    if (body.id) {
      // Update existing draft
      const existing = await c.env.DB
        .prepare('SELECT id, created_by FROM projects WHERE id = ? AND is_draft = 1')
        .bind(body.id)
        .first<{ id: string; created_by: string }>();

      if (!existing) {
        return c.json({ error: 'NOT_FOUND', message: 'Draft not found' }, 404);
      }

      if (existing.created_by !== user.id && user.role !== 'admin') {
        return c.json({ error: 'FORBIDDEN', message: 'Cannot update another user\'s draft' }, 403);
      }

      // Build dynamic update
      const fields: string[] = ['updated_at = ?'];
      const values: any[] = [now];

      if (body.draft_step !== undefined) { fields.push('draft_step = ?'); values.push(body.draft_step); }
      if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
      if (body.type !== undefined) { fields.push('type = ?'); values.push(body.type); }
      // Resolve department_ids for multi-department support
      const draftDepartmentIds = body.department_ids && body.department_ids.length > 0
        ? body.department_ids
        : undefined;
      const draftPrimaryDeptId = draftDepartmentIds ? draftDepartmentIds[0] : body.department_id;

      if (draftPrimaryDeptId !== undefined) { fields.push('department_id = ?'); values.push(draftPrimaryDeptId); }
      if (body.client_id !== undefined) { fields.push('client_id = ?'); values.push(body.client_id); }
      if (body.sales_rep_id !== undefined) { fields.push('sales_rep_id = ?'); values.push(body.sales_rep_id); }
      if (body.pm_id !== undefined) { fields.push('pm_id = ?'); values.push(body.pm_id); }
      if (body.contract_amount !== undefined) { fields.push('contract_amount = ?'); values.push(body.contract_amount); }
      if (body.start_date !== undefined) { fields.push('start_date = ?'); values.push(body.start_date); }
      if (body.end_date !== undefined) { fields.push('end_date = ?'); values.push(body.end_date); }
      if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }

      values.push(body.id);

      await c.env.DB
        .prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();

      // Update project departments if department_ids provided
      if (draftDepartmentIds && draftPrimaryDeptId) {
        await setProjectDepartments(c.env.DB, body.id, draftDepartmentIds, draftPrimaryDeptId);
      }

      const updated = await c.env.DB
        .prepare('SELECT id, name, draft_step, updated_at FROM projects WHERE id = ?')
        .bind(body.id)
        .first();

      return c.json(updated, 200);
    } else {
      // Create new draft
      const id = generateId('proj');
      const newDraftDeptIds = body.department_ids && body.department_ids.length > 0
        ? body.department_ids
        : body.department_id ? [body.department_id] : [];
      const deptId = newDraftDeptIds.length > 0 ? newDraftDeptIds[0] : 'SE';
      const projectCode = await generateProjectCode(c.env.DB, deptId);

      await c.env.DB
        .prepare(
          `INSERT INTO projects
           (id, project_code, name, type, status, department_id, client_id,
            sales_rep_id, pm_id, contract_amount, start_date, end_date,
            description, is_draft, draft_step, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`
        )
        .bind(
          id,
          projectCode,
          body.name || '임시 프로젝트',
          body.type || 'SI',
          deptId,
          body.client_id || null,
          body.sales_rep_id || null,
          body.pm_id || null,
          body.contract_amount || 0,
          body.start_date || null,
          body.end_date || null,
          body.description || null,
          body.draft_step || 1,
          user.id,
          now,
          now
        )
        .run();

      // Set project departments in junction table
      if (newDraftDeptIds.length > 0) {
        await setProjectDepartments(c.env.DB, id, newDraftDeptIds, deptId);
      }

      const created = await c.env.DB
        .prepare('SELECT id, name, draft_step, updated_at FROM projects WHERE id = ?')
        .bind(id)
        .first();

      return c.json(created, 201);
    }
  } catch (err) {
    console.error('POST /projects/drafts error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/projects/bulk
 * CSV/Excel 일괄 등록 (admin, master)
 * NOTE: Must be before /:id to avoid route conflicts
 */
route.post('/bulk', requireRole('admin'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<{
      projects: Array<{
        row_index: number;
        name: string;
        type: string;
        department_ids: string[];
        client_id?: string;
        client_name?: string;
        sales_rep_id?: string;
        pm_id?: string;
        pm_type?: string;
        pm_name?: string;
        contract_amount: number;
        start_date: string;
        end_date: string;
        description?: string;
        status?: string;
      }>;
      auto_create_clients: boolean;
    }>();

    if (!body.projects || !Array.isArray(body.projects) || body.projects.length === 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'projects array is required' }, 400);
    }

    if (body.projects.length > 100) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Maximum 100 projects per batch' }, 400);
    }

    const results: Array<{
      row_index: number;
      success: boolean;
      project_id?: string;
      project_code?: string;
      error?: string;
    }> = [];
    const createdClients: Array<{ name: string; id: string }> = [];
    const now = nowISO();

    for (const item of body.projects) {
      try {
        // Validate required fields
        if (!item.name || !item.type || !item.department_ids?.length) {
          throw new Error('필수 항목 누락: 프로젝트명, 유형, 부서');
        }

        if (!['SI', 'SM'].includes(item.type)) {
          throw new Error(`유형이 올바르지 않음: "${item.type}"`);
        }

        // Resolve client
        let clientId = item.client_id || null;
        if (!clientId && item.client_name && body.auto_create_clients) {
          const existing = await c.env.DB
            .prepare("SELECT id FROM clients WHERE LOWER(name) = LOWER(?)")
            .bind(item.client_name.trim())
            .first<{ id: string }>();

          if (existing) {
            clientId = existing.id;
          } else {
            clientId = generateId('cli');
            await c.env.DB
              .prepare('INSERT INTO clients (id, name) VALUES (?, ?)')
              .bind(clientId, item.client_name.trim())
              .run();
            createdClients.push({ name: item.client_name.trim(), id: clientId });
          }
        }

        const primaryDeptId = item.department_ids[0];
        const id = generateId('proj');
        const projectCode = await generateProjectCode(c.env.DB, primaryDeptId);
        const status = item.status || 'active';
        const pmType = item.pm_type || 'employee';
        const pmId = pmType === 'employee' ? (item.pm_id || null) : null;
        const pmName = pmType === 'freelancer' ? (item.pm_name || null) : null;

        await c.env.DB
          .prepare(
            `INSERT INTO projects
             (id, project_code, name, type, status, department_id, client_id,
              sales_rep_id, pm_id, pm_type, pm_name, contract_amount,
              start_date, end_date, description, is_draft, draft_step,
              created_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 4, ?, ?, ?)`
          )
          .bind(
            id, projectCode, item.name, item.type, status,
            primaryDeptId, clientId,
            item.sales_rep_id || null,
            pmId, pmType, pmName,
            item.contract_amount || 0,
            item.start_date || null,
            item.end_date || null,
            item.description || null,
            user.id, now, now
          )
          .run();

        await setProjectDepartments(c.env.DB, id, item.department_ids, primaryDeptId);

        results.push({
          row_index: item.row_index,
          success: true,
          project_id: id,
          project_code: projectCode,
        });
      } catch (err: any) {
        results.push({
          row_index: item.row_index,
          success: false,
          error: err.message || 'Unknown error',
        });
      }
    }

    return c.json({
      total: body.projects.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
      created_clients: createdClients,
    });
  } catch (err) {
    console.error('POST /projects/bulk error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * GET /api/projects
 * 프로젝트 목록 (필터/검색/페이지네이션)
 */
route.get('/', async (c) => {
  try {
    const departmentId = c.req.query('department_id') || null;
    const status = c.req.query('status') || null;
    const type = c.req.query('type') || null;
    const startFrom = c.req.query('start_from') || null;
    const startTo = c.req.query('start_to') || null;
    const search = c.req.query('search') || null;
    const isDraft = c.req.query('is_draft') || '0';
    const pagination = parsePagination(c.req.query());

    // Build WHERE clause
    let where = ' WHERE 1=1';
    const params: any[] = [];

    // Exclude drafts by default
    if (isDraft === '0') {
      where += ' AND p.is_draft = 0';
    } else {
      where += ' AND p.is_draft = 1';
    }

    if (departmentId) {
      where += ' AND p.id IN (SELECT project_id FROM project_departments WHERE department_id = ?)';
      params.push(departmentId);
    }

    if (status) {
      where += ' AND p.status = ?';
      params.push(status);
    }

    if (type) {
      where += ' AND p.type = ?';
      params.push(type);
    }

    if (startFrom) {
      where += ' AND p.start_date >= ?';
      params.push(startFrom);
    }

    if (startTo) {
      where += ' AND p.start_date <= ?';
      params.push(startTo);
    }

    if (search) {
      where += " AND (p.name LIKE '%' || ? || '%' OR p.project_code LIKE '%' || ? || '%')";
      params.push(search, search);
    }

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM projects p ${where}`;
    const countResult = await c.env.DB
      .prepare(countSql)
      .bind(...params)
      .first<{ total: number }>();

    const total = countResult?.total ?? 0;

    // Fetch page
    const dataSql = `${PROJECT_SELECT} ${where} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`;
    const dataParams = [...params, pagination.limit, calcOffset(pagination)];

    const { results } = await c.env.DB
      .prepare(dataSql)
      .bind(...dataParams)
      .all();

    // Batch-fetch departments for all projects
    const projectIds = results.map((r: any) => r.id as string);
    let deptMap: Record<string, any[]> = {};
    if (projectIds.length > 0) {
      const placeholders = projectIds.map(() => '?').join(',');
      const { results: deptResults } = await c.env.DB
        .prepare(`
          SELECT pd.project_id, pd.department_id, d.name AS department_name, pd.is_primary
          FROM project_departments pd
          JOIN departments d ON pd.department_id = d.id
          WHERE pd.project_id IN (${placeholders})
          ORDER BY pd.is_primary DESC, d.name ASC
        `)
        .bind(...projectIds)
        .all();

      for (const row of deptResults) {
        const pid = row.project_id as string;
        if (!deptMap[pid]) deptMap[pid] = [];
        deptMap[pid].push({
          department_id: row.department_id,
          department_name: row.department_name,
          is_primary: row.is_primary,
        });
      }
    }

    const data = results.map((r: any) => ({
      ...r,
      departments: deptMap[r.id as string] || [],
    }));

    return c.json({
      data,
      pagination: paginationResult(total, pagination),
    });
  } catch (err) {
    console.error('GET /projects error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/projects
 * 프로젝트 등록 (manager, admin)
 */
route.post('/', requireRole('manager', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<{
      name: string;
      type: string;
      department_id?: string;
      department_ids?: string[];
      client_id?: string;
      sales_rep_id?: string;
      pm_id?: string;
      pm_type?: string;
      pm_name?: string;
      contract_amount?: number;
      start_date?: string;
      end_date?: string;
      description?: string;
      is_draft?: number;
      payment_schedule?: Array<{ label: string; period: string; amount: number }>;
    }>();

    // Resolve department_ids and primary department
    const departmentIds = body.department_ids && body.department_ids.length > 0
      ? body.department_ids
      : body.department_id ? [body.department_id] : [];

    const primaryDeptId = departmentIds.length > 0 ? departmentIds[0] : undefined;

    // Validation
    if (!body.name || !body.type || !primaryDeptId) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'name, type, and department_id (or department_ids) are required' },
        400
      );
    }

    if (!['SI', 'SM'].includes(body.type)) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'type must be SI or SM' },
        400
      );
    }

    if (body.contract_amount !== undefined && body.contract_amount < 0) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'contract_amount must be a positive number' },
        400
      );
    }

    const id = generateId('proj');
    const projectCode = await generateProjectCode(c.env.DB, primaryDeptId);
    const isDraft = body.is_draft ?? 0;
    const status = isDraft ? 'draft' : 'active';
    const now = nowISO();

    const pmType = body.pm_type || 'employee';
    const pmId = pmType === 'employee' ? (body.pm_id || null) : null;
    const pmName = pmType === 'freelancer' ? (body.pm_name || null) : null;

    await c.env.DB
      .prepare(
        `INSERT INTO projects
         (id, project_code, name, type, status, department_id, client_id,
          sales_rep_id, pm_id, pm_type, pm_name, contract_amount, start_date, end_date,
          description, is_draft, draft_step, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4, ?, ?, ?)`
      )
      .bind(
        id,
        projectCode,
        body.name,
        body.type,
        status,
        primaryDeptId,
        body.client_id || null,
        body.sales_rep_id || null,
        pmId,
        pmType,
        pmName,
        body.contract_amount || 0,
        body.start_date || null,
        body.end_date || null,
        body.description || null,
        isDraft,
        user.id,
        now,
        now
      )
      .run();

    // Set project departments in junction table
    await setProjectDepartments(c.env.DB, id, departmentIds, primaryDeptId);

    // Create settlements from payment schedule
    if (body.payment_schedule && body.payment_schedule.length > 0 && !isDraft) {
      // Group by period (in case SI milestones share the same month)
      const periodMap = new Map<string, number>();
      for (const item of body.payment_schedule) {
        if (item.amount > 0 && item.period) {
          const existing = periodMap.get(item.period) || 0;
          periodMap.set(item.period, existing + item.amount);
        }
      }
      for (const [period, amount] of periodMap) {
        const stlId = generateId('stl');
        await c.env.DB
          .prepare(
            `INSERT INTO settlements (id, project_id, period, revenue, total_labor, total_expense, operating_profit, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 0, 0, 0, 'pending', ?, ?)`
          )
          .bind(stlId, id, period, amount, now, now)
          .run();
      }
    }

    // Return full project with joins
    const created = await c.env.DB
      .prepare(`${PROJECT_SELECT} WHERE p.id = ?`)
      .bind(id)
      .first();

    const departments = await getProjectDepartments(c.env.DB, id);

    return c.json({ ...created, departments }, 201);
  } catch (err) {
    console.error('POST /projects error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * GET /api/projects/:id
 * 프로젝트 상세 조회
 */
route.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const project = await c.env.DB
      .prepare(`${PROJECT_SELECT} WHERE p.id = ?`)
      .bind(id)
      .first();

    if (!project) {
      return c.json({ error: 'NOT_FOUND', message: 'Project not found' }, 404);
    }

    const departments = await getProjectDepartments(c.env.DB, id);

    return c.json({ ...project, departments });
  } catch (err) {
    console.error('GET /projects/:id error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * PUT /api/projects/:id
 * 프로젝트 전체 수정 (manager, admin)
 */
route.put('/:id', requireRole('manager', 'admin'), async (c) => {
  try {
    const id = c.req.param('id');

    // Check project exists
    const existing = await c.env.DB
      .prepare('SELECT id FROM projects WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ error: 'NOT_FOUND', message: 'Project not found' }, 404);
    }

    const body = await c.req.json<{
      name?: string;
      type?: string;
      status?: string;
      department_id?: string;
      department_ids?: string[];
      client_id?: string;
      sales_rep_id?: string;
      pm_id?: string;
      pm_type?: string;
      pm_name?: string;
      contract_amount?: number;
      start_date?: string;
      end_date?: string;
      description?: string;
      is_draft?: number;
      draft_step?: number;
      payment_schedule?: Array<{ label: string; period: string; amount: number }>;
    }>();

    const now = nowISO();
    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
    if (body.type !== undefined) {
      if (!['SI', 'SM'].includes(body.type)) {
        return c.json({ error: 'VALIDATION_ERROR', message: 'type must be SI or SM' }, 400);
      }
      fields.push('type = ?'); values.push(body.type);
    }
    if (body.status !== undefined) {
      const validStatuses = ['draft', 'active', 'settlement_pending', 'settled', 'on_hold', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        return c.json({ error: 'VALIDATION_ERROR', message: 'Invalid status value' }, 400);
      }
      fields.push('status = ?'); values.push(body.status);
    }
    // Resolve department_ids for multi-department support
    const departmentIds = body.department_ids && body.department_ids.length > 0
      ? body.department_ids
      : undefined;
    const primaryDeptId = departmentIds ? departmentIds[0] : body.department_id;

    if (primaryDeptId !== undefined) { fields.push('department_id = ?'); values.push(primaryDeptId); }
    if (body.client_id !== undefined) { fields.push('client_id = ?'); values.push(body.client_id); }
    if (body.sales_rep_id !== undefined) { fields.push('sales_rep_id = ?'); values.push(body.sales_rep_id); }
    if (body.pm_type !== undefined) { fields.push('pm_type = ?'); values.push(body.pm_type); }
    if (body.pm_id !== undefined) { fields.push('pm_id = ?'); values.push(body.pm_id); }
    if (body.pm_name !== undefined) { fields.push('pm_name = ?'); values.push(body.pm_name); }
    if (body.contract_amount !== undefined) {
      if (body.contract_amount < 0) {
        return c.json({ error: 'VALIDATION_ERROR', message: 'contract_amount must be a positive number' }, 400);
      }
      fields.push('contract_amount = ?'); values.push(body.contract_amount);
    }
    if (body.start_date !== undefined) { fields.push('start_date = ?'); values.push(body.start_date); }
    if (body.end_date !== undefined) { fields.push('end_date = ?'); values.push(body.end_date); }
    if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
    if (body.is_draft !== undefined) { fields.push('is_draft = ?'); values.push(body.is_draft); }
    if (body.draft_step !== undefined) { fields.push('draft_step = ?'); values.push(body.draft_step); }

    values.push(id);

    await c.env.DB
      .prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    // Update project departments if department_ids provided
    if (departmentIds && primaryDeptId) {
      await setProjectDepartments(c.env.DB, id, departmentIds, primaryDeptId);
    }

    // Recreate settlements if payment_schedule provided
    if (body.payment_schedule && body.payment_schedule.length > 0) {
      // Delete existing settlements for this project
      await c.env.DB
        .prepare('DELETE FROM settlements WHERE project_id = ?')
        .bind(id)
        .run();

      // Group by period and create new settlements
      const periodMap = new Map<string, number>();
      for (const item of body.payment_schedule) {
        if (item.amount > 0 && item.period) {
          const existing = periodMap.get(item.period) || 0;
          periodMap.set(item.period, existing + item.amount);
        }
      }
      for (const [period, amount] of periodMap) {
        const stlId = generateId('stl');
        await c.env.DB
          .prepare(
            `INSERT INTO settlements (id, project_id, period, revenue, total_labor, total_expense, operating_profit, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 0, 0, 0, 'pending', ?, ?)`
          )
          .bind(stlId, id, period, amount, now, now)
          .run();
      }
    }

    const updated = await c.env.DB
      .prepare(`${PROJECT_SELECT} WHERE p.id = ?`)
      .bind(id)
      .first();

    const departments = await getProjectDepartments(c.env.DB, id);

    return c.json({ ...updated, departments });
  } catch (err) {
    console.error('PUT /projects/:id error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * DELETE /api/projects/:id
 * 프로젝트 삭제 (admin only)
 */
route.delete('/:id', requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id');

    const existing = await c.env.DB
      .prepare('SELECT id FROM projects WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ error: 'NOT_FOUND', message: 'Project not found' }, 404);
    }

    await c.env.DB
      .prepare('DELETE FROM projects WHERE id = ?')
      .bind(id)
      .run();

    return c.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('DELETE /projects/:id error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * GET /api/projects/:id/settlements
 * 프로젝트 정산 내역 조회 (for edit page payment schedule)
 */
route.get('/:id/settlements', async (c) => {
  try {
    const id = c.req.param('id');

    const { results } = await c.env.DB
      .prepare(
        `SELECT id, period, revenue, status, note
         FROM settlements
         WHERE project_id = ?
         ORDER BY period ASC`
      )
      .bind(id)
      .all();

    return c.json({ data: results });
  } catch (err) {
    console.error('GET /projects/:id/settlements error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * PUT /api/projects/:id/status
 * 상태 인라인 변경 (manager, admin)
 */
route.put('/:id/status', requireRole('manager', 'admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ status: string }>();

    if (!body.status) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'status is required' },
        400
      );
    }

    const validStatuses = ['draft', 'active', 'settlement_pending', 'settled', 'on_hold', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid status value' },
        400
      );
    }

    const existing = await c.env.DB
      .prepare('SELECT id FROM projects WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ error: 'NOT_FOUND', message: 'Project not found' }, 404);
    }

    const now = nowISO();

    await c.env.DB
      .prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?')
      .bind(body.status, now, id)
      .run();

    return c.json({
      id,
      status: body.status,
      updated_at: now,
    });
  } catch (err) {
    console.error('PUT /projects/:id/status error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
