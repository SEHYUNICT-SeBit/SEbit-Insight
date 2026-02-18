'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useSyncEmployees } from '@/hooks/useHR';

export function SyncStatusBar() {
  const syncMutation = useSyncEmployees();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => syncMutation.mutate()}
      disabled={syncMutation.isPending}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
      {syncMutation.isPending ? '동기화 중...' : '네이버 웍스 동기화'}
    </Button>
  );
}
