import { apiClient } from '@/lib/api-client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department_id: string;
  department_name: string;
  position: string;
}

export interface DevLoginResponse {
  user: AuthUser;
  session_id: string;
}

export const authService = {
  async getMe() {
    return apiClient.get<AuthUser>('/api/auth/me');
  },

  async devLogin(email: string) {
    return apiClient.post<DevLoginResponse>('/api/auth/dev-login', { email });
  },

  async logout() {
    return apiClient.post<void>('/api/auth/logout');
  },
};
