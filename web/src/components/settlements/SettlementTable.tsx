'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency, formatPercent, getProfitRateColor } from '@/lib/utils';
import {
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_VARIANTS,
  type Settlement,
} from '@/types/settlement.types';
import { cn } from '@/lib/utils';
import { Edit } from 'lucide-react';

interface SettlementTableProps {
  settlements: Settlement[];
  onEdit?: (settlement: Settlement) => void;
  canEdit?: boolean;
}

export function SettlementTable({ settlements, onEdit, canEdit = false }: SettlementTableProps) {
  if (settlements.length === 0) {
    return (
      <EmptyState
        title="정산 내역이 없습니다"
        description="새 정산을 등록하거나 필터를 변경하세요."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>프로젝트</TableHead>
          <TableHead>기간</TableHead>
          <TableHead className="text-right">매출</TableHead>
          <TableHead className="text-right">인건비</TableHead>
          <TableHead className="text-right">경비</TableHead>
          <TableHead className="text-right">영업이익</TableHead>
          <TableHead className="text-right">이익률</TableHead>
          <TableHead>상태</TableHead>
          {canEdit && <TableHead className="w-[60px]">액션</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {settlements.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.project_name}</TableCell>
            <TableCell>{s.period}</TableCell>
            <TableCell className="text-right">{formatCurrency(s.revenue)}</TableCell>
            <TableCell className="text-right">{formatCurrency(s.total_labor)}</TableCell>
            <TableCell className="text-right">{formatCurrency(s.total_expense)}</TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(s.operating_profit)}
            </TableCell>
            <TableCell className={cn('text-right font-semibold', getProfitRateColor(s.profit_rate))}>
              {formatPercent(s.profit_rate)}
            </TableCell>
            <TableCell>
              <Badge variant={SETTLEMENT_STATUS_VARIANTS[s.status]}>
                {SETTLEMENT_STATUS_LABELS[s.status]}
              </Badge>
            </TableCell>
            {canEdit && (
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit?.(s)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
