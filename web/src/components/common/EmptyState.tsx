import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = '데이터가 없습니다',
  description = '조건에 맞는 데이터가 없습니다.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-muted-foreground mb-4">
          {icon || <FolderOpen className="h-12 w-12" />}
        </div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}
