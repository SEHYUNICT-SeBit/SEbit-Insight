export type ProjectType = 'SI' | 'SM';

export type ProjectStatus =
  | 'draft'
  | 'active'
  | 'settlement_pending'
  | 'settled'
  | 'on_hold'
  | 'cancelled';

export interface ProjectDepartment {
  department_id: string;
  department_name: string;
  is_primary: number;
}

export interface Project {
  id: string;
  project_code: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  department_id: string;
  department_name: string;
  departments?: ProjectDepartment[];
  client_id: string;
  client_name: string;
  sales_rep_id: string;
  sales_rep_name: string;
  pm_id: string;
  pm_type: 'employee' | 'freelancer';
  pm_name: string;
  contract_amount: number;
  start_date: string;
  end_date: string;
  description?: string;
  is_draft: number;
  draft_step?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectFilter {
  department_id?: string;
  status?: ProjectStatus;
  type?: ProjectType;
  start_from?: string;
  start_to?: string;
  search?: string;
  page?: number;
  limit?: number;
  is_draft?: number;
}

export interface PaymentScheduleItem {
  label: string;
  period: string;
  amount: number;
}

export interface ProjectCreateRequest {
  name: string;
  type: ProjectType;
  department_id: string;
  department_ids?: string[];
  client_id: string;
  sales_rep_id: string;
  pm_id?: string;
  pm_type?: 'employee' | 'freelancer';
  pm_name?: string;
  contract_amount: number;
  start_date: string;
  end_date: string;
  description?: string;
  is_draft: number;
  payment_schedule?: PaymentScheduleItem[];
}

export interface ProjectDraft {
  id: string;
  name: string;
  draft_step: number;
  updated_at: string;
}

export interface Staffing {
  id: string;
  project_id: string;
  employee_id?: string;
  employee_name?: string;
  position: string;
  man_month: number;
  monthly_rate: number;
  total_cost: number;
  note?: string;
  created_at?: string;
}

export interface StaffingCreateRequest {
  employee_id?: string;
  position: string;
  man_month: number;
  monthly_rate: number;
  note?: string;
}

export interface StaffingSummary {
  total_man_month: number;
  total_labor_cost: number;
}

export type ExpenseType = 'freelancer' | 'subcontract' | 'other';

export interface Expense {
  id: string;
  project_id: string;
  category: '출장비' | '장비' | '외주' | '기타';
  expense_type: ExpenseType;
  amount: number;
  description?: string;
  expense_date?: string;
  freelancer_level?: string;
  monthly_rate?: number;
  man_month?: number;
  company_name?: string;
  subcategory?: string;
  note?: string;
  created_at?: string;
}

export interface ExpenseCreateRequest {
  category: string;
  expense_type: ExpenseType;
  amount: number;
  description?: string;
  expense_date?: string;
  freelancer_level?: string;
  monthly_rate?: number;
  man_month?: number;
  company_name?: string;
  subcategory?: string;
  note?: string;
}

export interface ExpenseSummary {
  total_expense: number;
  by_category: Record<string, number>;
}

export interface CostAnalysis {
  project_id: string;
  project_name: string;
  type: ProjectType;
  contract_amount: number;
  total_labor_cost: number;
  total_expense: number;
  total_cost: number;
  operating_profit: number;
  profit_rate: number;
  staffing: Staffing[];
  expenses: Expense[];
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: '임시저장',
  active: '진행중',
  settlement_pending: '정산대기',
  settled: '정산완료',
  on_hold: '보류',
  cancelled: '취소',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
  settlement_pending: 'bg-yellow-100 text-yellow-700',
  settled: 'bg-green-100 text-green-700',
  on_hold: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
};
