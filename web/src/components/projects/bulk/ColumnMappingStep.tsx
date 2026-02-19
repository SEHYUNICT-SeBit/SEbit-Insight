'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ColumnMapping } from '@/lib/column-mapper';
import { TARGET_FIELDS } from '@/lib/column-mapper';

interface ColumnMappingStepProps {
  headers: string[];
  sampleRow: Record<string, string>;
  mappings: ColumnMapping[];
  onMappingChange: (idx: number, targetField: string | null) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ColumnMappingStep({
  headers,
  sampleRow,
  mappings,
  onMappingChange,
  onBack,
  onNext,
}: ColumnMappingStepProps) {
  const usedTargets = new Set(
    mappings.filter((m) => m.targetField).map((m) => m.targetField!)
  );

  const requiredFields = TARGET_FIELDS.filter((f) => f.required);
  const mappedRequired = requiredFields.filter((f) =>
    mappings.some((m) => m.targetField === f.key)
  );

  const allRequiredMapped = mappedRequired.length === requiredFields.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">컬럼 매핑</h3>
        <p className="text-sm text-muted-foreground">
          CSV 컬럼을 프로젝트 필드에 매핑하세요. 자동 매핑된 결과를 확인하고 필요시 수정하세요.
        </p>
        <div className="flex gap-2 mt-2">
          <Badge variant={allRequiredMapped ? 'default' : 'destructive'}>
            필수 {mappedRequired.length}/{requiredFields.length}
          </Badge>
          <Badge variant="outline">
            매핑 {mappings.filter((m) => m.targetField).length}/{headers.length}
          </Badge>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">CSV 컬럼</th>
              <th className="px-4 py-2 text-left font-medium">샘플 데이터</th>
              <th className="px-4 py-2 text-left font-medium">매핑 대상</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2 font-medium whitespace-nowrap">
                  {mapping.csvColumn}
                </td>
                <td className="px-4 py-2 text-muted-foreground max-w-[200px] truncate">
                  {sampleRow[mapping.csvColumn] || '-'}
                </td>
                <td className="px-4 py-2">
                  <select
                    className="w-full border rounded-md px-2 py-1.5 text-sm bg-background"
                    value={mapping.targetField || ''}
                    onChange={(e) =>
                      onMappingChange(idx, e.target.value || null)
                    }
                  >
                    <option value="">무시 (skip)</option>
                    {TARGET_FIELDS.map((field) => {
                      const isUsed =
                        usedTargets.has(field.key) && mapping.targetField !== field.key;
                      return (
                        <option key={field.key} value={field.key} disabled={isUsed}>
                          {field.label} {field.required ? '*' : ''} {isUsed ? '(사용중)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          이전
        </Button>
        <Button onClick={onNext} disabled={!allRequiredMapped}>
          다음: 검증 미리보기
        </Button>
      </div>
    </div>
  );
}
