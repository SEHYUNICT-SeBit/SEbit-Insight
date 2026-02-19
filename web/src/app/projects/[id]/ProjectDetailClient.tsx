'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';
import { ProjectDetailTabs } from '@/components/projects/detail/ProjectDetailTabs';
import { FormSkeleton } from '@/components/common/LoadingSkeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { useProjectDetail } from '@/hooks/useProjects';
import { useDeleteProject } from '@/hooks/useProjectMutations';
import { useUser } from '@/contexts/UserContext';
import { BarChart3, Pencil, Trash2 } from 'lucide-react';

export default function ProjectDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project, isLoading, isError } = useProjectDetail(id);
  const deleteMutation = useDeleteProject();
  const { isAdmin } = useUser();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => router.push('/projects'),
    });
    setDeleteOpen(false);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="프로젝트 상세" />
        <FormSkeleton />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div>
        <PageHeader title="프로젝트 상세" />
        <div className="text-center py-12 text-muted-foreground">
          프로젝트를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={`${project.project_code} - ${
          project.departments && project.departments.length > 0
            ? project.departments.map((d) => d.department_name).join(', ')
            : project.department_name
        }`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/projects/${id}/edit`}>
              <Button variant="outline">
                <Pencil className="h-4 w-4 mr-2" />
                수정
              </Button>
            </Link>
            <Link href={`/projects/${id}/cost`}>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                원가 분석
              </Button>
            </Link>
            {isAdmin && (
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </Button>
            )}
          </div>
        }
      />

      <ProjectDetailTabs project={project} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="프로젝트 삭제"
        description={`"${project.name}" 프로젝트를 삭제하시겠습니까? 관련된 투입인력, 경비, 원가분석 데이터도 모두 삭제됩니다.`}
        confirmLabel="삭제"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
