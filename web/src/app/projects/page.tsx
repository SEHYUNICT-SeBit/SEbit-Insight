'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';
import { ProjectFilterBar } from '@/components/projects/ProjectFilterBar';
import { ProjectTable } from '@/components/projects/ProjectTable';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import type { ProjectFilter } from '@/types/project.types';

export default function ProjectListPage() {
  const [filter, setFilter] = useState<ProjectFilter>({ page: 1, limit: 20 });
  const { data, isLoading, isError } = useProjects(filter);

  return (
    <div className="space-y-4">
      <PageHeader
        title="프로젝트"
        description="프로젝트 목록을 조회하고 관리합니다."
        actions={
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              프로젝트 등록
            </Button>
          </Link>
        }
      />

      <ProjectFilterBar filter={filter} onFilterChange={setFilter} />

      {isLoading ? (
        <TableSkeleton rows={8} cols={9} />
      ) : isError ? (
        <div className="text-center py-12 text-muted-foreground">
          데이터를 불러오는데 실패했습니다.
        </div>
      ) : (
        <ProjectTable
          projects={data?.data || []}
          pagination={data?.pagination}
          onPageChange={(page) => setFilter({ ...filter, page })}
        />
      )}
    </div>
  );
}
