import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProjectType } from '@/types/project.types';

interface ProjectTypeBadgeProps {
  type: ProjectType;
  className?: string;
}

const typeStyles: Record<ProjectType, string> = {
  SI: 'bg-indigo-100 text-indigo-700 border-0',
  SM: 'bg-teal-100 text-teal-700 border-0',
};

export function ProjectTypeBadge({ type, className }: ProjectTypeBadgeProps) {
  return (
    <Badge variant="outline" className={cn(typeStyles[type], className)}>
      {type}
    </Badge>
  );
}
