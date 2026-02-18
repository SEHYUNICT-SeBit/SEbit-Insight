'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DepartmentSettings } from '@/components/settings/DepartmentSettings';
import { RateCardSettings } from '@/components/settings/RateCardSettings';
import { ClientSettings } from '@/components/settings/ClientSettings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { useUser } from '@/contexts/UserContext';
import {
  useMyPermissionRequests,
  useCreatePermissionRequest,
} from '@/hooks/usePermissionRequests';
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

const statusBadgeColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

function MyPermissionsTab() {
  const { user, isMaster } = useUser();
  const { data, isLoading } = useMyPermissionRequests();
  const createMutation = useCreatePermissionRequest();

  const [requestedRole, setRequestedRole] = useState('');
  const [reason, setReason] = useState('');

  const myRequests = data?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedRole || !reason.trim()) return;

    createMutation.mutate(
      { requested_role: requestedRole, reason: reason.trim() },
      {
        onSuccess: () => {
          setRequestedRole('');
          setReason('');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Role Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">현재 역할</CardTitle>
          <CardDescription>나의 현재 시스템 권한입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{user?.name}</span>
            <Badge
              variant="outline"
              className={cn('text-sm', roleBadgeColors[user?.role || 'user'])}
            >
              {roleLabels[user?.role || 'user'] || '사용자'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Permission Request Form - only if not master */}
      {!isMaster && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">권한 변경 요청</CardTitle>
            <CardDescription>더 높은 권한이 필요한 경우 변경을 요청할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">요청 권한</label>
                <Select
                  value={requestedRole}
                  onValueChange={setRequestedRole}
                >
                  <option value="" disabled>권한을 선택하세요</option>
                  <option value="admin">어드민</option>
                  <option value="manager">매니저</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">요청 사유</label>
                <Textarea
                  placeholder="권한 변경이 필요한 사유를 입력하세요..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                disabled={!requestedRole || !reason.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? '요청 중...' : '권한 변경 요청'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* My Request History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">내 요청 이력</CardTitle>
          <CardDescription>내가 요청한 권한 변경 이력입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : myRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              권한 변경 요청 이력이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>요청 권한</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>요청일</TableHead>
                  <TableHead>처리일</TableHead>
                  <TableHead>코멘트</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <Badge variant="outline" className={cn(roleBadgeColors[req.requested_role])}>
                        {roleLabels[req.requested_role] || req.requested_role}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{req.reason}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(statusBadgeColors[req.status])}>
                        {statusLabels[req.status] || req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.updated_at && req.status !== 'pending'
                        ? new Date(req.updated_at).toLocaleDateString('ko-KR')
                        : '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {req.reviewer_comment || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { isAdmin } = useUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="마스터 데이터"
        description="부서, 직급별 단가, 계약처 등 기준 데이터를 관리합니다."
      />

      <Tabs defaultValue={isAdmin ? 'departments' : 'permissions'}>
        <TabsList>
          {isAdmin && (
            <>
              <TabsTrigger value="departments">부서</TabsTrigger>
              <TabsTrigger value="ratecards">단가 기준표</TabsTrigger>
              <TabsTrigger value="clients">계약처</TabsTrigger>
            </>
          )}
          <TabsTrigger value="permissions">내 권한</TabsTrigger>
        </TabsList>

        {isAdmin && (
          <>
            <TabsContent value="departments">
              <DepartmentSettings />
            </TabsContent>

            <TabsContent value="ratecards">
              <RateCardSettings />
            </TabsContent>

            <TabsContent value="clients">
              <ClientSettings />
            </TabsContent>
          </>
        )}

        <TabsContent value="permissions">
          <MyPermissionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
