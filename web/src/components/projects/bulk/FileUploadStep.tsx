'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ParsedFile } from '@/lib/csv-parser';
import { parseFile } from '@/lib/csv-parser';

interface FileUploadStepProps {
  onNext: (parsed: ParsedFile, fileName: string) => void;
}

export function FileUploadStep({ onNext }: FileUploadStepProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ file: string; parsed: ParsedFile } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setError('CSV 또는 Excel(.xlsx) 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하만 가능합니다.');
      return;
    }

    setLoading(true);
    try {
      const parsed = await parseFile(file);
      if (parsed.rows.length === 0) {
        setError('파일에 데이터가 없습니다.');
        setLoading(false);
        return;
      }
      setPreview({ file: file.name, parsed });
    } catch (e: any) {
      setError(`파일 파싱 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">파일 업로드</h3>
        <p className="text-sm text-muted-foreground">
          CSV 또는 Excel(.xlsx) 파일을 업로드하세요. 첫 번째 행은 컬럼 헤더여야 합니다.
        </p>
      </div>

      {!preview ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={onSelect}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-sm text-muted-foreground">파일 파싱 중...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">파일을 드래그하거나 클릭하여 선택</p>
                <p className="text-sm text-muted-foreground mt-1">CSV, Excel (.xlsx) 지원 / 최대 5MB</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{preview.file}</p>
              <p className="text-sm text-muted-foreground">
                {preview.parsed.headers.length}개 컬럼 / {preview.parsed.rows.length}개 행
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ''; }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Preview table */}
          <div className="border rounded-lg overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                  {preview.parsed.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.parsed.rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                    {preview.parsed.headers.map((h) => (
                      <td key={h} className="px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate">
                        {row[h] || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.parsed.rows.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              ... 외 {preview.parsed.rows.length - 5}개 행
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => preview && onNext(preview.parsed, preview.file)}
          disabled={!preview}
        >
          다음: 컬럼 매핑
        </Button>
      </div>
    </div>
  );
}
