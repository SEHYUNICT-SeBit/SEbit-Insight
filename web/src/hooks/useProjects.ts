'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { projectService } from '@/services/project.service';
import type { ProjectFilter } from '@/types/project.types';

export function useProjects(filter?: ProjectFilter) {
  return useQuery({
    queryKey: queryKeys.projects.list(filter),
    queryFn: () => projectService.getList(filter),
    staleTime: 1000 * 60, // 1분
  });
}

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => projectService.getDetail(id),
    enabled: !!id,
  });
}

export function useProjectStaffing(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.staffing(projectId),
    queryFn: () => projectService.getStaffing(projectId),
    enabled: !!projectId,
  });
}

export function useProjectExpenses(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.expenses(projectId),
    queryFn: () => projectService.getExpenses(projectId),
    enabled: !!projectId,
  });
}

export function useProjectCostAnalysis(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.cost(projectId),
    queryFn: () => projectService.getCostAnalysis(projectId),
    enabled: !!projectId,
  });
}

export function useProjectSettlements(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.settlements(projectId),
    queryFn: () => projectService.getProjectSettlements(projectId),
    enabled: !!projectId,
  });
}

export function useProjectDrafts() {
  return useQuery({
    queryKey: queryKeys.projects.drafts,
    queryFn: () => projectService.getDrafts(),
  });
}
