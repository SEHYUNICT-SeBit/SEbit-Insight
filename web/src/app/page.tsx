'use client';

import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { DepartmentRevenueChart } from '@/components/dashboard/DepartmentRevenueChart';
import { MonthlyRevenueChart } from '@/components/dashboard/MonthlyRevenueChart';
import { YearlyRevenueChart } from '@/components/dashboard/YearlyRevenueChart';
import { StatusCountBadges } from '@/components/dashboard/StatusCountBadges';
import { RecentProjectsTable } from '@/components/dashboard/RecentProjectsTable';
import { DeptPerformanceTable } from '@/components/dashboard/DeptPerformanceTable';
import { PmPerformanceTable } from '@/components/dashboard/PmPerformanceTable';
import { SalesPerformanceTable } from '@/components/dashboard/SalesPerformanceTable';
import { StaffPerformanceTable } from '@/components/dashboard/StaffPerformanceTable';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useDashboard } from '@/hooks/useDashboard';
import { usePerformance } from '@/hooks/usePerformance';

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const { data: perfData, isLoading: perfLoading } = usePerformance();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="대시보드" description="프로젝트 현황을 한눈에 확인하세요." />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <PageHeader title="대시보드" description="프로젝트 현황을 한눈에 확인하세요." />
        <div className="text-center py-12 text-muted-foreground">
          데이터를 불러오는데 실패했습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="대시보드" description="프로젝트 현황을 한눈에 확인하세요." />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">전사 현황</TabsTrigger>
          <TabsTrigger value="department">부서 성과</TabsTrigger>
          <TabsTrigger value="pm">PM 성과</TabsTrigger>
          <TabsTrigger value="sales">영업 성과</TabsTrigger>
          <TabsTrigger value="staff">투입 현황</TabsTrigger>
        </TabsList>

        {/* 전사 현황 탭 */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <SummaryCards data={data} />
            <MonthlyRevenueChart data={data.monthly_revenue} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DepartmentRevenueChart data={data.by_department} />
              <YearlyRevenueChart data={data.yearly_revenue} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <RecentProjectsTable projects={data.recent_projects} />
              </div>
              <StatusCountBadges counts={data.project_counts} />
            </div>
          </div>
        </TabsContent>

        {/* 부서 성과 탭 */}
        <TabsContent value="department">
          {perfLoading ? (
            <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
          ) : perfData ? (
            <DeptPerformanceTable data={perfData.department} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">데이터를 불러오는데 실패했습니다.</div>
          )}
        </TabsContent>

        {/* PM 성과 탭 */}
        <TabsContent value="pm">
          {perfLoading ? (
            <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
          ) : perfData ? (
            <PmPerformanceTable data={perfData.pm} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">데이터를 불러오는데 실패했습니다.</div>
          )}
        </TabsContent>

        {/* 영업 성과 탭 */}
        <TabsContent value="sales">
          {perfLoading ? (
            <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
          ) : perfData ? (
            <SalesPerformanceTable data={perfData.sales} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">데이터를 불러오는데 실패했습니다.</div>
          )}
        </TabsContent>

        {/* 투입 현황 탭 */}
        <TabsContent value="staff">
          <StaffPerformanceTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
