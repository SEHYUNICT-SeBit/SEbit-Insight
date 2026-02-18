'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DepartmentSummary } from '@/types/api.types';

interface DepartmentRevenueChartProps {
  data: DepartmentSummary[];
}

const OK_WON = 100000000; // 1억

export function DepartmentRevenueChart({ data }: DepartmentRevenueChartProps) {
  const chartData = data.map((dept) => ({
    name: dept.department_name,
    계약액: Math.round(dept.contract_amount / OK_WON * 10) / 10,
    매출: Math.round(dept.revenue_ytd / OK_WON * 10) / 10,
    영업이익: Math.round(dept.operating_profit_ytd / OK_WON * 10) / 10,
  }));

  const formatTooltip = (value: number) => `${value.toLocaleString()}억원`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">부서별 매출 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} domain={[0, 50]} tickFormatter={(v) => `${v}억`} />
            <Tooltip formatter={formatTooltip} />
            <Legend />
            <Bar dataKey="계약액" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="매출" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="영업이익" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
