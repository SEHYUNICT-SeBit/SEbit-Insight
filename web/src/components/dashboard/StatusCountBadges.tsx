'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusCountBadgesProps {
  counts: {
    total: number;
    active: number;
    settlement_pending: number;
    settled: number;
    on_hold: number;
    cancelled: number;
  };
}

const statusConfig = [
  { key: 'active', label: '진행중', color: 'bg-blue-100 text-blue-700' },
  { key: 'settlement_pending', label: '정산대기', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'settled', label: '정산완료', color: 'bg-green-100 text-green-700' },
  { key: 'on_hold', label: '보류', color: 'bg-orange-100 text-orange-700' },
  { key: 'cancelled', label: '취소', color: 'bg-red-100 text-red-700' },
] as const;

export function StatusCountBadges({ counts }: StatusCountBadgesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">상태별 프로젝트</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statusConfig.map((status) => (
            <div key={status.key} className="flex items-center justify-between">
              <Badge variant="outline" className={cn('border-0', status.color)}>
                {status.label}
              </Badge>
              <span className="font-semibold text-lg">
                {counts[status.key as keyof typeof counts]}건
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">전체</span>
          <span className="font-bold text-xl">{counts.total}건</span>
        </div>
      </CardContent>
    </Card>
  );
}
