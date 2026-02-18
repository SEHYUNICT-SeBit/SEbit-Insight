'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthlyRevenue } from '@/types/api.types';

interface MonthlyRevenueChartProps {
  data: MonthlyRevenue[];
}

const OK_WON = 100000000; // 1억

const PROJECT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#06B6D4', '#D946EF', '#0EA5E9', '#22C55E', '#A855F7',
  '#E11D48', '#0D9488', '#CA8A04', '#7C3AED', '#059669',
  '#2563EB', '#DC2626', '#9333EA', '#16A34A', '#EA580C',
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; fill: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload) return null;

  const nonZero = payload.filter((p) => typeof p.value === 'number' && p.value > 0);
  if (nonZero.length === 0) return null;

  const total = nonZero.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 max-h-[300px] overflow-y-auto min-w-[200px]">
      <p className="font-semibold text-sm mb-2">{label}</p>
      {nonZero.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="truncate max-w-[140px]">{entry.dataKey}</span>
          </div>
          <span className="font-medium flex-shrink-0">{entry.value.toLocaleString()}억</span>
        </div>
      ))}
      <div className="border-t mt-1.5 pt-1.5 flex justify-between text-xs font-semibold">
        <span>합계</span>
        <span>{Math.round(total * 10) / 10}억</span>
      </div>
    </div>
  );
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  // Collect all unique project names across all months
  const projectNames = useMemo(() => {
    const names = new Set<string>();
    for (const month of data) {
      for (const p of month.projects) {
        names.add(p.project_name);
      }
    }
    return Array.from(names);
  }, [data]);

  // Transform data: each month row has project_name as key with amount value
  const chartData = useMemo(() => {
    return data.map((item) => {
      const row: Record<string, string | number> = {
        name: item.month.slice(5) + '월',
      };
      for (const name of projectNames) {
        row[name] = 0;
      }
      for (const p of item.projects) {
        row[p.project_name] = Math.round((p.amount / OK_WON) * 10) / 10;
      }
      return row;
    });
  }, [data, projectNames]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">월별 매출 현황</CardTitle>
          <span className="text-xs text-muted-foreground">
            {projectNames.length}개 과제 · 막대 위에 마우스를 올려 상세보기
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {projectNames.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            매출 데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${v}억`} />
              <Tooltip content={<CustomTooltip />} />
              {projectNames.map((name, i) => (
                <Bar
                  key={name}
                  dataKey={name}
                  stackId="revenue"
                  fill={PROJECT_COLORS[i % PROJECT_COLORS.length]}
                  radius={i === projectNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
