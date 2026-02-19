'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface ImportResultStepProps {
  result: ImportResult;
}

export function ImportResultStep({ result }: ImportResultStepProps) {
  const failedRows = result.results.filter((r) => !r.success);

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        {result.failed === 0 ? (
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-bold text-yellow-700 dark:text-yellow-400">!</span>
          </div>
        )}
        <h3 className="text-lg font-semibold">일괄 등록 완료</h3>
      </div>

      {/* Summary */}
      <div className="flex justify-center gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{result.succeeded}</p>
          <p className="text-sm text-muted-foreground">성공</p>
        </div>
        {result.failed > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{result.failed}</p>
            <p className="text-sm text-muted-foreground">실패</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-2xl font-bold">{result.total}</p>
          <p className="text-sm text-muted-foreground">전체</p>
        </div>
      </div>

      {/* Created clients */}
      {result.created_clients.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">자동 생성된 계약처</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.created_clients.map((c) => (
              <Badge key={c.id} variant="outline">{c.name}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Failed rows */}
      {failedRows.length > 0 && (
        <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
          <div className="bg-red-50 dark:bg-red-950/30 px-4 py-2 border-b border-red-200 dark:border-red-800">
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              실패한 행 ({failedRows.length}건)
            </span>
          </div>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">행</th>
                  <th className="px-4 py-2 text-left">오류 내용</th>
                </tr>
              </thead>
              <tbody>
                {failedRows.map((r) => (
                  <tr key={r.row_index} className="border-t">
                    <td className="px-4 py-1.5 text-muted-foreground">{r.row_index}</td>
                    <td className="px-4 py-1.5 text-red-600 dark:text-red-400">{r.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success results */}
      {result.succeeded > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-green-50 dark:bg-green-950/20 px-4 py-2 border-b">
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              등록된 프로젝트 ({result.succeeded}건)
            </span>
          </div>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">행</th>
                  <th className="px-4 py-2 text-left">프로젝트 코드</th>
                </tr>
              </thead>
              <tbody>
                {result.results.filter((r) => r.success).map((r) => (
                  <tr key={r.row_index} className="border-t">
                    <td className="px-4 py-1.5 text-muted-foreground">{r.row_index}</td>
                    <td className="px-4 py-1.5">
                      <Link
                        href={`/projects/${r.project_id}`}
                        className="text-primary hover:underline"
                      >
                        {r.project_code}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Link href="/projects">
          <Button>프로젝트 목록으로 이동</Button>
        </Link>
      </div>
    </div>
  );
}
