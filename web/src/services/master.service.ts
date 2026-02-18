import { apiClient } from '@/lib/api-client';
import type {
  Department,
  Employee,
  Client,
  RateCard,
  DepartmentCreateRequest,
  EmployeeCreateRequest,
  ClientCreateRequest,
  EmployeeUpdateRequest,
  EmployeeProject,
} from '@/types/master.types';
import type { ApiResponse } from '@/types/api.types';

export const masterService = {
  // Departments
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    return apiClient.get<ApiResponse<Department[]>>('/api/departments');
  },

  async createDepartment(data: DepartmentCreateRequest): Promise<Department> {
    return apiClient.post<Department>('/api/departments', data);
  },

  // Employees
  async getEmployees(params?: {
    department_id?: string;
    is_active?: number;
    employment_status?: string;
    include_all?: string;
    search?: string;
  }): Promise<ApiResponse<Employee[]>> {
    return apiClient.get<ApiResponse<Employee[]>>(
      '/api/employees',
      params as Record<string, string | number | undefined>
    );
  },

  async createEmployee(data: EmployeeCreateRequest): Promise<Employee> {
    return apiClient.post<Employee>('/api/employees', data);
  },

  async updateEmployee(id: string, data: EmployeeUpdateRequest): Promise<ApiResponse<Employee>> {
    return apiClient.put<ApiResponse<Employee>>(`/api/employees/${id}`, data);
  },

  async getEmployeeProjects(id: string): Promise<ApiResponse<EmployeeProject[]>> {
    return apiClient.get<ApiResponse<EmployeeProject[]>>(`/api/employees/${id}/projects`);
  },

  async syncEmployees(): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/api/admin/sync-employees');
  },

  async getSyncStatus(): Promise<ApiResponse<any>> {
    return apiClient.get<ApiResponse<any>>('/api/admin/sync-status');
  },

  // Clients
  async getClients(search?: string): Promise<ApiResponse<Client[]>> {
    return apiClient.get<ApiResponse<Client[]>>('/api/clients', { search });
  },

  async createClient(data: ClientCreateRequest): Promise<Client> {
    return apiClient.post<Client>('/api/clients', data);
  },

  // Rate Cards
  async getRateCards(): Promise<ApiResponse<RateCard[]>> {
    return apiClient.get<ApiResponse<RateCard[]>>('/api/rate-cards');
  },
};
