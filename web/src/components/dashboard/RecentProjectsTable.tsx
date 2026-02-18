'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types/project.types';
import type { RecentProject } from '@/types/api.types';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '@/lib/utils';

interface RecentProjectsTableProps {
  projects: RecentProject[];
}

export function RecentProjectsTable({ projects }: RecentProjectsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">최근 프로젝트</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>프로젝트명</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>최근 수정일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  최근 프로젝트가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {project.name}
                    </Link>
                    {project.project_code && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {project.project_code}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{project.department_name || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-0',
                        PROJECT_STATUS_COLORS[project.status as keyof typeof PROJECT_STATUS_COLORS] || ''
                      )}
                    >
                      {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] || project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(project.updated_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
