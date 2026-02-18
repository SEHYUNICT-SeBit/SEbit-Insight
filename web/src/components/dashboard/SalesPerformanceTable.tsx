'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatManWon } from '@/lib/utils';
import type { SalesPerformance } from '@/types/api.types';

interface SalesPerformanceTableProps {
  data: SalesPerformance[];
}

export function SalesPerformanceTable({ data }: SalesPerformanceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">영업대표별 성과 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">영업대표</th>
                <th className="pb-2 font-medium">부서</th>
                <th className="pb-2 font-medium">직급</th>
                <th className="pb-2 font-medium text-right">수주 건수</th>
                <th className="pb-2 font-medium text-right">총 수주액</th>
                <th className="pb-2 font-medium text-right">SI</th>
                <th className="pb-2 font-medium text-right">SM</th>
                <th className="pb-2 font-medium text-right">SI 금액</th>
                <th className="pb-2 font-medium text-right">SM 금액</th>
                <th className="pb-2 font-medium text-right">매출 기여</th>
                <th className="pb-2 font-medium text-right">전환율</th>
              </tr>
            </thead>
            <tbody>
              {data.map((sales) => (
                <tr key={sales.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2.5 font-medium">{sales.name}</td>
                  <td className="py-2.5 text-muted-foreground">{sales.department_name}</td>
                  <td className="py-2.5 text-muted-foreground">{sales.position}</td>
                  <td className="py-2.5 text-right">{sales.project_count}건</td>
                  <td className="py-2.5 text-right font-medium">{formatManWon(sales.total_contract / 10000)}</td>
                  <td className="py-2.5 text-right">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      {sales.si_count}건
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                      {sales.sm_count}건
                    </span>
                  </td>
                  <td className="py-2.5 text-right">{formatManWon(sales.si_amount / 10000)}</td>
                  <td className="py-2.5 text-right">{formatManWon(sales.sm_amount / 10000)}</td>
                  <td className="py-2.5 text-right">{formatManWon(sales.revenue_contribution / 10000)}</td>
                  <td className="py-2.5 text-right">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${sales.conversion_rate >= 70 ? 'bg-green-100 text-green-700' : sales.conversion_rate >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {sales.conversion_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            영업대표 성과 데이터가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
