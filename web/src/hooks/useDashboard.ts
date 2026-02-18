'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { dashboardService } from '@/services/dashboard.service';

export function useDashboard(year?: number, month?: number) {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => dashboardService.getSummary(year, month),
    staleTime: 1000 * 60 * 5, // 5분
  });
}
