// ============================================================
// SEbit Insight v1.0 - Dashboard Routes
// GET /api/dashboard/summary
// ============================================================

import { Hono } from 'hono';
import type { AppBindings, DashboardSummary } from '../types';

const route = new Hono<AppBindings>();

/**
 * GET /api/dashboard/summary
 * 대시보드 요약 (all roles)
 * Query: year (default: current year), month (optional)
 */
route.get('/summary', async (c) => {
  try {
    const currentYear = new Date().getFullYear();
    const year = parseInt(c.req.query('year') || String(currentYear), 10);
    const month = c.req.query('month') ? parseInt(c.req.query('month')!, 10) : null;

    const yearStr = String(year);
    const periodLike = month
      ? `${yearStr}-${String(month).padStart(2, '0')}`
      : `${yearStr}-%`;

    // 1. Total contract amount (non-draft projects for the year)
    const totalContractResult = await c.env.DB
      .prepare(
        `SELECT COALESCE(SUM(contract_amount), 0) as total
         FROM projects
         WHERE is_draft = 0
           AND strftime('%Y', start_date) = ?`
      )
      .bind(yearStr)
      .first<{ total: number }>();

    const totalContractAmount = totalContractResult?.total ?? 0;

    // 2. Revenue YTD & Operating Profit YTD from settlements
    const revenueResult = await c.env.DB
      .prepare(
        `SELECT
           COALESCE(SUM(revenue), 0) as total_revenue,
           COALESCE(SUM(operating_profit), 0) as total_profit
         FROM settlements
         WHERE period LIKE ?`
      )
      .bind(periodLike)
      .first<{ total_revenue: number; total_profit: number }>();

    const totalRevenueYtd = revenueResult?.total_revenue ?? 0;
    const totalOperatingProfitYtd = revenueResult?.total_profit ?? 0;
    const avgProfitRate = totalRevenueYtd > 0
      ? Math.round((totalOperatingProfitYtd / totalRevenueYtd) * 100 * 10) / 10
      : 0;

    // 3. Project counts by status
    const { results: statusCounts } = await c.env.DB
      .prepare(
        `SELECT status, COUNT(*) as cnt
         FROM projects
         WHERE is_draft = 0
         GROUP BY status`
      )
      .all();

    const projectCounts: Record<string, number> = {
      total: 0,
      active: 0,
      settlement_pending: 0,
      settled: 0,
      on_hold: 0,
      cancelled: 0,
    };

    for (const row of statusCounts) {
      const r = row as any;
      projectCounts[r.status] = r.cnt;
      projectCounts.total += r.cnt;
    }

    // 4. By department (투입인원 비율 기반 매출 배분)
    // 4a. Get all departments
    const { results: allDepts } = await c.env.DB
      .prepare('SELECT id, name FROM departments ORDER BY id')
      .all();

    // 4b. Get all active projects
    const { results: allProjects } = await c.env.DB
      .prepare('SELECT id, contract_amount, department_id FROM projects WHERE is_draft = 0')
      .all();

    // 4c. Get staffing headcount by project and department (via employee's department)
    const { results: staffingDeptRows } = await c.env.DB
      .prepare(
        `SELECT ps.project_id, e.department_id, COUNT(ps.id) as headcount
         FROM project_staffing ps
         JOIN employees e ON e.id = ps.employee_id
         WHERE ps.employee_id IS NOT NULL AND ps.employee_id != ''
         GROUP BY ps.project_id, e.department_id`
      )
      .all();

    // 4d. Get project_departments for fallback (projects without staffing)
    const { results: projDeptRows } = await c.env.DB
      .prepare(
        `SELECT pd.project_id, pd.department_id, pd.is_primary
         FROM project_departments pd
         JOIN projects p ON p.id = pd.project_id AND p.is_draft = 0`
      )
      .all();

    // 4e. Get revenue/profit by project
    const { results: revByProject } = await c.env.DB
      .prepare(
        `SELECT project_id, SUM(revenue) as revenue, SUM(operating_profit) as profit
         FROM settlements WHERE period LIKE ?
         GROUP BY project_id`
      )
      .bind(periodLike)
      .all();

    // Build maps
    const staffingMap = new Map<string, Map<string, number>>();
    for (const row of staffingDeptRows) {
      const r = row as any;
      if (!staffingMap.has(r.project_id)) staffingMap.set(r.project_id, new Map());
      staffingMap.get(r.project_id)!.set(r.department_id, r.headcount);
    }

    const projDeptMap = new Map<string, string[]>();
    for (const row of projDeptRows) {
      const r = row as any;
      if (!projDeptMap.has(r.project_id)) projDeptMap.set(r.project_id, []);
      projDeptMap.get(r.project_id)!.push(r.department_id);
    }

    const revMap = new Map<string, { revenue: number; profit: number }>();
    for (const row of revByProject) {
      const r = row as any;
      revMap.set(r.project_id, { revenue: r.revenue, profit: r.profit });
    }

    // Calculate department summaries
    const deptSummaryMap = new Map<string, {
      project_count: number; contract_amount: number;
      revenue_ytd: number; operating_profit_ytd: number;
    }>();
    for (const d of allDepts) {
      deptSummaryMap.set(d.id as string, {
        project_count: 0, contract_amount: 0,
        revenue_ytd: 0, operating_profit_ytd: 0,
      });
    }

    for (const proj of allProjects) {
      const p = proj as any;
      const staffing = staffingMap.get(p.id);
      const rev = revMap.get(p.id);

      // Determine dept ratios: staffing headcount or project_departments equal split
      let deptRatios: Map<string, number>;

      if (staffing && staffing.size > 0) {
        const totalHC = Array.from(staffing.values()).reduce((s, h) => s + h, 0);
        deptRatios = new Map();
        for (const [deptId, hc] of staffing) {
          deptRatios.set(deptId, hc / totalHC);
        }
      } else {
        // Fallback: project_departments equal split
        const depts = projDeptMap.get(p.id) || [p.department_id];
        deptRatios = new Map();
        const share = 1 / depts.length;
        for (const deptId of depts) {
          deptRatios.set(deptId, share);
        }
      }

      // Distribute amounts by ratio
      for (const [deptId, ratio] of deptRatios) {
        const summary = deptSummaryMap.get(deptId);
        if (!summary) continue;
        summary.project_count += 1;
        summary.contract_amount += p.contract_amount * ratio;
        if (rev) {
          summary.revenue_ytd += rev.revenue * ratio;
          summary.operating_profit_ytd += rev.profit * ratio;
        }
      }
    }

    // 경영기획그룹(MGMT)은 매출 발생 부서가 아니므로 제외, 고정 정렬
    const DEPT_ORDER = ['SE', 'SM', 'AI', 'RND', 'CONTENT'];
    const revenueDepts = DEPT_ORDER
      .map(id => allDepts.find((d: any) => d.id === id))
      .filter(Boolean) as any[];
    const byDepartment = revenueDepts.map((d: any) => {
      const s = deptSummaryMap.get(d.id)!;
      return {
        department_id: d.id,
        department_name: d.name,
        project_count: s.project_count,
        contract_amount: Math.round(s.contract_amount),
        revenue_ytd: Math.round(s.revenue_ytd),
        operating_profit_ytd: Math.round(s.operating_profit_ytd),
        profit_rate: s.revenue_ytd > 0
          ? Math.round((s.operating_profit_ytd / s.revenue_ytd) * 100 * 10) / 10
          : 0,
      };
    });

    // 5. By type (SI / SM)
    const { results: typeResults } = await c.env.DB
      .prepare(
        `SELECT type, COUNT(*) as cnt, COALESCE(SUM(contract_amount), 0) as contract_amount
         FROM projects
         WHERE is_draft = 0
         GROUP BY type`
      )
      .all();

    const byType: Record<string, { count: number; contract_amount: number }> = {
      SI: { count: 0, contract_amount: 0 },
      SM: { count: 0, contract_amount: 0 },
    };

    for (const row of typeResults) {
      const r = row as any;
      byType[r.type] = { count: r.cnt, contract_amount: r.contract_amount };
    }

    // 6. Recent projects (last 5 updated)
    const { results: recentResults } = await c.env.DB
      .prepare(
        `SELECT id, name, status, updated_at
         FROM projects
         WHERE is_draft = 0
         ORDER BY updated_at DESC
         LIMIT 5`
      )
      .all();

    // 7. Monthly settlement by project (current year, 12 months)
    const { results: monthlyResults } = await c.env.DB
      .prepare(
        `SELECT s.period AS month, s.project_id, p.name AS project_name, p.type AS project_type,
                s.revenue AS amount
         FROM settlements s
         JOIN projects p ON p.id = s.project_id
         WHERE s.period LIKE ?
           AND s.revenue > 0
         ORDER BY s.period, p.name`
      )
      .bind(`${yearStr}-%`)
      .all();

    // Group by month with per-project detail
    const monthlyMap = new Map<string, { projects: any[]; total: number }>();
    for (const row of monthlyResults) {
      const r = row as any;
      if (!monthlyMap.has(r.month)) {
        monthlyMap.set(r.month, { projects: [], total: 0 });
      }
      const entry = monthlyMap.get(r.month)!;
      entry.projects.push({
        project_id: r.project_id,
        project_name: r.project_name,
        project_type: r.project_type,
        amount: r.amount,
      });
      entry.total += r.amount;
    }

    // Fill all 12 months (even if no data)
    const monthlyRevenue = [];
    for (let m = 1; m <= 12; m++) {
      const monthKey = `${yearStr}-${String(m).padStart(2, '0')}`;
      const found = monthlyMap.get(monthKey);
      monthlyRevenue.push({
        month: monthKey,
        projects: found?.projects ?? [],
        total: found?.total ?? 0,
      });
    }

    // 8. Yearly revenue (last 5 years)
    const startYear = year - 4;
    const { results: yearlyResults } = await c.env.DB
      .prepare(
        `SELECT substr(period, 1, 4) AS year,
                COALESCE(SUM(revenue), 0) AS revenue,
                COALESCE(SUM(operating_profit), 0) AS operating_profit
         FROM settlements
         WHERE CAST(substr(period, 1, 4) AS INTEGER) >= ?
         GROUP BY substr(period, 1, 4)
         ORDER BY year`
      )
      .bind(startYear)
      .all();

    // Yearly contract amounts
    const { results: yearlyContractResults } = await c.env.DB
      .prepare(
        `SELECT strftime('%Y', start_date) AS year,
                COALESCE(SUM(contract_amount), 0) AS contract_amount
         FROM projects
         WHERE is_draft = 0
           AND CAST(strftime('%Y', start_date) AS INTEGER) >= ?
         GROUP BY strftime('%Y', start_date)
         ORDER BY year`
      )
      .bind(startYear)
      .all();

    // Fill all years
    const yearlyRevenue = [];
    for (let y = startYear; y <= year; y++) {
      const yStr = String(y);
      const rev = yearlyResults.find((r: any) => r.year === yStr) as any;
      const con = yearlyContractResults.find((r: any) => r.year === yStr) as any;
      yearlyRevenue.push({
        year: yStr,
        revenue: rev?.revenue ?? 0,
        operating_profit: rev?.operating_profit ?? 0,
        contract_amount: con?.contract_amount ?? 0,
      });
    }

    const summary: DashboardSummary = {
      total_contract_amount: totalContractAmount,
      total_revenue_ytd: totalRevenueYtd,
      total_operating_profit_ytd: totalOperatingProfitYtd,
      avg_profit_rate: avgProfitRate,
      project_counts: projectCounts as any,
      by_department: byDepartment,
      by_type: byType as any,
      recent_projects: recentResults as any,
      monthly_revenue: monthlyRevenue,
      yearly_revenue: yearlyRevenue,
    };

    return c.json(summary);
  } catch (err) {
    console.error('GET /dashboard/summary error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
