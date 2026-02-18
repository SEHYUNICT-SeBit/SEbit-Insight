'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { projectService } from '@/services/project.service';
import type { Project, ProjectCreateRequest, StaffingCreateRequest, ExpenseCreateRequest } from '@/types/project.types';
import { toast } from 'sonner';

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectCreateRequest) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('프로젝트가 등록되었습니다.');
    },
    onError: () => {
      toast.error('프로젝트 등록에 실패했습니다.');
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectCreateRequest> }) =>
      projectService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('프로젝트가 수정되었습니다.');
    },
    onError: () => {
      toast.error('프로젝트 수정에 실패했습니다.');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('프로젝트가 삭제되었습니다.');
    },
    onError: () => {
      toast.error('프로젝트 삭제에 실패했습니다.');
    },
  });
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      projectService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.all });
      const prev = queryClient.getQueryData(queryKeys.projects.list());
      queryClient.setQueryData(queryKeys.projects.list(), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const typedOld = old as { data: Project[] };
        return {
          ...typedOld,
          data: typedOld.data.map((p: Project) =>
            p.id === id ? { ...p, status } : p
          ),
        };
      });
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.projects.list(), ctx.prev);
      }
      toast.error('상태 변경에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => projectService.saveDraft(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.drafts });
      toast.success('임시 저장되었습니다.');
    },
    onError: () => {
      toast.error('임시 저장에 실패했습니다.');
    },
  });
}

export function useAddStaffing(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffingCreateRequest) =>
      projectService.addStaffing(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.staffing(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.cost(projectId) });
      toast.success('투입 인력이 추가되었습니다.');
    },
    onError: () => {
      toast.error('투입 인력 추가에 실패했습니다.');
    },
  });
}

export function useUpdateStaffing(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffingId, data }: { staffingId: string; data: Partial<StaffingCreateRequest> }) =>
      projectService.updateStaffing(projectId, staffingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.staffing(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.cost(projectId) });
      toast.success('투입 인력이 수정되었습니다.');
    },
    onError: () => {
      toast.error('투입 인력 수정에 실패했습니다.');
    },
  });
}

export function useAddExpense(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseCreateRequest) =>
      projectService.addExpense(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.expenses(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.cost(projectId) });
      toast.success('경비가 추가되었습니다.');
    },
    onError: () => {
      toast.error('경비 추가에 실패했습니다.');
    },
  });
}

export function useUpdateExpense(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, data }: { expenseId: string; data: Partial<ExpenseCreateRequest> }) =>
      projectService.updateExpense(projectId, expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.expenses(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.cost(projectId) });
      toast.success('경비가 수정되었습니다.');
    },
    onError: () => {
      toast.error('경비 수정에 실패했습니다.');
    },
  });
}

export function useSaveCostAnalysis(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { staffing: StaffingCreateRequest[]; expenses: ExpenseCreateRequest[] }) =>
      projectService.saveCostAnalysis(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.cost(projectId) });
      toast.success('원가 분석이 저장되었습니다.');
    },
    onError: () => {
      toast.error('원가 분석 저장에 실패했습니다.');
    },
  });
}
