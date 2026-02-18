'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatManWon, getProfitRateBgColor } from '@/lib/utils';
import type { PmPerformance } from '@/types/api.types';

interface PmPerformanceTableProps {
  data: PmPerformance[];
}

export function PmPerformanceTable({ data }: PmPerformanceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">PM별 성과 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">PM</th>
                <th className="pb-2 font-medium">부서</th>
                <th className="pb-2 font-medium">직급</th>
                <th className="pb-2 font-medium text-right">프로젝트</th>
                <th className="pb-2 font-medium text-right">진행중</th>
                <th className="pb-2 font-medium text-right">완료</th>
                <th className="pb-2 font-medium text-right">총 계약액</th>
                <th className="pb-2 font-medium text-right">매출</th>
                <th className="pb-2 font-medium text-right">영업이익</th>
                <th className="pb-2 font-medium text-right">이익률</th>
                <th className="pb-2 font-medium text-right">완료율</th>
              </tr>
            </thead>
            <tbody>
              {data.map((pm) => (
                <tr key={pm.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2.5 font-medium">{pm.name}</td>
                  <td className="py-2.5 text-muted-foreground">{pm.department_name}</td>
                  <td className="py-2.5 text-muted-foreground">{pm.position}</td>
                  <td className="py-2.5 text-right">{pm.project_count}건</td>
                  <td className="py-2.5 text-right">
                    <span className="text-blue-600">{pm.active_count}건</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="text-green-600">{pm.settled_count}건</span>
                  </td>
                  <td className="py-2.5 text-right">{formatManWon(pm.total_contract / 10000)}</td>
                  <td className="py-2.5 text-right">{formatManWon(pm.revenue / 10000)}</td>
                  <td className="py-2.5 text-right">{formatManWon(pm.operating_profit / 10000)}</td>
                  <td className="py-2.5 text-right">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getProfitRateBgColor(pm.profit_rate)}`}>
                      {pm.profit_rate}%
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${pm.completion_rate >= 70 ? 'bg-green-100 text-green-700' : pm.completion_rate >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {pm.completion_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            PM 성과 데이터가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
