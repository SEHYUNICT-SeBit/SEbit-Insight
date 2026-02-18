'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { settlementService } from '@/services/settlement.service';
import type { SettlementFilter, SettlementCreateRequest, SettlementUpdateRequest } from '@/types/settlement.types';
import { toast } from 'sonner';

export function useSettlements(filter?: SettlementFilter) {
  return useQuery({
    queryKey: queryKeys.settlements.list(filter),
    queryFn: () => settlementService.getList(filter),
    staleTime: 1000 * 60,
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SettlementCreateRequest) => settlementService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      toast.success('정산이 등록되었습니다.');
    },
    onError: () => {
      toast.error('정산 등록에 실패했습니다.');
    },
  });
}

export function useUpdateSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SettlementUpdateRequest }) =>
      settlementService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      toast.success('정산이 수정되었습니다.');
    },
    onError: () => {
      toast.error('정산 수정에 실패했습니다.');
    },
  });
}
