'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { HRFilterBar, type HRFilter } from '@/components/hr/HRFilterBar';
import { HREmployeeTable } from '@/components/hr/HREmployeeTable';
import { EmployeeProjectsSheet } from '@/components/hr/EmployeeProjectsSheet';
import { SyncStatusBar } from '@/components/hr/SyncStatusBar';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { useHREmployees } from '@/hooks/useHR';
import { useUser } from '@/contexts/UserContext';
import type { Employee } from '@/types/master.types';

export default function HRPage() {
  const { isAdmin } = useUser();
  const [filter, setFilter] = useState<HRFilter>({});
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const { data, isLoading, isError } = useHREmployees(
    filter.department_id,
    filter.employment_status,
    filter.search,
  );

  const employees: Employee[] = data?.data || [];

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId],
  );

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="인사정보" description="직원 인사정보를 관리합니다." />
        <div className="text-center py-12 text-muted-foreground">
          권한이 없습니다. 어드민 이상의 권한이 필요합니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="인사정보"
        description="직원 인사정보를 관리합니다."
        actions={<SyncStatusBar />}
      />

      <HRFilterBar filter={filter} onFilterChange={setFilter} />

      {isLoading ? (
        <TableSkeleton rows={10} cols={7} />
      ) : isError ? (
        <div className="text-center py-12 text-muted-foreground">
          데이터를 불러오는데 실패했습니다.
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            총 {employees.length}명
          </div>
          <HREmployeeTable
            employees={employees}
            onViewProjects={(id) => setSelectedEmployeeId(id)}
          />
        </>
      )}

      <EmployeeProjectsSheet
        employeeId={selectedEmployeeId}
        employeeName={selectedEmployee?.name}
        open={!!selectedEmployeeId}
        onOpenChange={(open) => { if (!open) setSelectedEmployeeId(null); }}
      />
    </div>
  );
}
