'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { StepIndicator } from '@/components/projects/form/StepIndicator';
import { Step1BasicInfo } from '@/components/projects/form/Step1BasicInfo';
import { Step2ContractInfo } from '@/components/projects/form/Step2ContractInfo';
import { Step4Confirm } from '@/components/projects/form/Step4Confirm';
import { Card, CardContent } from '@/components/ui/card';
import { FormSkeleton } from '@/components/common/LoadingSkeleton';
import { useProjectDetail, useProjectSettlements } from '@/hooks/useProjects';
import { useUpdateProject } from '@/hooks/useProjectMutations';
import { useDepartments, useClients, useEmployees } from '@/hooks/useMasterData';
import type { Step1FormData, Step2FormData } from '@/validations/project';

const SI_LABELS = ['착수금', '중도금1', '중도금2', '잔금'];

const steps = [
  { label: '기본정보' },
  { label: '계약정보' },
  { label: '확인' },
];

export default function ProjectEditClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: project, isLoading: projectLoading } = useProjectDetail(id);
  const { data: settlementsData, isLoading: settlementsLoading } = useProjectSettlements(id);
  const updateProject = useUpdateProject();

  const { data: departmentsData } = useDepartments();
  const { data: clientsData } = useClients();
  const { data: employeesData } = useEmployees();

  const departments = departmentsData?.data || [];
  const clients = clientsData?.data || [];
  const employees = employeesData?.data || [];

  const [currentStep, setCurrentStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1FormData | null>(null);
  const [step2Data, setStep2Data] = useState<Step2FormData | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Build default values from existing project data
  const defaultStep1 = useMemo(() => {
    if (!project) return undefined;
    return {
      name: project.name,
      type: project.type as 'SI' | 'SM',
      departmentIds: project.departments?.map((d) => d.department_id) || [project.department_id],
      salesRepId: project.sales_rep_id,
      description: project.description || '',
    };
  }, [project]);

  const defaultStep2 = useMemo(() => {
    if (!project) return undefined;

    // Build payment schedule from existing settlements
    const settlements = settlementsData?.data || [];
    let paymentSchedule: { label: string; period: string; amount: number }[] | undefined;

    if (project.type === 'SI' && settlements.length > 0) {
      // For SI, try to reconstruct 4 milestones
      paymentSchedule = settlements.map((s, i) => ({
        label: SI_LABELS[i] || `정산${i + 1}`,
        period: s.period,
        amount: s.revenue,
      }));
    } else if (project.type === 'SM' && settlements.length > 0) {
      paymentSchedule = settlements.map((s, i) => ({
        label: `${i + 1}월차`,
        period: s.period,
        amount: s.revenue,
      }));
    }

    return {
      contractAmount: project.contract_amount,
      startDate: project.start_date,
      endDate: project.end_date,
      clientId: project.client_id,
      pmType: project.pm_type as 'employee' | 'freelancer',
      pmId: project.pm_id || '',
      pmName: project.pm_name || '',
      paymentSchedule,
    };
  }, [project, settlementsData]);

  // Initialize step data from defaults (once)
  useEffect(() => {
    if (!initialized && defaultStep1 && defaultStep2) {
      setStep1Data(defaultStep1);
      setStep2Data(defaultStep2);
      setInitialized(true);
    }
  }, [initialized, defaultStep1, defaultStep2]);

  const handleStep1Next = useCallback((data: Step1FormData) => {
    setStep1Data(data);
    setCurrentStep(1);
  }, []);

  const handleStep2Next = useCallback((data: Step2FormData) => {
    setStep2Data(data);
    setCurrentStep(2);
  }, []);

  const handleSubmit = () => {
    if (!step1Data || !step2Data) return;

    updateProject.mutate(
      {
        id,
        data: {
          name: step1Data.name,
          type: step1Data.type,
          department_id: step1Data.departmentIds[0],
          department_ids: step1Data.departmentIds,
          sales_rep_id: step1Data.salesRepId,
          description: step1Data.description,
          contract_amount: step2Data.contractAmount,
          start_date: step2Data.startDate,
          end_date: step2Data.endDate,
          client_id: step2Data.clientId,
          pm_type: step2Data.pmType,
          pm_id: step2Data.pmType === 'employee' ? step2Data.pmId : undefined,
          pm_name: step2Data.pmType === 'freelancer' ? step2Data.pmName : undefined,
          payment_schedule: step2Data.paymentSchedule?.map((p) => ({
            label: p.label,
            period: p.period,
            amount: p.amount,
          })),
          is_draft: 0,
        },
      },
      {
        onSuccess: () => {
          router.push(`/projects/${id}`);
        },
      }
    );
  };

  const getDepartmentNames = (ids: string[]) =>
    ids.map((deptId) => ({
      id: deptId,
      name: departments.find((d) => d.id === deptId)?.name || deptId,
    }));
  const getClientName = (cid: string) => clients.find((c) => c.id === cid)?.name || cid;
  const getEmployeeName = (eid: string) => employees.find((e) => e.id === eid)?.name || eid;

  if (projectLoading || settlementsLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader title="프로젝트 수정" />
        <FormSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader title="프로젝트 수정" />
        <div className="text-center py-12 text-muted-foreground">
          프로젝트를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="프로젝트 수정" description={`${project.project_code} - ${project.name}`} />

      <StepIndicator steps={steps} currentStep={currentStep} />

      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <Step1BasicInfo
              defaultValues={step1Data || defaultStep1}
              onNext={handleStep1Next}
            />
          )}
          {currentStep === 1 && (
            <Step2ContractInfo
              defaultValues={step2Data || defaultStep2}
              projectType={step1Data?.type || project.type as 'SI' | 'SM'}
              onNext={handleStep2Next}
              onBack={() => setCurrentStep(0)}
            />
          )}
          {currentStep === 2 && step1Data && step2Data && (
            <Step4Confirm
              step1Data={step1Data}
              step2Data={step2Data}
              step3Data={{ staffing: [{ position: '', manMonth: 0, monthlyRate: 0 }], freelancerExpenses: [], subcontractExpenses: [], otherExpenses: [] }}
              onBack={() => setCurrentStep(1)}
              onSubmit={handleSubmit}
              isSubmitting={updateProject.isPending}
              departmentNames={getDepartmentNames(step1Data.departmentIds)}
              clientName={getClientName(step2Data.clientId)}
              salesRepName={getEmployeeName(step1Data.salesRepId)}
              pmName={
                step2Data.pmType === 'employee' && step2Data.pmId
                  ? getEmployeeName(step2Data.pmId)
                  : step2Data.pmName || ''
              }
              isEditMode
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
