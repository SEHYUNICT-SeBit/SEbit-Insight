export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface MonthlySettlementProject {
  project_id: string;
  project_name: string;
  project_type: 'SI' | 'SM';
  amount: number;
}

export interface MonthlyRevenue {
  month: string;
  projects: MonthlySettlementProject[];
  total: number;
}

export interface YearlyRevenue {
  year: string;
  revenue: number;
  operating_profit: number;
  contract_amount: number;
}

export interface DashboardSummary {
  total_contract_amount: number;
  total_revenue_ytd: number;
  total_operating_profit_ytd: number;
  avg_profit_rate: number;
  project_counts: {
    total: number;
    active: number;
    settlement_pending: number;
    settled: number;
    on_hold: number;
    cancelled: number;
  };
  by_department: DepartmentSummary[];
  by_type: {
    SI: { count: number; contract_amount: number };
    SM: { count: number; contract_amount: number };
  };
  recent_projects: RecentProject[];
  monthly_revenue: MonthlyRevenue[];
  yearly_revenue: YearlyRevenue[];
}

export interface DepartmentSummary {
  department_id: string;
  department_name: string;
  project_count: number;
  contract_amount: number;
  revenue_ytd: number;
  operating_profit_ytd: number;
  profit_rate: number;
}

export interface RecentProject {
  id: string;
  name: string;
  project_code?: string;
  department_name?: string;
  status: string;
  contract_amount?: number;
  updated_at: string;
}

// ---------- Performance Dashboard ----------

export interface PmPerformance {
  id: string;
  name: string;
  department_id: string;
  department_name: string;
  position: string;
  project_count: number;
  active_count: number;
  settled_count: number;
  total_contract: number;
  revenue: number;
  operating_profit: number;
  profit_rate: number;
  completion_rate: number;
}

export interface SalesPerformance {
  id: string;
  name: string;
  department_id: string;
  department_name: string;
  position: string;
  project_count: number;
  total_contract: number;
  si_count: number;
  sm_count: number;
  si_amount: number;
  sm_amount: number;
  revenue_contribution: number;
  conversion_rate: number;
}

export interface StaffPerformance {
  id: string;
  name: string;
  department_id: string;
  department_name: string;
  position: string;
  project_count: number;
  total_mm: number;
  total_cost: number;
  utilization_rate: number;
}

export interface DeptPerformance {
  department_id: string;
  department_name: string;
  headcount: number;
  staffed_count: number;
  utilization_rate: number;
  project_count: number;
  total_contract: number;
  total_mm: number;
  total_labor_cost: number;
  revenue: number;
  operating_profit: number;
  cost_rate: number;
  profit_rate: number;
  revenue_per_head: number;
}

export interface PerformanceData {
  year: number;
  pm: PmPerformance[];
  sales: SalesPerformance[];
  staff: StaffPerformance[];
  department: DeptPerformance[];
}

// ---------- Staffing Detail (투입 현황 상세) ----------

export interface StaffingProject {
  project_id: string;
  project_name: string;
  project_type: 'SI' | 'SM';
  project_status: string;
  man_month: number;
  monthly_rate: number;
  total_cost: number;
  start_date: string;
  end_date: string;
}

export interface StaffingMember {
  id: string;
  name: string;
  department_id: string;
  department_name: string;
  position: string;
  employment_status: string;
  status: 'idle' | 'partial' | 'full' | 'over';
  project_count: number;
  active_project_count: number;
  total_mm: number;
  total_cost: number;
  utilization_rate: number;
  projects: StaffingProject[];
}

export interface StaffingDeptSummary {
  department_id: string;
  department_name: string;
  total: number;
  idle_count: number;
  partial_count: number;
  full_count: number;
}

export interface StaffingData {
  year: number;
  departments: { id: string; name: string }[];
  dept_summary: StaffingDeptSummary[];
  members: StaffingMember[];
}
