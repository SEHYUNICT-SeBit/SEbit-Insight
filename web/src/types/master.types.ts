export type EmploymentStatus = '재직' | '휴직' | '병가' | '퇴직';

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department_id: string;
  department_name: string;
  position: string;
  role: 'master' | 'admin' | 'manager' | 'user';
  is_active: number;
  employment_status: EmploymentStatus;
}

export interface Client {
  id: string;
  name: string;
  business_no?: string;
  contact?: string;
  phone?: string;
  created_at?: string;
}

export interface RateCard {
  id: string;
  position: string;
  monthly_rate: number;
  is_default: number;
}

export interface DepartmentCreateRequest {
  id: string;
  name: string;
}

export interface EmployeeCreateRequest {
  name: string;
  email: string;
  department_id: string;
  position: string;
  role: 'master' | 'admin' | 'manager' | 'user';
}

export interface ClientCreateRequest {
  name: string;
  business_no?: string;
  contact?: string;
  phone?: string;
}

export interface EmployeeUpdateRequest {
  role?: string;
  department_id?: string;
  position?: string;
  employment_status?: EmploymentStatus;
}

export interface EmployeeProject {
  staffing_id: string;
  staffing_position: string;
  man_month: number;
  monthly_rate: number;
  total_cost: number;
  note?: string;
  project_id: string;
  project_code: string;
  project_name: string;
  project_type: 'SI' | 'SM';
  project_status: string;
  start_date: string;
  end_date: string;
  department_name: string;
}

export const EMPLOYMENT_STATUS_CONFIG: Record<EmploymentStatus, { label: string; className: string }> = {
  '재직': { label: '재직', className: 'bg-green-100 text-green-800' },
  '휴직': { label: '휴직', className: 'bg-yellow-100 text-yellow-800' },
  '병가': { label: '병가', className: 'bg-orange-100 text-orange-800' },
  '퇴직': { label: '퇴직', className: 'bg-gray-100 text-gray-500' },
};
