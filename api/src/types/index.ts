// ============================================================
// SEbit Insight v1.0 - Shared TypeScript Type Definitions
// ============================================================

// ---------- Cloudflare Bindings ----------
export type Env = {
  DB: D1Database;
  ENVIRONMENT: string;
  ACCESS_TEAM_DOMAIN: string;
  NW_CLIENT_ID?: string;
  NW_CLIENT_SECRET?: string;
  NW_REDIRECT_URI?: string;
  JWT_SECRET?: string;
  FRONTEND_URL?: string;
  NW_SERVICE_ACCOUNT_ID?: string;
  NW_PRIVATE_KEY?: string;
};

// ---------- Role Type ----------
export type Role = 'master' | 'admin' | 'manager' | 'user';

// ---------- Employment Status ----------
export type EmploymentStatus = '재직' | '휴직' | '병가' | '퇴직';

// ---------- Auth User (set by authMiddleware) ----------
export interface AuthUser {
  id: string;
  name: string;
  role: Role;
}

// ---------- Hono Variables ----------
export type Variables = {
  user: AuthUser;
};

// ---------- App Bindings ----------
export type AppBindings = {
  Bindings: Env;
  Variables: Variables;
};

// ---------- Department ----------
export interface Department {
  id: string;
  name: string;
  created_at: string;
}

// ---------- Employee ----------
export interface Employee {
  id: string;
  name: string;
  email: string;
  department_id: string;
  department_name?: string;
  position: string;
  role: Role;
  nw_user_id?: string;
  is_active: number;
  employment_status: EmploymentStatus;
  created_at: string;
}

// ---------- Client ----------
export interface Client {
  id: string;
  name: string;
  business_no: string;
  contact: string;
  phone: string;
  created_at: string;
}

// ---------- Rate Card ----------
export interface RateCard {
  id: string;
  position: string;
  monthly_rate: number;
  is_default: number;
  created_at: string;
}

// ---------- Project ----------
export interface Project {
  id: string;
  project_code: string;
  name: string;
  type: 'SI' | 'SM';
  status: 'draft' | 'active' | 'settlement_pending' | 'settled' | 'on_hold' | 'cancelled';
  department_id: string;
  department_name?: string;
  client_id: string;
  client_name?: string;
  sales_rep_id: string;
  sales_rep_name?: string;
  pm_id: string;
  pm_type: 'employee' | 'freelancer';
  pm_name?: string;
  contract_amount: number;
  start_date: string;
  end_date: string;
  description?: string;
  is_draft: number;
  draft_step: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  departments?: { department_id: string; department_name: string; is_primary: number }[];
}

// ---------- Project Staffing ----------
export interface ProjectStaffing {
  id: string;
  project_id: string;
  employee_id: string;
  employee_name?: string;
  position: string;
  man_month: number;
  monthly_rate: number;
  total_cost: number; // GENERATED column
  note?: string;
  created_at: string;
}

// ---------- Project Expense ----------
export interface ProjectExpense {
  id: string;
  project_id: string;
  category: '출장비' | '장비' | '외주' | '기타';
  expense_type: 'freelancer' | 'subcontract' | 'other';
  amount: number;
  description?: string;
  expense_date?: string;
  freelancer_level?: string;
  monthly_rate?: number;
  man_month?: number;
  company_name?: string;
  subcategory?: string;
  note?: string;
  created_at: string;
}

// ---------- Settlement ----------
export interface Settlement {
  id: string;
  project_id: string;
  project_name?: string;
  period: string;
  revenue: number;
  total_labor: number;
  total_expense: number;
  operating_profit: number; // GENERATED column
  profit_rate: number | null;
  status: 'pending' | 'completed' | 'on_hold';
  note?: string;
  created_at: string;
  updated_at: string;
}

// ---------- Cost Analysis Result ----------
export interface CostAnalysisResult {
  project_id: string;
  project_name: string;
  type: 'SI' | 'SM';
  contract_amount: number;
  total_labor_cost: number;
  total_expense: number;
  total_cost: number;
  operating_profit: number;
  profit_rate: number;
  staffing: ProjectStaffing[];
  expenses: ProjectExpense[];
}

// ---------- Pagination ----------
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ---------- Dashboard ----------
export interface MonthlySettlementProject {
  project_id: string;
  project_name: string;
  project_type: 'SI' | 'SM';
  amount: number;
}

export interface MonthlyRevenue {
  month: string; // 'YYYY-MM'
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
  status: string;
  updated_at: string;
}

// ---------- Session ----------
export interface Session {
  id: string;
  employee_id: string;
  expires_at: string;
  created_at: string;
}

// ---------- Permission Request ----------
export interface PermissionRequest {
  id: string;
  requester_id: string;
  requester_name?: string;
  requester_email?: string;
  requester_department?: string;
  requested_role: 'admin' | 'manager';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id?: string;
  reviewer_name?: string;
  review_comment?: string;
  reviewed_at?: string;
  created_at: string;
}

// ---------- API Error Response ----------
export interface ErrorResponse {
  error: string;
  message: string;
}

// ---------- Sync Result ----------
export interface SyncResult {
  added: number;
  updated: number;
  deactivated: number;
  total: number;
  synced_at: string;
  is_dev_mode: boolean;
}
