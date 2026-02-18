'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { permissionService } from '@/services/permission.service';
import type { PermissionRequestCreateData } from '@/services/permission.service';
import { toast } from 'sonner';

export function usePermissionRequests(status?: string) {
  return useQuery({
    queryKey: queryKeys.permissionRequests.list(status),
    queryFn: () => permissionService.getRequests(status),
    staleTime: 1000 * 60, // 1분
  });
}

export function useMyPermissionRequests() {
  return useQuery({
    queryKey: queryKeys.permissionRequests.mine,
    queryFn: () => permissionService.getMyRequests(),
    staleTime: 1000 * 60,
  });
}

export function useCreatePermissionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PermissionRequestCreateData) =>
      permissionService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissionRequests.mine });
      toast.success('권한 변경 요청이 등록되었습니다.');
    },
    onError: () => {
      toast.error('권한 변경 요청에 실패했습니다.');
    },
  });
}

export function useApprovePermissionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      permissionService.approve(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissionRequests.all });
      toast.success('권한 요청이 승인되었습니다.');
    },
    onError: () => {
      toast.error('권한 요청 승인에 실패했습니다.');
    },
  });
}

export function useRejectPermissionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      permissionService.reject(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissionRequests.all });
      toast.success('권한 요청이 반려되었습니다.');
    },
    onError: () => {
      toast.error('권한 요청 반려에 실패했습니다.');
    },
  });
}
