// ============================================================
// SEbit Insight v1.0 - DB Helper Functions
// ============================================================

import type { PaginationParams, PaginationResult } from '../types';

/**
 * Generate a unique ID using crypto.randomUUID() (available in Workers environment)
 */
export function generateId(prefix: string): string {
  const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  return `${prefix}_${uuid}`;
}

/**
 * Parse pagination parameters from query string
 */
export function parsePagination(query: Record<string, string | undefined>): PaginationParams {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10) || 20));
  return { page, limit };
}

/**
 * Calculate pagination result from total count and params
 */
export function paginationResult(total: number, params: PaginationParams): PaginationResult {
  return {
    total,
    page: params.page,
    limit: params.limit,
    total_pages: Math.ceil(total / params.limit),
  };
}

/**
 * Calculate OFFSET for SQL LIMIT/OFFSET
 */
export function calcOffset(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}

/**
 * Generate project code: {부서ID}-{YYYY}-{순번3자리}
 * Example: SE-2026-001, AI-2026-012
 * Retries up to 3 times on unique constraint violation.
 */
export async function generateProjectCode(
  db: D1Database,
  departmentId: string
): Promise<string> {
  const year = new Date().getFullYear().toString();
  const prefix = `${departmentId}-${year}-`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM projects WHERE department_id = ? AND project_code LIKE ?`
      )
      .bind(departmentId, `${prefix}%`)
      .first<{ cnt: number }>();

    const seq = (result?.cnt ?? 0) + 1 + attempt;
    const code = `${prefix}${String(seq).padStart(3, '0')}`;

    // Check if code already exists
    const existing = await db
      .prepare('SELECT id FROM projects WHERE project_code = ?')
      .bind(code)
      .first();

    if (!existing) {
      return code;
    }
  }

  // Fallback: use timestamp-based suffix
  const ts = Date.now().toString().slice(-4);
  return `${prefix}${ts}`;
}

/**
 * Get current ISO datetime string (UTC)
 */
export function nowISO(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}
