'use client';

import React from 'react';
import { Select } from '@/components/ui/select';
import { useUpdateProjectStatus } from '@/hooks/useProjectMutations';
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '@/types/project.types';
import { useUser } from '@/contexts/UserContext';

interface ProjectStatusSelectProps {
  projectId: string;
  currentStatus: ProjectStatus;
}

export function ProjectStatusSelect({ projectId, currentStatus }: ProjectStatusSelectProps) {
  const mutation = useUpdateProjectStatus();
  const { isManager } = useUser();

  const handleChange = (newStatus: string) => {
    if (newStatus !== currentStatus) {
      mutation.mutate({ id: projectId, status: newStatus });
    }
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleChange}
      disabled={!isManager || mutation.isPending}
      className="w-[130px] h-8 text-xs"
    >
      {Object.entries(PROJECT_STATUS_LABELS)
        .filter(([key]) => key !== 'draft')
        .map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
    </Select>
  );
}
