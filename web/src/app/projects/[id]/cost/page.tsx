'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';
import { StaffingCostTable } from '@/components/cost/StaffingCostTable';
import { ExpenseInputTable } from '@/components/cost/ExpenseInputTable';
import { ProfitSummaryCard } from '@/components/cost/ProfitSummaryCard';
import { FormSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProjectDetail, useProjectCostAnalysis } from '@/hooks/useProjects';
import { useSaveCostAnalysis } from '@/hooks/useProjectMutations';
import { useRateCards } from '@/hooks/useMasterData';
import { calculateCost } from '@/lib/cost-calculator';
import { useUser } from '@/contexts/UserContext';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface StaffingRow {
  position: string;
  manMonth: number;
  monthlyRate: number;
  employeeId?: string;
  note?: string;
}

interface ExpenseRow {
  category: '출장비' | '장비' | '외주' | '기타';
  amount: number;
  description?: string;
}

export default function CostAnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: project, isLoading: projectLoading } = useProjectDetail(id);
  const { data: costData, isLoading: costLoading } = useProjectCostAnalysis(id);
  const { data: rateCardsData } = useRateCards();
  const saveMutation = useSaveCostAnalysis(id);
  const { isManager } = useUser();

  const rateCards = rateCardsData?.data || [];

  const [staffingRows, setStaffingRows] = useState<StaffingRow[]>([]);
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize with existing cost analysis data
  useEffect(() => {
    if (costData && !initialized) {
      setStaffingRows(
        costData.staffing.map((s) => ({
          position: s.position,
          manMonth: s.man_month,
          monthlyRate: s.monthly_rate,
          employeeId: s.employee_id,
          note: s.note,
        }))
      );
      setExpenseRows(
        costData.expenses.map((e) => ({
          category: e.category,
          amount: e.amount,
          description: e.description,
        }))
      );
      setInitialized(true);
    } else if (!costData && !costLoading && !initialized) {
      // If no existing data, start with one empty row
      setStaffingRows([{ position: '', manMonth: 1, monthlyRate: 0, note: '' }]);
      setExpenseRows([]);
      setInitialized(true);
    }
  }, [costData, costLoading, initialized]);

  // Real-time cost calculation
  const costResult = useMemo(() => {
    const staffingForCalc = staffingRows.map((s) => ({
      man_month: s.manMonth,
      monthly_rate: s.monthlyRate,
    }));
    return calculateCost(staffingForCalc, [], [], expenseRows.map((e) => ({ amount: e.amount })), project?.contract_amount || 0);
  }, [staffingRows, expenseRows, project?.contract_amount]);

  const handleSave = () => {
    const staffing = staffingRows
      .filter((r) => r.position)
      .map((r) => ({
        employee_id: r.employeeId,
        position: r.position,
        man_month: r.manMonth,
        monthly_rate: r.monthlyRate,
        note: r.note,
      }));

    const expenses = expenseRows
      .filter((r) => r.amount > 0)
      .map((r) => ({
        category: r.category,
        expense_type: 'other' as const,
        amount: r.amount,
        description: r.description,
      }));

    saveMutation.mutate({ staffing, expenses });
  };

  if (projectLoading || costLoading) {
    return (
      <div>
        <PageHeader title="원가 분석" />
        <FormSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <PageHeader title="원가 분석" />
        <div className="text-center py-12 text-muted-foreground">
          프로젝트를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`원가 분석 - ${project.name}`}
        description={`${project.project_code} | 계약금액: ${project.contract_amount.toLocaleString()}원`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/projects/${id}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                프로젝트 상세
              </Button>
            </Link>
            {isManager && (
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                저장
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <StaffingCostTable
                rows={staffingRows}
                rateCards={rateCards}
                onChange={setStaffingRows}
                readOnly={!isManager}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ExpenseInputTable
                rows={expenseRows}
                onChange={setExpenseRows}
                readOnly={!isManager}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="sticky top-20">
            <ProfitSummaryCard
              contractAmount={project.contract_amount}
              costResult={costResult}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
