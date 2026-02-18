'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { dashboardService } from '@/services/dashboard.service';

export function useStaffingDetail(year?: number, departmentId?: string) {
  return useQuery({
    queryKey: queryKeys.staffing(year, departmentId),
    queryFn: () => dashboardService.getStaffing(year, departmentId),
    staleTime: 1000 * 60 * 5,
  });
}
