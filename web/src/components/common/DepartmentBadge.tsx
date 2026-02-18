import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getDepartmentBgClass } from '@/lib/department-colors';
import { cn } from '@/lib/utils';

interface DepartmentBadgeProps {
  departmentId: string;
  departmentName?: string;
  className?: string;
}

export function DepartmentBadge({ departmentId, departmentName, className }: DepartmentBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-0',
        getDepartmentBgClass(departmentId),
        className
      )}
    >
      {departmentName || departmentId}
    </Badge>
  );
}
