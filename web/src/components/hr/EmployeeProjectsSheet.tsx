'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useEmployeeProjects, useHREmployees } from '@/hooks/useHR';

const statusLabels: Record<string, { label: string; className: string }> = {
  draft: { label: '초안', className: 'bg-gray-100 text-gray-700' },
  active: { label: '진행중', className: 'bg-blue-100 text-blue-700' },
  settlement_pending: { label: '정산대기', className: 'bg-yellow-100 text-yellow-700' },
  settled: { label: '정산완료', className: 'bg-green-100 text-green-700' },
  on_hold: { label: '보류', className: 'bg-orange-100 text-orange-700' },
  cancelled: { label: '취소', className: 'bg-red-100 text-red-700' },
};

interface EmployeeProjectsSheetProps {
  employeeId: string | null;
  employeeName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeProjectsSheet({ employeeId, employeeName, open, onOpenChange }: EmployeeProjectsSheetProps) {
  const { data, isLoading } = useEmployeeProjects(employeeId);
  const projects = data?.data || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{employeeName || '직원'} - 투입 과제</SheetTitle>
          <SheetDescription>해당 직원이 투입된 프로젝트 목록입니다.</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">투입된 과제가 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => {
              const status = statusLabels[p.project_status] || { label: p.project_status, className: '' };
              return (
                <div key={p.staffing_id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/projects/${p.project_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {p.project_name}
                    </Link>
                    <Badge className={`text-xs ${status.className}`}>{status.label}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>코드: {p.project_code}</span>
                      <span>유형: {p.project_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>기간: {p.start_date} ~ {p.end_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>등급: {p.staffing_position}</span>
                      <span>M/M: {p.man_month}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>단가: {p.monthly_rate?.toLocaleString()}만원</span>
                      <span className="font-medium">소계: {p.total_cost?.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
