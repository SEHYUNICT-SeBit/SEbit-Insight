'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useDepartments } from '@/hooks/useMasterData';
import type { EmploymentStatus } from '@/types/master.types';

export interface HRFilter {
  department_id?: string;
  employment_status?: EmploymentStatus;
  search?: string;
}

interface HRFilterBarProps {
  filter: HRFilter;
  onFilterChange: (filter: HRFilter) => void;
}

export function HRFilterBar({ filter, onFilterChange }: HRFilterBarProps) {
  const { data: departmentsData } = useDepartments();
  const departments = departmentsData?.data || [];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="이름 검색"
          className="pl-9"
          value={filter.search || ''}
          onChange={(e) => onFilterChange({ ...filter, search: e.target.value || undefined })}
        />
      </div>

      <Select
        value={filter.department_id || ''}
        onValueChange={(value) =>
          onFilterChange({ ...filter, department_id: value || undefined })
        }
      >
        <option value="">전체 부서</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>{dept.name}</option>
        ))}
      </Select>

      <Select
        value={filter.employment_status || ''}
        onValueChange={(value) =>
          onFilterChange({ ...filter, employment_status: (value as EmploymentStatus) || undefined })
        }
      >
        <option value="">전체 상태</option>
        <option value="재직">재직</option>
        <option value="휴직">휴직</option>
        <option value="병가">병가</option>
        <option value="퇴직">퇴직</option>
      </Select>

      {(filter.search || filter.department_id || filter.employment_status) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onFilterChange({})}
          title="필터 초기화"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
