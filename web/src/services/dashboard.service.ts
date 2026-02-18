import { apiClient } from '@/lib/api-client';
import type { DashboardSummary, PerformanceData, StaffingData } from '@/types/api.types';

export const dashboardService = {
  async getSummary(year?: number, month?: number): Promise<DashboardSummary> {
    return apiClient.get<DashboardSummary>('/api/dashboard/summary', {
      year: year,
      month: month,
    });
  },

  async getPerformance(year?: number): Promise<PerformanceData> {
    return apiClient.get<PerformanceData>('/api/dashboard/performance', {
      year: year,
    });
  },

  async getStaffing(year?: number, departmentId?: string): Promise<StaffingData> {
    return apiClient.get<StaffingData>('/api/dashboard/performance/staffing', {
      year: year,
      department_id: departmentId,
    });
  },
};
