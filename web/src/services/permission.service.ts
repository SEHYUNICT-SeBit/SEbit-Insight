import { apiClient } from '@/lib/api-client';

export interface PermissionRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  department_name: string;
  current_role: string;
  requested_role: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionRequestCreateData {
  requested_role: string;
  reason: string;
}

export const permissionService = {
  async getRequests(status?: string) {
    return apiClient.get<{ data: PermissionRequest[] }>('/api/permission-requests', status ? { status } : undefined);
  },

  async getMyRequests() {
    return apiClient.get<{ data: PermissionRequest[] }>('/api/permission-requests/mine');
  },

  async createRequest(data: PermissionRequestCreateData) {
    return apiClient.post<PermissionRequest>('/api/permission-requests', data);
  },

  async approve(id: string, comment?: string) {
    return apiClient.put<PermissionRequest>(`/api/permission-requests/${id}/approve`, { comment });
  },

  async reject(id: string, comment?: string) {
    return apiClient.put<PermissionRequest>(`/api/permission-requests/${id}/reject`, { comment });
  },
};
