import { apiClient } from '@/lib/api-client';
import type {
  Settlement,
  SettlementFilter,
  SettlementCreateRequest,
  SettlementUpdateRequest,
} from '@/types/settlement.types';
import type { PaginatedResponse } from '@/types/api.types';

export const settlementService = {
  async getList(filter?: SettlementFilter): Promise<PaginatedResponse<Settlement>> {
    return apiClient.get<PaginatedResponse<Settlement>>(
      '/api/settlements',
      filter as Record<string, string | number | undefined>
    );
  },

  async create(data: SettlementCreateRequest): Promise<Settlement> {
    return apiClient.post<Settlement>('/api/settlements', data);
  },

  async update(id: string, data: SettlementUpdateRequest): Promise<Settlement> {
    return apiClient.put<Settlement>(`/api/settlements/${id}`, data);
  },
};
