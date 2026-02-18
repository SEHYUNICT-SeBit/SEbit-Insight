// ============================================================
// SEbit Insight v1.0 - Employees Routes
// GET, POST, PUT /api/employees
// GET /api/employees/:id/projects
// ============================================================

import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireRole } from '../middleware/role';
import { generateId } from '../db/helpers';

const route = new Hono<AppBindings>();

const EMPLOYEE_SELECT = `
  SELECT
    e.id, e.name, e.email, e.department_id,
    d.name AS department_name,
    e.position, e.role, e.is_active, e.employment_status
  FROM employees e
  LEFT JOIN departments d ON e.department_id = d.id
`;

/**
 * GET /api/employees
 * 직원 목록 조회 (all roles)
 * Query: department_id, is_active (0|1), employment_status, include_all, search
 */
route.get('/', async (c) => {
  try {
    const departmentId = c.req.query('department_id') || null;
    const isActive = c.req.query('is_active');
    const employmentStatus = c.req.query('employment_status') || null;
    const includeAll = c.req.query('include_all') || null;
    const search = c.req.query('search') || null;

    let sql = `${EMPLOYEE_SELECT} WHERE 1=1`;
    const params: any[] = [];

    // Filter by department
    if (departmentId) {
      sql += ' AND e.department_id = ?';
      params.push(departmentId);
    }

    // Filter by employment status or active status
    if (employmentStatus) {
      sql += ' AND e.employment_status = ?';
      params.push(employmentStatus);
    } else if (includeAll) {
      // Show all statuses (HR page)
    } else if (isActive !== undefined && isActive !== null) {
      sql += ' AND e.is_active = ?';
      params.push(parseInt(isActive, 10));
    } else {
      // Default: show active only (backward compat)
      sql += ' AND e.is_active = 1';
    }

    // Search by name
    if (search) {
      sql += " AND e.name LIKE '%' || ? || '%'";
      params.push(search);
    }

    sql += ' ORDER BY e.name';

    const { results } = await c.env.DB
      .prepare(sql)
      .bind(...params)
      .all();

    return c.json({ data: results });
  } catch (err) {
    console.error('GET /employees error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/employees
 * 직원 등록 (admin only)
 */
route.post('/', requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json<{
      name: string;
      email: string;
      department_id: string;
      position: string;
      role?: string;
    }>();

    // Validation
    if (!body.name || !body.email || !body.department_id || !body.position) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'name, email, department_id, and position are required' },
        400
      );
    }

    // Check email uniqueness
    const existingEmail = await c.env.DB
      .prepare('SELECT id FROM employees WHERE email = ?')
      .bind(body.email)
      .first();

    if (existingEmail) {
      return c.json(
        { error: 'CONFLICT', message: 'Email already exists' },
        409
      );
    }

    // Check department exists
    const dept = await c.env.DB
      .prepare('SELECT id FROM departments WHERE id = ?')
      .bind(body.department_id)
      .first();

    if (!dept) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid department_id' },
        400
      );
    }

    const id = generateId('emp');
    const role = body.role || 'user';

    await c.env.DB
      .prepare(
        `INSERT INTO employees (id, name, email, department_id, position, role)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, body.name, body.email, body.department_id, body.position, role)
      .run();

    // Return created employee with department name
    const created = await c.env.DB
      .prepare(`${EMPLOYEE_SELECT} WHERE e.id = ?`)
      .bind(id)
      .first();

    return c.json(created, 201);
  } catch (err) {
    console.error('POST /employees error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * PUT /api/employees/:id
 * 직원 정보 수정 (admin only)
 */
route.put('/:id', requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{
      role?: string;
      department_id?: string;
      position?: string;
      is_active?: number;
      employment_status?: string;
    }>();

    const fields: string[] = [];
    const values: any[] = [];

    if (body.role !== undefined) {
      const validRoles = ['master', 'admin', 'manager', 'user'];
      if (!validRoles.includes(body.role)) {
        return c.json({ error: 'VALIDATION_ERROR', message: 'Invalid role value' }, 400);
      }
      fields.push('role = ?');
      values.push(body.role);
    }
    if (body.department_id !== undefined) {
      fields.push('department_id = ?');
      values.push(body.department_id);
    }
    if (body.position !== undefined) {
      fields.push('position = ?');
      values.push(body.position);
    }
    if (body.employment_status !== undefined) {
      const validStatuses = ['재직', '휴직', '병가', '퇴직'];
      if (!validStatuses.includes(body.employment_status)) {
        return c.json({ error: 'VALIDATION_ERROR', message: 'Invalid employment_status value' }, 400);
      }
      fields.push('employment_status = ?');
      values.push(body.employment_status);
      // Auto-sync is_active
      fields.push('is_active = ?');
      values.push(body.employment_status === '퇴직' ? 0 : 1);
    } else if (body.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(body.is_active);
    }

    if (fields.length === 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'No valid fields to update' }, 400);
    }

    const existing = await c.env.DB
      .prepare('SELECT id FROM employees WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ error: 'NOT_FOUND', message: 'Employee not found' }, 404);
    }

    values.push(id);
    await c.env.DB
      .prepare(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await c.env.DB
      .prepare(`${EMPLOYEE_SELECT} WHERE e.id = ?`)
      .bind(id)
      .first();

    return c.json({ data: updated });
  } catch (err) {
    console.error('PUT /employees/:id error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * GET /api/employees/:id/projects
 * 직원의 투입 과제 목록 조회 (all roles)
 */
route.get('/:id/projects', async (c) => {
  try {
    const employeeId = c.req.param('id');

    const employee = await c.env.DB
      .prepare('SELECT id FROM employees WHERE id = ?')
      .bind(employeeId)
      .first();

    if (!employee) {
      return c.json({ error: 'NOT_FOUND', message: 'Employee not found' }, 404);
    }

    const { results } = await c.env.DB
      .prepare(`
        SELECT
          ps.id AS staffing_id,
          ps.position AS staffing_position,
          ps.man_month,
          ps.monthly_rate,
          ps.total_cost,
          ps.note,
          p.id AS project_id,
          p.project_code,
          p.name AS project_name,
          p.type AS project_type,
          p.status AS project_status,
          p.start_date,
          p.end_date,
          d.name AS department_name
        FROM project_staffing ps
        JOIN projects p ON ps.project_id = p.id
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE ps.employee_id = ?
        ORDER BY p.start_date DESC
      `)
      .bind(employeeId)
      .all();

    return c.json({ data: results });
  } catch (err) {
    console.error('GET /employees/:id/projects error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
