// ============================================================
// SEbit Insight v1.0 - Permission Requests Routes
// GET, POST /api/permission-requests
// PUT /api/permission-requests/:id/approve, /:id/reject
// ============================================================

import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireMinRole } from '../middleware/role';
import { generateId } from '../db/helpers';

const route = new Hono<AppBindings>();

/**
 * GET /api/permission-requests
 * 권한 요청 목록 조회 (master 전용)
 * Query: status=pending|approved|rejected
 */
route.get('/', requireMinRole('master'), async (c) => {
  try {
    const status = c.req.query('status');

    let sql = `
      SELECT
        pr.id, pr.requester_id, pr.requested_role, pr.reason,
        pr.status, pr.reviewer_id, pr.review_comment, pr.reviewed_at,
        pr.created_at,
        e.name AS requester_name,
        e.email AS requester_email,
        d.name AS requester_department,
        rv.name AS reviewer_name
      FROM permission_requests pr
      LEFT JOIN employees e ON pr.requester_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employees rv ON pr.reviewer_id = rv.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ' AND pr.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY pr.created_at DESC';

    const { results } = await c.env.DB
      .prepare(sql)
      .bind(...params)
      .all();

    return c.json({ data: results });
  } catch (err) {
    console.error('GET /permission-requests error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * GET /api/permission-requests/mine
 * 내 권한 요청 목록 조회 (모든 인증 사용자)
 */
route.get('/mine', async (c) => {
  try {
    const user = c.get('user');

    const { results } = await c.env.DB
      .prepare(
        `SELECT
          pr.id, pr.requester_id, pr.requested_role, pr.reason,
          pr.status, pr.reviewer_id, pr.review_comment, pr.reviewed_at,
          pr.created_at,
          rv.name AS reviewer_name
        FROM permission_requests pr
        LEFT JOIN employees rv ON pr.reviewer_id = rv.id
        WHERE pr.requester_id = ?
        ORDER BY pr.created_at DESC`
      )
      .bind(user.id)
      .all();

    return c.json({ data: results });
  } catch (err) {
    console.error('GET /permission-requests/mine error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/permission-requests
 * 권한 요청 생성 (master/admin은 이미 높은 권한이므로 요청 불필요)
 * Body: { requested_role: 'admin'|'manager', reason: string }
 */
route.post('/', async (c) => {
  try {
    const user = c.get('user');

    // master/admin은 이미 높은 권한 보유
    if (user.role === 'master' || user.role === 'admin') {
      return c.json(
        { error: 'FORBIDDEN', message: 'Already have high-level permissions' },
        403
      );
    }

    const body = await c.req.json<{ requested_role: string; reason: string }>();

    // Validation
    if (!body.requested_role || !body.reason) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'requested_role and reason are required' },
        400
      );
    }

    if (!['admin', 'manager'].includes(body.requested_role)) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'requested_role must be admin or manager' },
        400
      );
    }

    // 중복 pending 요청 확인
    const existingPending = await c.env.DB
      .prepare(
        "SELECT id FROM permission_requests WHERE requester_id = ? AND status = 'pending'"
      )
      .bind(user.id)
      .first();

    if (existingPending) {
      return c.json(
        { error: 'CONFLICT', message: 'You already have a pending permission request' },
        409
      );
    }

    const id = generateId('perm');

    await c.env.DB
      .prepare(
        `INSERT INTO permission_requests (id, requester_id, requested_role, reason, status)
         VALUES (?, ?, ?, ?, 'pending')`
      )
      .bind(id, user.id, body.requested_role, body.reason)
      .run();

    // 생성된 요청 반환
    const created = await c.env.DB
      .prepare(
        `SELECT id, requester_id, requested_role, reason, status, created_at
         FROM permission_requests WHERE id = ?`
      )
      .bind(id)
      .first();

    return c.json(created, 201);
  } catch (err) {
    console.error('POST /permission-requests error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * PUT /api/permission-requests/:id/approve
 * 권한 요청 승인 (master 전용)
 * Body: { comment?: string }
 */
route.put('/:id/approve', requireMinRole('master'), async (c) => {
  try {
    const requestId = c.req.param('id');
    const user = c.get('user');
    const body = await c.req.json<{ comment?: string }>().catch(() => ({}));

    // 요청 조회
    const request = await c.env.DB
      .prepare(
        'SELECT id, requester_id, requested_role, status FROM permission_requests WHERE id = ?'
      )
      .bind(requestId)
      .first<{ id: string; requester_id: string; requested_role: string; status: string }>();

    if (!request) {
      return c.json({ error: 'NOT_FOUND', message: 'Permission request not found' }, 404);
    }

    if (request.status !== 'pending') {
      return c.json(
        { error: 'CONFLICT', message: `Request already ${request.status}` },
        409
      );
    }

    const reviewedAt = new Date().toISOString();

    // 트랜잭션: 요청 승인 + 직원 역할 업데이트
    await c.env.DB.batch([
      c.env.DB
        .prepare(
          `UPDATE permission_requests
           SET status = 'approved', reviewer_id = ?, review_comment = ?, reviewed_at = ?
           WHERE id = ?`
        )
        .bind(user.id, (body as any).comment || null, reviewedAt, requestId),
      c.env.DB
        .prepare('UPDATE employees SET role = ? WHERE id = ?')
        .bind(request.requested_role, request.requester_id),
    ]);

    // 업데이트된 요청 반환
    const updated = await c.env.DB
      .prepare(
        `SELECT
          pr.id, pr.requester_id, pr.requested_role, pr.reason,
          pr.status, pr.reviewer_id, pr.review_comment, pr.reviewed_at,
          pr.created_at,
          e.name AS requester_name,
          rv.name AS reviewer_name
        FROM permission_requests pr
        LEFT JOIN employees e ON pr.requester_id = e.id
        LEFT JOIN employees rv ON pr.reviewer_id = rv.id
        WHERE pr.id = ?`
      )
      .bind(requestId)
      .first();

    return c.json({ data: updated });
  } catch (err) {
    console.error('PUT /permission-requests/:id/approve error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * PUT /api/permission-requests/:id/reject
 * 권한 요청 거절 (master 전용)
 * Body: { comment?: string }
 */
route.put('/:id/reject', requireMinRole('master'), async (c) => {
  try {
    const requestId = c.req.param('id');
    const user = c.get('user');
    const body = await c.req.json<{ comment?: string }>().catch(() => ({}));

    // 요청 조회
    const request = await c.env.DB
      .prepare('SELECT id, status FROM permission_requests WHERE id = ?')
      .bind(requestId)
      .first<{ id: string; status: string }>();

    if (!request) {
      return c.json({ error: 'NOT_FOUND', message: 'Permission request not found' }, 404);
    }

    if (request.status !== 'pending') {
      return c.json(
        { error: 'CONFLICT', message: `Request already ${request.status}` },
        409
      );
    }

    const reviewedAt = new Date().toISOString();

    await c.env.DB
      .prepare(
        `UPDATE permission_requests
         SET status = 'rejected', reviewer_id = ?, review_comment = ?, reviewed_at = ?
         WHERE id = ?`
      )
      .bind(user.id, (body as any).comment || null, reviewedAt, requestId)
      .run();

    // 업데이트된 요청 반환
    const updated = await c.env.DB
      .prepare(
        `SELECT
          pr.id, pr.requester_id, pr.requested_role, pr.reason,
          pr.status, pr.reviewer_id, pr.review_comment, pr.reviewed_at,
          pr.created_at,
          e.name AS requester_name,
          rv.name AS reviewer_name
        FROM permission_requests pr
        LEFT JOIN employees e ON pr.requester_id = e.id
        LEFT JOIN employees rv ON pr.reviewer_id = rv.id
        WHERE pr.id = ?`
      )
      .bind(requestId)
      .first();

    return c.json({ data: updated });
  } catch (err) {
    console.error('PUT /permission-requests/:id/reject error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
