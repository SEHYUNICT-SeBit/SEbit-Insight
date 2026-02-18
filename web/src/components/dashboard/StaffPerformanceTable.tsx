'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatManWon } from '@/lib/utils';
import { useStaffingDetail } from '@/hooks/useStaffingDetail';
import type { StaffingMember } from '@/types/api.types';

const STATUS_CONFIG = {
  idle: { label: '미투입', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  partial: { label: '부분투입', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  full: { label: '완전투입', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  over: { label: '초과투입', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
} as const;

export function StaffPerformanceTable() {
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useStaffingDetail(undefined, selectedDept || undefined);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">투입 인력 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">투입 인력 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">데이터를 불러오는데 실패했습니다.</div>
        </CardContent>
      </Card>
    );
  }

  const { departments, dept_summary, members } = data;

  // 부서별 그룹핑
  const grouped = members.reduce<Record<string, StaffingMember[]>>((acc, m) => {
    const dept = m.department_name;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(m);
    return acc;
  }, {});

  // 전체 통계
  const totalSummary = {
    total: dept_summary.reduce((s, d) => s + d.total, 0),
    idle: dept_summary.reduce((s, d) => s + d.idle_count, 0),
    partial: dept_summary.reduce((s, d) => s + d.partial_count, 0),
    full: dept_summary.reduce((s, d) => s + d.full_count, 0),
  };

  return (
    <div className="space-y-4">
      {/* 부서 필터 */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">부서 선택</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedDept('')}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  selectedDept === ''
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                전체
              </button>
              {departments.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDept(d.id)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    selectedDept === d.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 부서별 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="전체 인원"
          value={totalSummary.total}
          unit="명"
          color="text-foreground"
        />
        <SummaryCard
          label="미투입 (잉여)"
          value={totalSummary.idle}
          unit="명"
          color="text-red-600"
          highlight={totalSummary.idle > 0}
        />
        <SummaryCard
          label="부분투입"
          value={totalSummary.partial}
          unit="명"
          color="text-yellow-600"
        />
        <SummaryCard
          label="완전/초과투입"
          value={totalSummary.full}
          unit="명"
          color="text-green-600"
        />
      </div>

      {/* 부서별 상세 요약 바 */}
      {dept_summary.length > 1 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="space-y-2">
              {dept_summary.map((ds) => (
                <div key={ds.department_id} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-20 shrink-0">{ds.department_name}</span>
                  <div className="flex-1 flex h-6 rounded-md overflow-hidden bg-gray-100">
                    {ds.full_count > 0 && (
                      <div
                        className="bg-green-500 flex items-center justify-center text-[10px] text-white font-medium"
                        style={{ width: `${(ds.full_count / ds.total) * 100}%` }}
                      >
                        {ds.full_count}
                      </div>
                    )}
                    {ds.partial_count > 0 && (
                      <div
                        className="bg-yellow-400 flex items-center justify-center text-[10px] text-white font-medium"
                        style={{ width: `${(ds.partial_count / ds.total) * 100}%` }}
                      >
                        {ds.partial_count}
                      </div>
                    )}
                    {ds.idle_count > 0 && (
                      <div
                        className="bg-red-400 flex items-center justify-center text-[10px] text-white font-medium"
                        style={{ width: `${(ds.idle_count / ds.total) * 100}%` }}
                      >
                        {ds.idle_count}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
                    {ds.total}명
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 인원 상세 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            투입 인력 현황
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {members.length}명
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium w-8"></th>
                  <th className="pb-2 font-medium">이름</th>
                  <th className="pb-2 font-medium">부서</th>
                  <th className="pb-2 font-medium">직급</th>
                  <th className="pb-2 font-medium text-center">상태</th>
                  <th className="pb-2 font-medium text-right">참여 프로젝트</th>
                  <th className="pb-2 font-medium text-right">투입 M/M</th>
                  <th className="pb-2 font-medium text-right">투입 원가</th>
                  <th className="pb-2 font-medium text-right">가동률</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([deptName, deptMembers]) => (
                  <React.Fragment key={deptName}>
                    <tr className="bg-muted/30">
                      <td colSpan={9} className="py-1.5 px-2 font-medium text-xs text-muted-foreground">
                        {deptName} ({deptMembers.length}명
                        {(() => {
                          const idle = deptMembers.filter(m => m.status === 'idle').length;
                          return idle > 0 ? `, 잉여 ${idle}명` : '';
                        })()})
                      </td>
                    </tr>
                    {deptMembers.map((staff) => {
                      const isExpanded = expandedId === staff.id;
                      const statusCfg = STATUS_CONFIG[staff.status];

                      return (
                        <React.Fragment key={staff.id}>
                          <tr
                            className={`border-b last:border-0 hover:bg-muted/50 cursor-pointer ${
                              staff.status === 'idle' ? 'bg-red-50/50' : ''
                            }`}
                            onClick={() => setExpandedId(isExpanded ? null : staff.id)}
                          >
                            <td className="py-2.5 pl-2 text-muted-foreground">
                              <span className={`text-xs transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}>
                                ▶
                              </span>
                            </td>
                            <td className="py-2.5 font-medium pl-2">{staff.name}</td>
                            <td className="py-2.5 text-muted-foreground">{staff.department_name}</td>
                            <td className="py-2.5 text-muted-foreground">{staff.position}</td>
                            <td className="py-2.5 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              {staff.project_count > 0 ? (
                                <span>
                                  {staff.project_count}건
                                  {staff.active_project_count > 0 && (
                                    <span className="text-xs text-blue-600 ml-1">
                                      (진행 {staff.active_project_count})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-2.5 text-right">
                              {staff.total_mm > 0 ? `${staff.total_mm} M/M` : '-'}
                            </td>
                            <td className="py-2.5 text-right">
                              {staff.total_cost > 0 ? formatManWon(staff.total_cost / 10000) : '-'}
                            </td>
                            <td className="py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      staff.utilization_rate >= 80
                                        ? 'bg-green-500'
                                        : staff.utilization_rate >= 50
                                        ? 'bg-yellow-500'
                                        : staff.utilization_rate > 0
                                        ? 'bg-orange-400'
                                        : 'bg-gray-300'
                                    }`}
                                    style={{ width: `${Math.min(staff.utilization_rate, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs w-10 text-right">{staff.utilization_rate}%</span>
                              </div>
                            </td>
                          </tr>
                          {/* 확장: 투입 프로젝트 상세 */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="bg-muted/20 px-6 py-3">
                                {staff.projects.length > 0 ? (
                                  <div className="space-y-1.5">
                                    <div className="text-xs font-medium text-muted-foreground mb-2">
                                      투입 프로젝트 상세
                                    </div>
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-muted-foreground border-b">
                                          <th className="pb-1 text-left font-medium">프로젝트</th>
                                          <th className="pb-1 text-center font-medium">유형</th>
                                          <th className="pb-1 text-center font-medium">상태</th>
                                          <th className="pb-1 text-right font-medium">M/M</th>
                                          <th className="pb-1 text-right font-medium">월단가</th>
                                          <th className="pb-1 text-right font-medium">투입원가</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {staff.projects.map((proj) => (
                                          <tr key={proj.project_id} className="border-b last:border-0">
                                            <td className="py-1.5">{proj.project_name}</td>
                                            <td className="py-1.5 text-center">
                                              <span className={`px-1.5 py-0.5 rounded ${
                                                proj.project_type === 'SI'
                                                  ? 'bg-blue-100 text-blue-700'
                                                  : 'bg-purple-100 text-purple-700'
                                              }`}>
                                                {proj.project_type}
                                              </span>
                                            </td>
                                            <td className="py-1.5 text-center">
                                              <ProjectStatusBadge status={proj.project_status} />
                                            </td>
                                            <td className="py-1.5 text-right">{proj.man_month}</td>
                                            <td className="py-1.5 text-right">
                                              {proj.monthly_rate > 0
                                                ? formatManWon(proj.monthly_rate / 10000)
                                                : '-'}
                                            </td>
                                            <td className="py-1.5 text-right">
                                              {proj.total_cost > 0
                                                ? formatManWon(proj.total_cost / 10000)
                                                : '-'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground py-2">
                                    투입된 프로젝트가 없습니다. (잉여 인력)
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              투입 인력 데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  color,
  highlight,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-red-200 bg-red-50/30' : ''}>
      <CardContent className="pt-4 pb-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold mt-1 ${color}`}>
          {value}
          <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    active: { label: '진행중', color: 'bg-green-100 text-green-700' },
    settlement_pending: { label: '정산대기', color: 'bg-yellow-100 text-yellow-700' },
    settled: { label: '정산완료', color: 'bg-gray-100 text-gray-700' },
    on_hold: { label: '보류', color: 'bg-orange-100 text-orange-700' },
    cancelled: { label: '취소', color: 'bg-red-100 text-red-700' },
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`px-1.5 py-0.5 rounded ${cfg.color}`}>{cfg.label}</span>
  );
}
