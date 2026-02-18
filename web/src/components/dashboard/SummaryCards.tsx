'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatManWon, formatNumber } from '@/lib/utils';
import { Banknote, FolderKanban, TrendingUp } from 'lucide-react';
import type { DashboardSummary } from '@/types/api.types';

interface SummaryCardsProps {
  data: DashboardSummary;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const cards = [
    {
      title: '총 계약액',
      value: formatManWon(data.total_contract_amount / 10000),
      icon: Banknote,
      description: `SI ${formatNumber(data.by_type.SI.count)}건, SM ${formatNumber(data.by_type.SM.count)}건`,
    },
    {
      title: '진행중 프로젝트',
      value: `${formatNumber(data.project_counts.active)}건`,
      icon: FolderKanban,
      description: `전체 ${formatNumber(data.project_counts.total)}건`,
    },
    {
      title: '이번달 매출',
      value: formatManWon(data.total_revenue_ytd / 10000),
      icon: TrendingUp,
      description: `영업이익률 ${data.avg_profit_rate.toFixed(1)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
