'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ParsedRow } from '@/lib/bulk-validator';

interface PreviewStepProps {
  rows: ParsedRow[];
  autoCreateClients: boolean;
  onAutoCreateClientsChange: (v: boolean) => void;
  onToggleRow: (rowIndex: number) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const statusIcon = {
  valid: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
  error: <XCircle className="h-4 w-4 text-red-600" />,
};

function formatAmount(n: number): string {
  if (!n) return '-';
  return n.toLocaleString('ko-KR');
}

export function PreviewStep({
  rows,
  autoCreateClients,
  onAutoCreateClientsChange,
  onToggleRow,
  onBack,
  onSubmit,
  isSubmitting,
}: PreviewStepProps) {
  const validCount = rows.filter((r) => r.validation.status === 'valid' && r.selected).length;
  const warningCount = rows.filter((r) => r.validation.status === 'warning' && r.selected).length;
  const errorCount = rows.filter((r) => r.validation.status === 'error').length;
  const selectedCount = rows.filter((r) => r.selected).length;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">검증 미리보기</h3>
          <p className="text-sm text-muted-foreground">
            데이터를 확인하고 등록할 행을 선택하세요.
          </p>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" /> 유효 {validCount}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-600" /> 경고 {warningCount}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3 text-red-600" /> 오류 {errorCount}
          </Badge>
          <Badge>등록 대상: {selectedCount}건</Badge>
        </div>

        {/* Options */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-create"
            checked={autoCreateClients}
            onCheckedChange={(v) => onAutoCreateClientsChange(!!v)}
          />
          <label htmlFor="auto-create" className="text-sm cursor-pointer">
            미등록 계약처 자동 생성
          </label>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-2 w-10"></th>
                <th className="px-2 py-2 w-10">#</th>
                <th className="px-2 py-2 w-10"></th>
                <th className="px-3 py-2 text-left">프로젝트명</th>
                <th className="px-3 py-2 text-left">유형</th>
                <th className="px-3 py-2 text-left">부서</th>
                <th className="px-3 py-2 text-left">계약처</th>
                <th className="px-3 py-2 text-right">계약금액</th>
                <th className="px-3 py-2 text-left">기간</th>
                <th className="px-3 py-2 text-left">PM</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const messages = [...row.validation.errors, ...row.validation.warnings];
                return (
                  <tr
                    key={row.rowIndex}
                    className={
                      row.validation.status === 'error'
                        ? 'bg-red-50 dark:bg-red-950/20 border-t'
                        : 'border-t'
                    }
                  >
                    <td className="px-2 py-1.5 text-center">
                      <Checkbox
                        checked={row.selected}
                        disabled={row.validation.status === 'error'}
                        onCheckedChange={() => onToggleRow(row.rowIndex)}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-muted-foreground text-center">
                      {row.rowIndex}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {messages.length > 0 ? (
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger>{statusIcon[row.validation.status]}</TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <ul className="text-xs space-y-1">
                              {messages.map((m, i) => (
                                <li key={i}>
                                  <span className="font-medium">{m.field}:</span> {m.message}
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        statusIcon[row.validation.status]
                      )}
                    </td>
                    <td className="px-3 py-1.5 font-medium max-w-[180px] truncate">
                      {row.mapped.name || '-'}
                    </td>
                    <td className="px-3 py-1.5">{row.mapped.type || '-'}</td>
                    <td className="px-3 py-1.5 max-w-[120px] truncate">
                      {row.mapped.department_names.join(', ') || '-'}
                    </td>
                    <td className="px-3 py-1.5 max-w-[120px] truncate">
                      {row.mapped.client_name || '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {formatAmount(row.mapped.contract_amount)}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-xs">
                      {row.mapped.start_date && row.mapped.end_date
                        ? `${row.mapped.start_date} ~ ${row.mapped.end_date}`
                        : '-'}
                    </td>
                    <td className="px-3 py-1.5 max-w-[100px] truncate">
                      {row.mapped.pm_name || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            이전
          </Button>
          <Button onClick={onSubmit} disabled={selectedCount === 0 || isSubmitting}>
            {isSubmitting ? '등록 중...' : `${selectedCount}건 일괄 등록`}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
