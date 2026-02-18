'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StaffingTable } from './StaffingTable';
import { ExpenseTable } from './ExpenseTable';
import { DepartmentBadge } from '@/components/common/DepartmentBadge';
import { ProjectTypeBadge } from '@/components/common/ProjectTypeBadge';
import { formatCurrency, formatDate, formatPeriod } from '@/lib/utils';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  type Project,
} from '@/types/project.types';
import { cn } from '@/lib/utils';

interface ProjectDetailTabsProps {
  project: Project;
}

export function ProjectDetailTabs({ project }: ProjectDetailTabsProps) {
  return (
    <Tabs defaultValue="info">
      <TabsList>
        <TabsTrigger value="info">기본정보</TabsTrigger>
        <TabsTrigger value="staffing">투입인력</TabsTrigger>
        <TabsTrigger value="expenses">경비</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">프로젝트 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div>
                  <span className="text-muted-foreground block mb-1">프로젝트 코드</span>
                  <span className="font-mono">{project.project_code}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">프로젝트명</span>
                  <span className="font-medium text-lg">{project.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">유형</span>
                  <ProjectTypeBadge type={project.type} />
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">부서</span>
                  <div className="flex flex-wrap gap-1.5">
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
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">상태</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'border-0',
                      PROJECT_STATUS_COLORS[project.status]
                    )}
                  >
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-muted-foreground block mb-1">계약금액</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(project.contract_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">계약처</span>
                  <span>{project.client_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">계약기간</span>
                  <span>{formatPeriod(project.start_date, project.end_date)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">영업대표</span>
                  <span>{project.sales_rep_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">담당 PM</span>
                  <span>{project.pm_name}</span>
                </div>
              </div>
            </div>

            {project.description && (
              <>
                <Separator className="my-4" />
                <div className="text-sm">
                  <span className="text-muted-foreground block mb-1">설명</span>
                  <p>{project.description}</p>
                </div>
              </>
            )}

            <Separator className="my-4" />
            <div className="flex gap-6 text-xs text-muted-foreground">
              <span>등록일: {formatDate(project.created_at)}</span>
              <span>수정일: {formatDate(project.updated_at)}</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="staffing">
        <Card>
          <CardContent className="pt-6">
            <StaffingTable projectId={project.id} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="expenses">
        <Card>
          <CardContent className="pt-6">
            <ExpenseTable projectId={project.id} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
