'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { dashboardService } from '@/services/dashboard.service';

export function usePerformance(year?: number) {
  return useQuery({
    queryKey: queryKeys.performance(year),
    queryFn: () => dashboardService.getPerformance(year),
    staleTime: 1000 * 60 * 5,
  });
}
