'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  formatCurrency,
  formatPercent,
  getProfitRateColor,
  getProfitRateLabel,
  getProfitRateBgColor,
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { CostCalculationResult } from '@/lib/cost-calculator';

interface ProfitSummaryCardProps {
  contractAmount: number;
  costResult: CostCalculationResult;
}

export function ProfitSummaryCard({ contractAmount, costResult }: ProfitSummaryCardProps) {
  const { totalLabor, totalExpense, totalCost, operatingProfit, profitRate } = costResult;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">영업이익 분석</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">계약금액</span>
          <span className="font-medium">{formatCurrency(contractAmount)}</span>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">인건비</span>
            <span>{formatCurrency(totalLabor)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">경비</span>
            <span>{formatCurrency(totalExpense)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>총 원가</span>
            <span>{formatCurrency(totalCost)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="font-semibold">영업이익</span>
          <span className={cn('font-bold text-lg', getProfitRateColor(profitRate))}>
            {formatCurrency(operatingProfit)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold">영업이익률</span>
          <div className="flex items-center gap-2">
            <span className={cn('font-bold text-2xl', getProfitRateColor(profitRate))}>
              {formatPercent(profitRate)}
            </span>
            <Badge className={cn('border-0', getProfitRateBgColor(profitRate))}>
              {getProfitRateLabel(profitRate)}
            </Badge>
          </div>
        </div>

        {/* Profit Rate Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>0%</span>
            <span>15%</span>
            <span>30%</span>
            <span>50%+</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden relative">
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-red-200" />
              <div className="flex-1 bg-yellow-200" />
              <div className="flex-1 bg-blue-200" />
              <div className="flex-1 bg-green-200" />
            </div>
            <div
              className={cn(
                'absolute top-0 h-full w-1 bg-foreground rounded',
                profitRate < 0 ? 'left-0' : ''
              )}
              style={{
                left: `${Math.min(Math.max(profitRate / 50 * 100, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
