'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { StepIndicator } from '@/components/projects/form/StepIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { FileUploadStep } from '@/components/projects/bulk/FileUploadStep';
import { ColumnMappingStep } from '@/components/projects/bulk/ColumnMappingStep';
import { PreviewStep } from '@/components/projects/bulk/PreviewStep';
import { ImportResultStep } from '@/components/projects/bulk/ImportResultStep';
import { useDepartments, useClients, useEmployees } from '@/hooks/useMasterData';
import { projectService } from '@/services/project.service';
import { autoMapColumns } from '@/lib/column-mapper';
import { applyMapping } from '@/lib/bulk-validator';
import type { ParsedFile } from '@/lib/csv-parser';
import type { ColumnMapping } from '@/lib/column-mapper';
import type { ParsedRow } from '@/lib/bulk-validator';
import { toast } from 'sonner';

const steps = [
  { label: '파일 업로드' },
  { label: '컬럼 매핑' },
  { label: '검증' },
  { label: '결과' },
];

interface ImportResult {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    row_index: number;
    success: boolean;
    project_id?: string;
    project_code?: string;
    error?: string;
  }>;
  created_clients: Array<{ name: string; id: string }>;
}

export default function BulkUploadPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1 state
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [fileName, setFileName] = useState('');

  // Step 2 state
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);

  // Step 3 state
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [autoCreateClients, setAutoCreateClients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 4 state
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Master data for validation
  const { data: departmentsData } = useDepartments();
  const { data: clientsData } = useClients();
  const { data: employeesData } = useEmployees();

  const departments = departmentsData?.data || [];
  const clients = clientsData?.data || [];
  const employees = employeesData?.data || [];

  // Step 1 → Step 2
  const handleFileUpload = useCallback((parsed: ParsedFile, name: string) => {
    setParsedFile(parsed);
    setFileName(name);
    setMappings(autoMapColumns(parsed.headers));
    setCurrentStep(1);
  }, []);

  // Step 2: mapping change
  const handleMappingChange = useCallback((idx: number, targetField: string | null) => {
    setMappings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], targetField };
      return next;
    });
  }, []);

  // Step 2 → Step 3
  const handleMappingNext = useCallback(() => {
    if (!parsedFile) return;
    const rows = applyMapping(
      parsedFile.rows,
      mappings,
      { departments, employees, clients },
      autoCreateClients,
    );
    setParsedRows(rows);
    setCurrentStep(2);
  }, [parsedFile, mappings, departments, employees, clients, autoCreateClients]);

  // Step 3: toggle row selection
  const handleToggleRow = useCallback((rowIndex: number) => {
    setParsedRows((prev) =>
      prev.map((r) =>
        r.rowIndex === rowIndex ? { ...r, selected: !r.selected } : r
      )
    );
  }, []);

  // Step 3: auto-create clients change → re-validate
  const handleAutoCreateChange = useCallback((v: boolean) => {
    setAutoCreateClients(v);
    if (parsedFile) {
      const rows = applyMapping(
        parsedFile.rows,
        mappings,
        { departments, employees, clients },
        v,
      );
      setParsedRows(rows);
    }
  }, [parsedFile, mappings, departments, employees, clients]);

  // Step 3 → Step 4: submit
  const handleSubmit = useCallback(async () => {
    const selectedRows = parsedRows.filter((r) => r.selected && r.validation.status !== 'error');
    if (selectedRows.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await projectService.bulkCreate({
        projects: selectedRows.map((r) => ({
          row_index: r.rowIndex,
          name: r.mapped.name,
          type: r.mapped.type,
          department_ids: r.mapped.department_ids,
          client_id: r.mapped.client_id || undefined,
          client_name: !r.mapped.client_id ? r.mapped.client_name : undefined,
          sales_rep_id: r.mapped.sales_rep_id || undefined,
          pm_id: r.mapped.pm_id || undefined,
          pm_type: r.mapped.pm_type,
          pm_name: r.mapped.pm_type === 'freelancer' ? r.mapped.pm_name : undefined,
          contract_amount: r.mapped.contract_amount,
          start_date: r.mapped.start_date,
          end_date: r.mapped.end_date,
          description: r.mapped.description || undefined,
          status: r.mapped.status || 'active',
        })),
        auto_create_clients: autoCreateClients,
      });

      setImportResult(result);
      setCurrentStep(3);
      toast.success(`${result.succeeded}건 등록 완료`);
    } catch (err: any) {
      toast.error(err.message || '일괄 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [parsedRows, autoCreateClients]);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="프로젝트 일괄 업로드" />

      <StepIndicator steps={steps} currentStep={currentStep} />

      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <FileUploadStep onNext={handleFileUpload} />
          )}

          {currentStep === 1 && parsedFile && (
            <ColumnMappingStep
              headers={parsedFile.headers}
              sampleRow={parsedFile.rows[0] || {}}
              mappings={mappings}
              onMappingChange={handleMappingChange}
              onBack={() => setCurrentStep(0)}
              onNext={handleMappingNext}
            />
          )}

          {currentStep === 2 && (
            <PreviewStep
              rows={parsedRows}
              autoCreateClients={autoCreateClients}
              onAutoCreateClientsChange={handleAutoCreateChange}
              onToggleRow={handleToggleRow}
              onBack={() => setCurrentStep(1)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 3 && importResult && (
            <ImportResultStep result={importResult} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
