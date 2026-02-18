import { apiClient } from '@/lib/api-client';
import type {
  Project,
  ProjectFilter,
  ProjectCreateRequest,
  ProjectDraft,
  Staffing,
  StaffingCreateRequest,
  StaffingSummary,
  Expense,
  ExpenseCreateRequest,
  ExpenseSummary,
  CostAnalysis,
} from '@/types/project.types';
import type { PaginatedResponse, ApiResponse } from '@/types/api.types';

export const projectService = {
  async getList(filter?: ProjectFilter): Promise<PaginatedResponse<Project>> {
    return apiClient.get<PaginatedResponse<Project>>('/api/projects', filter as Record<string, string | number | undefined>);
  },

  async getDetail(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/api/projects/${id}`);
    return response;
  },

  async create(data: ProjectCreateRequest): Promise<Project> {
    return apiClient.post<Project>('/api/projects', data);
  },

  async update(id: string, data: Partial<ProjectCreateRequest>): Promise<Project> {
    return apiClient.put<Project>(`/api/projects/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/projects/${id}`);
  },

  async updateStatus(id: string, status: string): Promise<{ id: string; status: string; updated_at: string }> {
    return apiClient.put(`/api/projects/${id}/status`, { status });
  },

  // Drafts
  async getDrafts(): Promise<ApiResponse<ProjectDraft[]>> {
    return apiClient.get<ApiResponse<ProjectDraft[]>>('/api/projects/drafts');
  },

  async saveDraft(data: Record<string, unknown>): Promise<ProjectDraft> {
    return apiClient.post<ProjectDraft>('/api/projects/drafts', data);
  },

  // Staffing
  async getStaffing(projectId: string): Promise<{ data: Staffing[]; summary: StaffingSummary }> {
    return apiClient.get(`/api/projects/${projectId}/staffing`);
  },

  async addStaffing(projectId: string, data: StaffingCreateRequest): Promise<Staffing> {
    return apiClient.post(`/api/projects/${projectId}/staffing`, data);
  },

  async updateStaffing(projectId: string, staffingId: string, data: Partial<StaffingCreateRequest>): Promise<Staffing> {
    return apiClient.put(`/api/projects/${projectId}/staffing/${staffingId}`, data);
  },

  // Expenses
  async getExpenses(projectId: string): Promise<{ data: Expense[]; summary: ExpenseSummary }> {
    return apiClient.get(`/api/projects/${projectId}/expenses`);
  },

  async addExpense(projectId: string, data: ExpenseCreateRequest): Promise<Expense> {
    return apiClient.post(`/api/projects/${projectId}/expenses`, data);
  },

  async updateExpense(projectId: string, expenseId: string, data: Partial<ExpenseCreateRequest>): Promise<Expense> {
    return apiClient.put(`/api/projects/${projectId}/expenses/${expenseId}`, data);
  },

  // Settlements for a project (for edit page payment schedule)
  async getProjectSettlements(projectId: string): Promise<{ data: Array<{ id: string; period: string; revenue: number; status: string; note?: string }> }> {
    return apiClient.get(`/api/projects/${projectId}/settlements`);
  },

  // Cost Analysis
  async getCostAnalysis(projectId: string): Promise<CostAnalysis> {
    return apiClient.get(`/api/projects/${projectId}/cost-analysis`);
  },

  async saveCostAnalysis(
    projectId: string,
    data: { staffing: StaffingCreateRequest[]; expenses: ExpenseCreateRequest[] }
  ): Promise<CostAnalysis> {
    return apiClient.post(`/api/projects/${projectId}/cost-analysis`, data);
  },

  async updateCostAnalysis(
    projectId: string,
    data: { staffing: StaffingCreateRequest[]; expenses: ExpenseCreateRequest[] }
  ): Promise<CostAnalysis> {
    return apiClient.put(`/api/projects/${projectId}/cost-analysis`, data);
  },
};
