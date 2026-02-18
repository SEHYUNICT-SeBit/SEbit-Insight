'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { masterService } from '@/services/master.service';
import type { EmployeeUpdateRequest } from '@/types/master.types';
import { toast } from 'sonner';

export function useHREmployees(
  departmentId?: string,
  employmentStatus?: string,
  search?: string,
) {
  return useQuery({
    queryKey: queryKeys.hr.employees(departmentId, employmentStatus, search),
    queryFn: () =>
      masterService.getEmployees({
        department_id: departmentId,
        employment_status: employmentStatus,
        search,
        include_all: employmentStatus ? undefined : '1',
      }),
    staleTime: 1000 * 60 * 5,
  });
}

export function useEmployeeProjects(employeeId: string | null) {
  return useQuery({
    queryKey: queryKeys.hr.employeeProjects(employeeId || ''),
    queryFn: () => masterService.getEmployeeProjects(employeeId!),
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeUpdateRequest }) =>
      masterService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.master.employees });
      toast.success('직원 정보가 수정되었습니다.');
    },
    onError: () => {
      toast.error('직원 정보 수정에 실패했습니다.');
    },
  });
}

export function useSyncEmployees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => masterService.syncEmployees(),
    onSuccess: (res: any) => {
      const r = res.data;
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.master.employees });
      queryClient.invalidateQueries({ queryKey: queryKeys.hr.syncStatus });
      toast.success(
        `동기화 완료: 추가 ${r.added}명, 갱신 ${r.updated}명, 비활성 ${r.deactivated}명` +
          (r.is_dev_mode ? ' (개발 모드)' : '')
      );
    },
    onError: () => {
      toast.error('동기화에 실패했습니다.');
    },
  });
}

export function useSyncStatus() {
  return useQuery({
    queryKey: queryKeys.hr.syncStatus,
    queryFn: () => masterService.getSyncStatus(),
    staleTime: 1000 * 60 * 5,
  });
}
