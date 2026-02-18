// ============================================================
// SEbit Insight v1.0 - Performance Dashboard Routes
// GET /api/dashboard/performance
// 역할별 개인 성과 지표: PM, 영업대표, 투입인력, 부서장
// ============================================================

import { Hono } from 'hono';
import type { AppBindings } from '../types';

const route = new Hono<AppBindings>();

/**
 * GET /api/dashboard/performance
 * 전체 성과 데이터 (PM, 영업대표, 투입인력, 부서별)
 * Query: year (default: current year)
 */
route.get('/performance', async (c) => {
  try {
    const currentYear = new Date().getFullYear();
    const year = parseInt(c.req.query('year') || String(currentYear), 10);
    const yearStr = String(year);
    const periodLike = `${yearStr}-%`;

    // ===== 1. PM 성과 =====
    const { results: pmRows } = await c.env.DB
      .prepare(
        `SELECT
           e.id, e.name, e.department_id, d.name AS department_name, e.position,
           COUNT(p.id) AS project_count,
           COALESCE(SUM(p.contract_amount), 0) AS total_contract,
           SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) AS active_count,
           SUM(CASE WHEN p.status = 'settled' THEN 1 ELSE 0 END) AS settled_count,
           SUM(CASE WHEN p.status IN ('on_hold', 'cancelled') THEN 1 ELSE 0 END) AS failed_count
         FROM employees e
         JOIN departments d ON e.department_id = d.id
         JOIN projects p ON p.pm_id = e.id AND p.is_draft = 0
         WHERE e.is_active = 1
         GROUP BY e.id
         ORDER BY total_contract DESC`
      )
      .all();

    // PM별 매출/이익 (settlements 기반)
    const { results: pmRevenueRows } = await c.env.DB
      .prepare(
        `SELECT p.pm_id,
                COALESCE(SUM(s.revenue), 0) AS revenue,
                COALESCE(SUM(s.operating_profit), 0) AS profit
         FROM settlements s
         JOIN projects p ON p.id = s.project_id AND p.is_draft = 0
         WHERE s.period LIKE ?
         GROUP BY p.pm_id`
      )
      .bind(periodLike)
      .all();

    const pmRevenueMap = new Map<string, { revenue: number; profit: number }>();
    for (const row of pmRevenueRows) {
      const r = row as any;
      if (r.pm_id) pmRevenueMap.set(r.pm_id, { revenue: r.revenue, profit: r.profit });
    }

    const pmPerformance = pmRows.map((row: any) => {
      const rev = pmRevenueMap.get(row.id);
      const revenue = rev?.revenue ?? 0;
      const profit = rev?.profit ?? 0;
      const completionRate = row.project_count > 0
        ? Math.round((row.settled_count / row.project_count) * 100 * 10) / 10
        : 0;
      const profitRate = revenue > 0
        ? Math.round((profit / revenue) * 100 * 10) / 10
        : 0;

      return {
        id: row.id,
        name: row.name,
        department_id: row.department_id,
        department_name: row.department_name,
        position: row.position,
        project_count: row.project_count,
        active_count: row.active_count,
        settled_count: row.settled_count,
        total_contract: row.total_contract,
        revenue,
        operating_profit: profit,
        profit_rate: profitRate,
        completion_rate: completionRate,
      };
    });

    // ===== 2. 영업대표 성과 =====
    const { results: salesRows } = await c.env.DB
      .prepare(
        `SELECT
           e.id, e.name, e.department_id, d.name AS department_name, e.position,
           COUNT(p.id) AS project_count,
           COALESCE(SUM(p.contract_amount), 0) AS total_contract,
           SUM(CASE WHEN p.type = 'SI' THEN 1 ELSE 0 END) AS si_count,
           SUM(CASE WHEN p.type = 'SM' THEN 1 ELSE 0 END) AS sm_count,
           SUM(CASE WHEN p.type = 'SI' THEN p.contract_amount ELSE 0 END) AS si_amount,
           SUM(CASE WHEN p.type = 'SM' THEN p.contract_amount ELSE 0 END) AS sm_amount,
           SUM(CASE WHEN p.status = 'settled' THEN 1 ELSE 0 END) AS settled_count
         FROM employees e
         JOIN departments d ON e.department_id = d.id
         JOIN projects p ON p.sales_rep_id = e.id AND p.is_draft = 0
         WHERE e.is_active = 1
         GROUP BY e.id
         ORDER BY total_contract DESC`
      )
      .all();

    // 영업대표별 매출 기여
    const { results: salesRevenueRows } = await c.env.DB
      .prepare(
        `SELECT p.sales_rep_id,
                COALESCE(SUM(s.revenue), 0) AS revenue
         FROM settlements s
         JOIN projects p ON p.id = s.project_id AND p.is_draft = 0
         WHERE s.period LIKE ?
         GROUP BY p.sales_rep_id`
      )
      .bind(periodLike)
      .all();

    const salesRevenueMap = new Map<string, number>();
    for (const row of salesRevenueRows) {
      const r = row as any;
      if (r.sales_rep_id) salesRevenueMap.set(r.sales_rep_id, r.revenue);
    }

    const salesPerformance = salesRows.map((row: any) => {
      const revenue = salesRevenueMap.get(row.id) ?? 0;
      const conversionRate = row.project_count > 0
        ? Math.round((row.settled_count / row.project_count) * 100 * 10) / 10
        : 0;

      return {
        id: row.id,
        name: row.name,
        department_id: row.department_id,
        department_name: row.department_name,
        position: row.position,
        project_count: row.project_count,
        total_contract: row.total_contract,
        si_count: row.si_count,
        sm_count: row.sm_count,
        si_amount: row.si_amount,
        sm_amount: row.sm_amount,
        revenue_contribution: revenue,
        conversion_rate: conversionRate,
      };
    });

    // ===== 3. 투입 인력 현황 =====
    const { results: staffRows } = await c.env.DB
      .prepare(
        `SELECT
           e.id, e.name, e.department_id, d.name AS department_name, e.position,
           COUNT(DISTINCT ps.project_id) AS project_count,
           COALESCE(SUM(ps.man_month), 0) AS total_mm,
           COALESCE(SUM(ps.total_cost), 0) AS total_cost
         FROM employees e
         JOIN departments d ON e.department_id = d.id
         JOIN project_staffing ps ON ps.employee_id = e.id
         JOIN projects p ON p.id = ps.project_id AND p.is_draft = 0
         WHERE e.is_active = 1
         GROUP BY e.id
         ORDER BY total_mm DESC`
      )
      .all();

    // 연간 가용 M/M = 12 (1명 기준)
    const annualAvailableMM = 12;
    const staffPerformance = staffRows.map((row: any) => {
      const utilization = annualAvailableMM > 0
        ? Math.round((row.total_mm / annualAvailableMM) * 100 * 10) / 10
        : 0;

      return {
        id: row.id,
        name: row.name,
        department_id: row.department_id,
        department_name: row.department_name,
        position: row.position,
        project_count: row.project_count,
        total_mm: Math.round(row.total_mm * 100) / 100,
        total_cost: row.total_cost,
        utilization_rate: Math.min(utilization, 100),
      };
    });

    // ===== 4. 부서별 성과 (부서장 뷰) =====
    const { results: allDepts } = await c.env.DB
      .prepare('SELECT id, name FROM departments ORDER BY id')
      .all();

    const deptPerformance = [];

    for (const dept of allDepts) {
      const deptId = dept.id as string;
      const deptName = dept.name as string;

      // 부서 인원수
      const headcountResult = await c.env.DB
        .prepare(
          `SELECT COUNT(*) AS cnt FROM employees
           WHERE department_id = ? AND is_active = 1`
        )
        .bind(deptId)
        .first<{ cnt: number }>();

      // 부서 인원의 총 투입 M/M 및 인건비
      const staffResult = await c.env.DB
        .prepare(
          `SELECT
             COALESCE(SUM(ps.man_month), 0) AS total_mm,
             COALESCE(SUM(ps.total_cost), 0) AS total_labor_cost,
             COUNT(DISTINCT ps.employee_id) AS staffed_count
           FROM project_staffing ps
           JOIN employees e ON e.id = ps.employee_id AND e.department_id = ?
           JOIN projects p ON p.id = ps.project_id AND p.is_draft = 0`
        )
        .bind(deptId)
        .first<{ total_mm: number; total_labor_cost: number; staffed_count: number }>();

      // 부서 관련 프로젝트 (project_departments 기준)
      const projResult = await c.env.DB
        .prepare(
          `SELECT
             COUNT(DISTINCT p.id) AS project_count,
             COALESCE(SUM(p.contract_amount), 0) AS total_contract
           FROM projects p
           JOIN project_departments pd ON pd.project_id = p.id AND pd.department_id = ?
           WHERE p.is_draft = 0`
        )
        .bind(deptId)
        .first<{ project_count: number; total_contract: number }>();

      // 부서 프로젝트 매출/이익
      const revResult = await c.env.DB
        .prepare(
          `SELECT
             COALESCE(SUM(s.revenue), 0) AS revenue,
             COALESCE(SUM(s.operating_profit), 0) AS profit
           FROM settlements s
           JOIN project_departments pd ON pd.project_id = s.project_id AND pd.department_id = ?
           WHERE s.period LIKE ?`
        )
        .bind(deptId, periodLike)
        .first<{ revenue: number; profit: number }>();

      const headcount = headcountResult?.cnt ?? 0;
      const totalMM = staffResult?.total_mm ?? 0;
      const totalLaborCost = staffResult?.total_labor_cost ?? 0;
      const staffedCount = staffResult?.staffed_count ?? 0;
      const revenue = revResult?.revenue ?? 0;
      const profit = revResult?.profit ?? 0;

      // 부서 실제 원가율 = 총 인건비 / 매출
      const costRate = revenue > 0
        ? Math.round((totalLaborCost / revenue) * 100 * 10) / 10
        : 0;

      // 부서 영업이익률
      const profitRate = revenue > 0
        ? Math.round((profit / revenue) * 100 * 10) / 10
        : 0;

      // 부서 인원 가동률 = 실제 투입 인원 / 전체 인원
      const deptUtilization = headcount > 0
        ? Math.round((staffedCount / headcount) * 100 * 10) / 10
        : 0;

      // 1인당 매출
      const revenuePerHead = headcount > 0
        ? Math.round(revenue / headcount)
        : 0;

      deptPerformance.push({
        department_id: deptId,
        department_name: deptName,
        headcount,
        staffed_count: staffedCount,
        utilization_rate: deptUtilization,
        project_count: projResult?.project_count ?? 0,
        total_contract: projResult?.total_contract ?? 0,
        total_mm: Math.round(totalMM * 100) / 100,
        total_labor_cost: totalLaborCost,
        revenue,
        operating_profit: profit,
        cost_rate: costRate,
        profit_rate: profitRate,
        revenue_per_head: revenuePerHead,
      });
    }

    return c.json({
      year,
      pm: pmPerformance,
      sales: salesPerformance,
      staff: staffPerformance,
      department: deptPerformance,
    });
  } catch (err) {
    console.error('GET /dashboard/performance error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * GET /api/dashboard/performance/staffing
 * 부서별 전체 인원 투입 현황 (잉여 인력 포함)
 * Query: year, department_id (optional)
 */
route.get('/performance/staffing', async (c) => {
  try {
    const currentYear = new Date().getFullYear();
    const year = parseInt(c.req.query('year') || String(currentYear), 10);
    const departmentId = c.req.query('department_id') || null;

    // 1. 부서 목록
    const { results: allDepts } = await c.env.DB
      .prepare('SELECT id, name FROM departments ORDER BY id')
      .all();

    // 2. 전체 활성 직원 (부서 필터 적용 가능)
    let empSql = `
      SELECT e.id, e.name, e.department_id, d.name AS department_name,
             e.position, e.employment_status
      FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.is_active = 1`;
    const empParams: any[] = [];

    if (departmentId) {
      empSql += ' AND e.department_id = ?';
      empParams.push(departmentId);
    }
    empSql += ' ORDER BY d.name, e.position DESC, e.name';

    const { results: employees } = await c.env.DB
      .prepare(empSql)
      .bind(...empParams)
      .all();

    // 3. 투입 현황: 직원별 투입된 프로젝트 상세
    let staffSql = `
      SELECT ps.employee_id, ps.man_month, ps.monthly_rate, ps.total_cost,
             p.id AS project_id, p.name AS project_name, p.type AS project_type,
             p.status AS project_status, p.start_date, p.end_date
      FROM project_staffing ps
      JOIN projects p ON p.id = ps.project_id AND p.is_draft = 0`;
    const staffParams: any[] = [];

    if (departmentId) {
      staffSql += ' AND ps.employee_id IN (SELECT id FROM employees WHERE department_id = ? AND is_active = 1)';
      staffParams.push(departmentId);
    }
    staffSql += ' ORDER BY p.name';

    const { results: staffingRows } = await c.env.DB
      .prepare(staffSql)
      .bind(...staffParams)
      .all();

    // 4. 직원별 투입 프로젝트 맵 구축
    const staffMap = new Map<string, {
      projects: any[];
      total_mm: number;
      total_cost: number;
      active_project_count: number;
    }>();

    for (const row of staffingRows) {
      const r = row as any;
      if (!staffMap.has(r.employee_id)) {
        staffMap.set(r.employee_id, {
          projects: [],
          total_mm: 0,
          total_cost: 0,
          active_project_count: 0,
        });
      }
      const entry = staffMap.get(r.employee_id)!;
      entry.projects.push({
        project_id: r.project_id,
        project_name: r.project_name,
        project_type: r.project_type,
        project_status: r.project_status,
        man_month: r.man_month,
        monthly_rate: r.monthly_rate,
        total_cost: r.total_cost,
        start_date: r.start_date,
        end_date: r.end_date,
      });
      entry.total_mm += r.man_month || 0;
      entry.total_cost += r.total_cost || 0;
      if (r.project_status === 'active') {
        entry.active_project_count += 1;
      }
    }

    // 5. 결과 조합: 전체 직원 + 투입 상태
    const annualMM = 12;
    const members = employees.map((emp: any) => {
      const staffing = staffMap.get(emp.id);
      const totalMM = staffing?.total_mm ?? 0;
      const utilization = annualMM > 0
        ? Math.round((totalMM / annualMM) * 100 * 10) / 10
        : 0;

      // 상태 판단: idle(미투입), partial(부분투입), full(완전투입), over(초과투입)
      let status: 'idle' | 'partial' | 'full' | 'over' = 'idle';
      if (totalMM > annualMM) status = 'over';
      else if (totalMM >= annualMM * 0.8) status = 'full';
      else if (totalMM > 0) status = 'partial';

      return {
        id: emp.id,
        name: emp.name,
        department_id: emp.department_id,
        department_name: emp.department_name,
        position: emp.position,
        employment_status: emp.employment_status,
        status,
        project_count: staffing?.projects.length ?? 0,
        active_project_count: staffing?.active_project_count ?? 0,
        total_mm: Math.round(totalMM * 100) / 100,
        total_cost: staffing?.total_cost ?? 0,
        utilization_rate: Math.min(utilization, 150),
        projects: staffing?.projects ?? [],
      };
    });

    // 6. 부서별 요약 통계
    const deptSummary = allDepts
      .filter((d: any) => !departmentId || d.id === departmentId)
      .map((d: any) => {
        const deptMembers = members.filter((m: any) => m.department_id === d.id);
        const idle = deptMembers.filter((m: any) => m.status === 'idle');
        const partial = deptMembers.filter((m: any) => m.status === 'partial');
        const full = deptMembers.filter((m: any) => m.status === 'full' || m.status === 'over');

        return {
          department_id: d.id,
          department_name: d.name,
          total: deptMembers.length,
          idle_count: idle.length,
          partial_count: partial.length,
          full_count: full.length,
        };
      });

    return c.json({
      year,
      departments: allDepts,
      dept_summary: deptSummary,
      members,
    });
  } catch (err) {
    console.error('GET /dashboard/performance/staffing error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
