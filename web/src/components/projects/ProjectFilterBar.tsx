'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useDepartments } from '@/hooks/useMasterData';
import type { ProjectFilter, ProjectStatus, ProjectType } from '@/types/project.types';
import { PROJECT_STATUS_LABELS } from '@/types/project.types';

interface ProjectFilterBarProps {
  filter: ProjectFilter;
  onFilterChange: (filter: ProjectFilter) => void;
}

export function ProjectFilterBar({ filter, onFilterChange }: ProjectFilterBarProps) {
  const { data: departmentsData } = useDepartments();
  const departments = departmentsData?.data || [];

  const handleReset = () => {
    onFilterChange({});
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="프로젝트명 / 코드 검색"
          className="pl-9"
          value={filter.search || ''}
          onChange={(e) => onFilterChange({ ...filter, search: e.target.value, page: 1 })}
        />
      </div>

      <Select
        value={filter.department_id || ''}
        onValueChange={(value) =>
          onFilterChange({ ...filter, department_id: value || undefined, page: 1 })
        }
      >
        <option value="">전체 부서</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </Select>

      <Select
        value={filter.status || ''}
        onValueChange={(value) =>
          onFilterChange({ ...filter, status: (value as ProjectStatus) || undefined, page: 1 })
        }
      >
        <option value="">전체 상태</option>
        {Object.entries(PROJECT_STATUS_LABELS)
          .filter(([key]) => key !== 'draft')
          .map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
      </Select>

      <Select
        value={filter.type || ''}
        onValueChange={(value) =>
          onFilterChange({ ...filter, type: (value as ProjectType) || undefined, page: 1 })
        }
      >
        <option value="">전체 유형</option>
        <option value="SI">SI</option>
        <option value="SM">SM</option>
      </Select>

      <Button variant="ghost" size="icon" onClick={handleReset} title="필터 초기화">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
