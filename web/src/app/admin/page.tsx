'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useUser } from '@/contexts/UserContext';
import {
  usePermissionRequests,
  useApprovePermissionRequest,
  useRejectPermissionRequest,
} from '@/hooks/usePermissionRequests';
import { useEmployees } from '@/hooks/useMasterData';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'sonner';
import { Check, X, RefreshCw } from 'lucide-react';
import type { PermissionRequest } from '@/services/permission.service';
import type { Employee } from '@/types/master.types';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  master: '마스터',
  admin: '어드민',
  manager: '매니저',
  user: '사용자',
};

const roleBadgeColors: Record<string, string> = {
  master: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  manager: 'bg-green-100 text-green-800 border-green-200',
  user: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusLabels: Record<string, string> = {
  pending: '대기중',
  approved: '승인',
  rejected: '반려',
};

const statusBadgeVariants: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

// Permission Requests Tab
function PermissionRequestsTab() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data, isLoading } = usePermissionRequests(statusFilter);
  const approveMutation = useApprovePermissionRequest();
  const rejectMutation = useRejectPermissionRequest();

  const [approveDialog, setApproveDialog] = useState<{ open: boolean; request: PermissionRequest | null }>({
    open: false,
    request: null,
  });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: PermissionRequest | null }>({
    open: false,
    request: null,
  });
  const [approveComment, setApproveComment] = useState('');
  const [rejectComment, setRejectComment] = useState('');

  const requests = data?.data || [];

  const handleApprove = () => {
    if (!approveDialog.request) return;
    approveMutation.mutate(
      { id: approveDialog.request.id, comment: approveComment || undefined },
      {
        onSuccess: () => {
          setApproveDialog({ open: false, request: null });
          setApproveComment('');
        },
      }
    );
  };

  const handleReject = () => {
    if (!rejectDialog.request) return;
    if (!rejectComment.trim()) {
      toast.error('반려 사유를 입력해주세요.');
      return;
    }
    rejectMutation.mutate(
      { id: rejectDialog.request.id, comment: rejectComment },
      {
        onSuccess: () => {
          setRejectDialog({ open: false, request: null });
          setRejectComment('');
        },
      }
    );
  };

  const filterButtons = [
    { label: '전체', value: undefined },
    { label: '대기중', value: 'pending' },
    { label: '승인', value: 'approved' },
    { label: '반려', value: 'rejected' },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Filter buttons */}
        <div className="flex gap-2 mb-4">
          {filterButtons.map((filter) => (
            <Button
              key={filter.label}
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            권한 변경 요청이 없습니다.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>요청자</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>요청 권한</TableHead>
                <TableHead>사유</TableHead>
                <TableHead>요청일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.user_name}</TableCell>
                  <TableCell>{req.department_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(roleBadgeColors[req.requested_role])}>
                      {roleLabels[req.requested_role] || req.requested_role}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{req.reason}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(statusBadgeVariants[req.status])}>
                      {statusLabels[req.status] || req.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {req.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => setApproveDialog({ open: true, request: req })}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setRejectDialog({ open: true, request: req })}
                        >
                          <X className="h-4 w-4 mr-1" />
                          반려
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Approve Dialog */}
        <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open, request: open ? approveDialog.request : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>권한 요청 승인</DialogTitle>
              <DialogDescription>
                {approveDialog.request?.user_name}님의{' '}
                {roleLabels[approveDialog.request?.requested_role || ''] || ''} 권한 요청을 승인하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium">코멘트 (선택)</label>
              <Textarea
                placeholder="승인 코멘트를 입력하세요..."
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveDialog({ open: false, request: null })}>
                취소
              </Button>
              <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? '처리중...' : '승인'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, request: open ? rejectDialog.request : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>권한 요청 반려</DialogTitle>
              <DialogDescription>
                {rejectDialog.request?.user_name}님의{' '}
                {roleLabels[rejectDialog.request?.requested_role || ''] || ''} 권한 요청을 반려하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium">반려 사유 (필수)</label>
              <Textarea
                placeholder="반려 사유를 입력하세요..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog({ open: false, request: null })}>
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectComment.trim()}
              >
                {rejectMutation.isPending ? '처리중...' : '반려'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// User Management Tab
function UserManagementTab() {
  const { data, isLoading } = useEmployees();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const employees: Employee[] = data?.data || [];

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await apiClient.post<{ data: { added: number; updated: number; deactivated: number; total: number; is_dev_mode: boolean } }>('/api/admin/sync-employees');
      const r = res.data;
      queryClient.invalidateQueries({ queryKey: queryKeys.master.employees });
      toast.success(
        `동기화 완료: 추가 ${r.added}명, 갱신 ${r.updated}명, 비활성 ${r.deactivated}명` +
        (r.is_dev_mode ? ' (개발 모드)' : '')
      );
    } catch {
      toast.error('동기화에 실패했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRoleChange = async (employeeId: string, newRole: string) => {
    setUpdatingId(employeeId);
    try {
      await apiClient.put(`/api/employees/${employeeId}`, { role: newRole });
      queryClient.invalidateQueries({ queryKey: queryKeys.master.employees });
      toast.success('역할이 변경되었습니다.');
    } catch {
      toast.error('역할 변경에 실패했습니다.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">전체 사용자 목록</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', isSyncing && 'animate-spin')} />
            {isSyncing ? '동기화 중...' : 'LINE WORKS 동기화'}
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            등록된 사용자가 없습니다.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>직급</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{emp.email}</TableCell>
                  <TableCell>{emp.department_name}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(roleBadgeColors[emp.role])}>
                      {roleLabels[emp.role] || emp.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.is_active ? 'default' : 'secondary'}>
                      {emp.is_active ? '활성' : '비활성'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={emp.role}
                      onValueChange={(value) => handleRoleChange(emp.id, value)}
                      disabled={updatingId === emp.id}
                      className="w-28 h-8 text-xs"
                    >
                      <option value="master">마스터</option>
                      <option value="admin">어드민</option>
                      <option value="manager">매니저</option>
                      <option value="user">사용자</option>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { isMaster } = useUser();

  if (!isMaster) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="권한 관리"
          description="사용자 권한 및 권한 변경 요청을 관리합니다."
        />
        <div className="text-center py-12 text-muted-foreground">
          권한이 없습니다. 마스터 권한이 필요합니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="권한 관리"
        description="사용자 권한 및 권한 변경 요청을 관리합니다."
      />

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">권한 요청</TabsTrigger>
          <TabsTrigger value="users">사용자 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <PermissionRequestsTab />
        </TabsContent>

        <TabsContent value="users">
          <UserManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
