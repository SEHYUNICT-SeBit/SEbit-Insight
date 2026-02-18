'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { masterService } from '@/services/master.service';
import type { DepartmentCreateRequest, EmployeeCreateRequest, ClientCreateRequest } from '@/types/master.types';
import { toast } from 'sonner';

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.master.departments,
    queryFn: () => masterService.getDepartments(),
    staleTime: 1000 * 60 * 10, // 10분
  });
}

export function useEmployees(departmentId?: string, search?: string) {
  return useQuery({
    queryKey: [...queryKeys.master.employees, departmentId, search],
    queryFn: () => masterService.getEmployees({ department_id: departmentId, search }),
    staleTime: 1000 * 60 * 5,
  });
}

export function useClients(search?: string) {
  return useQuery({
    queryKey: [...queryKeys.master.clients, search],
    queryFn: () => masterService.getClients(search),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRateCards() {
  return useQuery({
    queryKey: queryKeys.master.rateCards,
    queryFn: () => masterService.getRateCards(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DepartmentCreateRequest) => masterService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.master.departments });
      toast.success('부서가 등록되었습니다.');
    },
    onError: () => {
      toast.error('부서 등록에 실패했습니다.');
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeeCreateRequest) => masterService.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.master.employees });
      toast.success('직원이 등록되었습니다.');
    },
    onError: () => {
      toast.error('직원 등록에 실패했습니다.');
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClientCreateRequest) => masterService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.master.clients });
      toast.success('계약처가 등록되었습니다.');
    },
    onError: () => {
      toast.error('계약처 등록에 실패했습니다.');
    },
  });
}
