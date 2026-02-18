'use client';

import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProjectTableRow } from './ProjectTableRow';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Project } from '@/types/project.types';
import type { Pagination } from '@/types/api.types';

interface ProjectTableProps {
  projects: Project[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
}

export function ProjectTable({ projects, pagination, onPageChange }: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="프로젝트가 없습니다"
        description="필터 조건을 변경하거나 새 프로젝트를 등록하세요."
      />
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">프로젝트코드</TableHead>
            <TableHead>프로젝트명</TableHead>
            <TableHead className="w-[160px]">부서</TableHead>
            <TableHead className="w-[60px]">유형</TableHead>
            <TableHead className="w-[120px] text-right">계약금액</TableHead>
            <TableHead className="w-[80px]">PM</TableHead>
            <TableHead className="w-[180px]">기간</TableHead>
            <TableHead className="w-[140px]">상태</TableHead>
            <TableHead className="w-[50px]">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <ProjectTableRow key={project.id} project={project} />
          ))}
        </TableBody>
      </Table>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            총 {pagination.total}건 중 {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}건
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <span className="text-sm">
              {pagination.page} / {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
