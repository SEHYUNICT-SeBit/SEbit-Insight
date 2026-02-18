'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateCost, calculateStaffingCost } from '@/lib/cost-calculator';
import { formatCurrency, getProfitRateColor, getProfitRateLabel, formatPercent } from '@/lib/utils';
import type { Step1FormData, Step2FormData, Step3FormData } from '@/validations/project';
import { cn } from '@/lib/utils';
import { getDepartmentBgClass } from '@/lib/department-colors';
import { Loader2 } from 'lucide-react';

interface Step4ConfirmProps {
  step1Data: Step1FormData;
  step2Data: Step2FormData;
  step3Data: Step3FormData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  departmentNames?: { id: string; name: string }[];
  clientName?: string;
  salesRepName?: string;
  pmName?: string;
  isEditMode?: boolean;
}

export function Step4Confirm({
  step1Data,
  step2Data,
  step3Data,
  onBack,
  onSubmit,
  isSubmitting = false,
  departmentNames,
  clientName,
  salesRepName,
  pmName,
  isEditMode = false,
}: Step4ConfirmProps) {
  const staffingForCalc = step3Data.staffing.map((s) => ({
    man_month: s.manMonth,
    monthly_rate: s.monthlyRate,
  }));

  const freelancerForCalc = (step3Data.freelancerExpenses || []).map((f) => ({
    monthlyRate: f.monthlyRate,
    manMonth: f.manMonth,
  }));

  const subcontractForCalc = (step3Data.subcontractExpenses || []).map((s) => ({
    amount: s.amount,
  }));

  const otherForCalc = (step3Data.otherExpenses || []).map((o) => ({
    amount: o.amount,
  }));

  const costResult = calculateCost(
    staffingForCalc,
    freelancerForCalc,
    subcontractForCalc,
    otherForCalc,
    step2Data.contractAmount
  );

  const freelancerExpenses = step3Data.freelancerExpenses || [];
  const subcontractExpenses = step3Data.subcontractExpenses || [];
  const otherExpenses = step3Data.otherExpenses || [];

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">프로젝트명</span>
            <p className="font-medium">{step1Data.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">유형</span>
            <p><Badge variant="outline">{step1Data.type}</Badge></p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">협업 부서</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(departmentNames && departmentNames.length > 0
                ? departmentNames
                : step1Data.departmentIds.map((id) => ({ id, name: id }))
              ).map((dept) => (
                <Badge
                  key={dept.id}
                  variant="outline"
                  className={cn(
                    'border-0',
                    getDepartmentBgClass(dept.id),
                  )}
                >
                  {dept.name}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">영업대표</span>
            <p className="font-medium">{salesRepName || step1Data.salesRepId}</p>
          </div>
          {step1Data.description && (
            <div className="col-span-2">
              <span className="text-muted-foreground">설명</span>
              <p>{step1Data.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">계약 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">계약금액</span>
            <p className="font-medium text-lg">{formatCurrency(step2Data.contractAmount)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">계약처</span>
            <p className="font-medium">{clientName || step2Data.clientId}</p>
          </div>
          <div>
            <span className="text-muted-foreground">시작일</span>
            <p className="font-medium">{step2Data.startDate}</p>
          </div>
          <div>
            <span className="text-muted-foreground">종료일</span>
            <p className="font-medium">{step2Data.endDate}</p>
          </div>
          <div>
            <span className="text-muted-foreground">담당 PM</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {step2Data.pmType === 'employee' ? '정직원' : '외주개발자'}
              </Badge>
              <p className="font-medium">{pmName || step2Data.pmName || step2Data.pmId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staffing (실투입인력) - hide in edit mode */}
      {!isEditMode && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">실투입인력</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>등급</TableHead>
                    <TableHead>M/M</TableHead>
                    <TableHead>단가(만원/월)</TableHead>
                    <TableHead className="text-right">소계</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {step3Data.staffing.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{s.position}</TableCell>
                      <TableCell>{s.manMonth}</TableCell>
                      <TableCell>{s.monthlyRate.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(calculateStaffingCost(s.manMonth, s.monthlyRate))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Freelancer Expenses (외주 인력 프리랜서) */}
          {freelancerExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">외주 인력 (프리랜서)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>등급</TableHead>
                      <TableHead>M/M</TableHead>
                      <TableHead>단가(만원/월)</TableHead>
                      <TableHead className="text-right">소계</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {freelancerExpenses.map((f, i) => (
                      <TableRow key={i}>
                        <TableCell>{f.name || '-'}</TableCell>
                        <TableCell>{f.level}</TableCell>
                        <TableCell>{f.manMonth}</TableCell>
                        <TableCell>{f.monthlyRate.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(calculateStaffingCost(f.manMonth, f.monthlyRate))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Subcontract Expenses (업체외주비) */}
          {subcontractExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">업체외주비</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>업체명</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                      <TableHead>비고</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subcontractExpenses.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell>{s.companyName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.amount)}</TableCell>
                        <TableCell className="text-muted-foreground">{s.note || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Other Expenses (기타경비) */}
          {otherExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">기타경비</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>분류</TableHead>
                      <TableHead>내역</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                      <TableHead>비고</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otherExpenses.map((o, i) => (
                      <TableRow key={i}>
                        <TableCell>{o.subcategory}</TableCell>
                        <TableCell>{o.description || '-'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(o.amount)}</TableCell>
                        <TableCell className="text-muted-foreground">{o.note || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">원가 미리보기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">계약금액</span>
                <span className="font-medium">{formatCurrency(step2Data.contractAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">실투입인력 인건비</span>
                <span>{formatCurrency(costResult.totalLabor)}</span>
              </div>
              {costResult.totalFreelancer > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">외주 인력 (프리랜서)</span>
                  <span>{formatCurrency(costResult.totalFreelancer)}</span>
                </div>
              )}
              {costResult.totalSubcontract > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">업체외주비</span>
                  <span>{formatCurrency(costResult.totalSubcontract)}</span>
                </div>
              )}
              {costResult.totalOther > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">기타경비</span>
                  <span>{formatCurrency(costResult.totalOther)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">총 원가</span>
                <span className="font-medium">{formatCurrency(costResult.totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">영업이익</span>
                <span className="font-bold">{formatCurrency(costResult.operatingProfit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">영업이익률</span>
                <span className={cn('font-bold text-lg', getProfitRateColor(costResult.profitRate))}>
                  {formatPercent(costResult.profitRate)} ({getProfitRateLabel(costResult.profitRate)})
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Payment Schedule Summary (edit mode) */}
      {isEditMode && step2Data.paymentSchedule && step2Data.paymentSchedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">정산 일정</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>구분</TableHead>
                  <TableHead>정산월</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {step2Data.paymentSchedule.filter((p) => p.amount > 0).map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>{p.label}</TableCell>
                    <TableCell>{p.period}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          이전
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditMode ? '프로젝트 수정' : '프로젝트 등록'}
        </Button>
      </div>
    </div>
  );
}
