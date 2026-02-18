'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { StepIndicator } from '@/components/projects/form/StepIndicator';
import { Step1BasicInfo } from '@/components/projects/form/Step1BasicInfo';
import { Step2ContractInfo } from '@/components/projects/form/Step2ContractInfo';
import { Step3Staffing } from '@/components/projects/form/Step3Staffing';
import { Step4Confirm } from '@/components/projects/form/Step4Confirm';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCreateProject } from '@/hooks/useProjectMutations';
import { useDepartments, useClients, useEmployees } from '@/hooks/useMasterData';
import type { Step1FormData, Step2FormData, Step3FormData } from '@/validations/project';
import { Save } from 'lucide-react';

const DRAFT_KEY = 'project-form-draft';

const steps = [
  { label: '기본정보' },
  { label: '계약정보' },
  { label: '인력투입' },
  { label: '확인' },
];

export default function ProjectNewPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1FormData | null>(null);
  const [step2Data, setStep2Data] = useState<Step2FormData | null>(null);
  const [step3Data, setStep3Data] = useState<Step3FormData | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const createProject = useCreateProject();

  const { data: departmentsData } = useDepartments();
  const { data: clientsData } = useClients();
  const { data: employeesData } = useEmployees();

  const departments = departmentsData?.data || [];
  const clients = clientsData?.data || [];
  const employees = employeesData?.data || [];

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (draft) {
        setCurrentStep(draft.step || 0);
        if (draft.step1Data) setStep1Data(draft.step1Data);
        if (draft.step2Data) setStep2Data(draft.step2Data);
        if (draft.step3Data) setStep3Data(draft.step3Data);
        setDraftSavedAt(draft.savedAt);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveDraft = useCallback(() => {
    const now = new Date().toISOString();
    const draft = {
      step: currentStep,
      step1Data,
      step2Data,
      step3Data,
      savedAt: now,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setDraftSavedAt(now);
  }, [currentStep, step1Data, step2Data, step3Data]);

  const handleStep1Next = (data: Step1FormData) => {
    setStep1Data(data);
    setCurrentStep(1);
    saveDraft();
  };

  const handleStep2Next = (data: Step2FormData) => {
    setStep2Data(data);
    setCurrentStep(2);
    saveDraft();
  };

  const handleStep3Next = (data: Step3FormData) => {
    setStep3Data(data);
    setCurrentStep(3);
    saveDraft();
  };

  const handleSubmit = () => {
    if (!step1Data || !step2Data || !step3Data) return;

    createProject.mutate(
      {
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
      {
        onSuccess: () => {
          localStorage.removeItem(DRAFT_KEY);
          router.push('/projects');
        },
      }
    );
  };

  const getDepartmentNames = (ids: string[]) =>
    ids.map((id) => ({
      id,
      name: departments.find((d) => d.id === id)?.name || id,
    }));
  const getClientName = (id: string) => clients.find((c) => c.id === id)?.name || id;
  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || id;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="프로젝트 등록"
        actions={
          <div className="flex items-center gap-2">
            {draftSavedAt && (
              <Badge variant="outline" className="text-xs">
                임시 저장됨: {new Date(draftSavedAt).toLocaleString('ko-KR')}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={saveDraft}>
              <Save className="h-4 w-4 mr-1" />
              임시 저장
            </Button>
          </div>
        }
      />

      <StepIndicator steps={steps} currentStep={currentStep} />

      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <Step1BasicInfo
              defaultValues={step1Data || undefined}
              onNext={handleStep1Next}
            />
          )}
          {currentStep === 1 && (
            <Step2ContractInfo
              defaultValues={step2Data || undefined}
              projectType={step1Data?.type || 'SI'}
              onNext={handleStep2Next}
              onBack={() => setCurrentStep(0)}
            />
          )}
          {currentStep === 2 && (
            <Step3Staffing
              defaultValues={step3Data || undefined}
              onNext={handleStep3Next}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && step1Data && step2Data && step3Data && (
            <Step4Confirm
              step1Data={step1Data}
              step2Data={step2Data}
              step3Data={step3Data}
              onBack={() => setCurrentStep(2)}
              onSubmit={handleSubmit}
              isSubmitting={createProject.isPending}
              departmentNames={getDepartmentNames(step1Data.departmentIds)}
              clientName={getClientName(step2Data.clientId)}
              salesRepName={getEmployeeName(step1Data.salesRepId)}
              pmName={step2Data.pmType === 'employee' && step2Data.pmId ? getEmployeeName(step2Data.pmId) : step2Data.pmName || ''}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
