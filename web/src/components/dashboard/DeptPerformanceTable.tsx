'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatManWon, formatNumber, getProfitRateBgColor } from '@/lib/utils';
import { Building2, Users, TrendingUp, Percent } from 'lucide-react';
import type { DeptPerformance } from '@/types/api.types';

interface DeptPerformanceTableProps {
  data: DeptPerformance[];
}

export function DeptPerformanceTable({ data }: DeptPerformanceTableProps) {
  // 전사 합계
  const totals = data.reduce(
    (acc, d) => ({
      headcount: acc.headcount + d.headcount,
      staffed: acc.staffed + d.staffed_count,
      projects: acc.projects + d.project_count,
      contract: acc.contract + d.total_contract,
      revenue: acc.revenue + d.revenue,
      profit: acc.profit + d.operating_profit,
      laborCost: acc.laborCost + d.total_labor_cost,
    }),
    { headcount: 0, staffed: 0, projects: 0, contract: 0, revenue: 0, profit: 0, laborCost: 0 }
  );

  const totalProfitRate = totals.revenue > 0
    ? Math.round((totals.profit / totals.revenue) * 100 * 10) / 10
    : 0;

  const summaryCards = [
    {
      title: '전체 인원',
      value: `${formatNumber(totals.headcount)}명`,
      sub: `투입 ${totals.staffed}명`,
      icon: Users,
    },
    {
      title: '전사 프로젝트',
      value: `${formatNumber(totals.projects)}건`,
      sub: formatManWon(totals.contract / 10000),
      icon: Building2,
    },
    {
      title: '전사 매출',
      value: formatManWon(totals.revenue / 10000),
      sub: `영업이익 ${formatManWon(totals.profit / 10000)}`,
      icon: TrendingUp,
    },
    {
      title: '전사 이익률',
      value: `${totalProfitRate}%`,
      sub: `원가율 ${totals.revenue > 0 ? Math.round((totals.laborCost / totals.revenue) * 100 * 10) / 10 : 0}%`,
      icon: Percent,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <card.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{card.title}</span>
              </div>
              <div className="text-lg font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">부서별 성과 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">부서</th>
                  <th className="pb-2 font-medium text-right">인원</th>
                  <th className="pb-2 font-medium text-right">투입인원</th>
                  <th className="pb-2 font-medium text-right">가동률</th>
                  <th className="pb-2 font-medium text-right">프로젝트</th>
                  <th className="pb-2 font-medium text-right">계약액</th>
                  <th className="pb-2 font-medium text-right">매출</th>
                  <th className="pb-2 font-medium text-right">인건비</th>
                  <th className="pb-2 font-medium text-right">원가율</th>
                  <th className="pb-2 font-medium text-right">이익률</th>
                  <th className="pb-2 font-medium text-right">1인당 매출</th>
                </tr>
              </thead>
              <tbody>
                {data.map((dept) => (
                  <tr key={dept.department_id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 font-medium">{dept.department_name}</td>
                    <td className="py-2.5 text-right">{dept.headcount}명</td>
                    <td className="py-2.5 text-right">{dept.staffed_count}명</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${dept.utilization_rate >= 80 ? 'bg-green-100 text-green-700' : dept.utilization_rate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {dept.utilization_rate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right">{dept.project_count}건</td>
                    <td className="py-2.5 text-right">{formatManWon(dept.total_contract / 10000)}</td>
                    <td className="py-2.5 text-right">{formatManWon(dept.revenue / 10000)}</td>
                    <td className="py-2.5 text-right">{formatManWon(dept.total_labor_cost / 10000)}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${dept.cost_rate > 70 ? 'bg-red-100 text-red-700' : dept.cost_rate > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {dept.cost_rate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getProfitRateBgColor(dept.profit_rate)}`}>
                        {dept.profit_rate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right">{formatManWon(dept.revenue_per_head / 10000)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              부서 성과 데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
