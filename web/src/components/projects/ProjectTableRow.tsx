'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DepartmentBadge } from '@/components/common/DepartmentBadge';
import { ProjectTypeBadge } from '@/components/common/ProjectTypeBadge';
import { ProjectStatusSelect } from './ProjectStatusSelect';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDeleteProject } from '@/hooks/useProjectMutations';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatPeriod } from '@/lib/utils';
import { MoreHorizontal, Eye, BarChart3, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Project } from '@/types/project.types';

interface ProjectTableRowProps {
  project: Project;
}

export function ProjectTableRow({ project }: ProjectTableRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { isAdmin } = useUser();
  const deleteMutation = useDeleteProject();

  const handleDelete = () => {
    deleteMutation.mutate(project.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs text-muted-foreground">
          {project.project_code}
        </TableCell>
        <TableCell>
          <Link
            href={`/projects/${project.id}`}
            className="font-medium text-primary hover:underline"
          >
            {project.name}
          </Link>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {project.departments && project.departments.length > 0 ? (
              project.departments.map((dept) => (
                <DepartmentBadge
                  key={dept.department_id}
                  departmentId={dept.department_id}
                  departmentName={dept.department_name}
                />
              ))
            ) : (
              <DepartmentBadge
                departmentId={project.department_id}
                departmentName={project.department_name}
              />
            )}
          </div>
        </TableCell>
        <TableCell>
          <ProjectTypeBadge type={project.type} />
        </TableCell>
        <TableCell className="text-right">
          {formatCurrency(project.contract_amount)}
        </TableCell>
        <TableCell>{project.pm_name}</TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {formatPeriod(project.start_date, project.end_date)}
        </TableCell>
        <TableCell>
          <ProjectStatusSelect
            projectId={project.id}
            currentStatus={project.status}
          />
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/projects/${project.id}`} className="flex items-center gap-2 w-full">
                  <Eye className="h-4 w-4" />
                  상세보기
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href={`/projects/${project.id}/cost`} className="flex items-center gap-2 w-full">
                  <BarChart3 className="h-4 w-4" />
                  원가 분석
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="프로젝트 삭제"
        description={`"${project.name}" 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
