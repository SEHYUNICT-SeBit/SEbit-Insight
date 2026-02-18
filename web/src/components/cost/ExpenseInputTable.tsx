'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

interface ExpenseRow {
  category: '출장비' | '장비' | '외주' | '기타';
  amount: number;
  description?: string;
}

interface ExpenseInputTableProps {
  rows: ExpenseRow[];
  onChange: (rows: ExpenseRow[]) => void;
  readOnly?: boolean;
}

export function ExpenseInputTable({ rows, onChange, readOnly = false }: ExpenseInputTableProps) {
  const handleChange = (index: number, field: keyof ExpenseRow, value: string | number) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([...rows, { category: '출장비', amount: 0, description: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const totalExpense = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">경비</h4>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            행 추가
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>분류</TableHead>
            <TableHead className="w-[160px] text-right">금액 (원)</TableHead>
            <TableHead>설명</TableHead>
            {!readOnly && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell>
                {readOnly ? (
                  row.category
                ) : (
                  <Select
                    value={row.category}
                    onValueChange={(v) => handleChange(i, 'category', v)}
                    className="h-8 text-xs"
                  >
                    <option value="출장비">출장비</option>
                    <option value="장비">장비</option>
                    <option value="외주">외주</option>
                    <option value="기타">기타</option>
                  </Select>
                )}
              </TableCell>
              <TableCell className="text-right">
                {readOnly ? (
                  formatCurrency(row.amount)
                ) : (
                  <Input
                    type="number"
                    className="h-8 text-xs text-right"
                    value={row.amount}
                    onChange={(e) => handleChange(i, 'amount', parseFloat(e.target.value) || 0)}
                  />
                )}
              </TableCell>
              <TableCell>
                {readOnly ? (
                  row.description || '-'
                ) : (
                  <Input
                    className="h-8 text-xs"
                    value={row.description || ''}
                    onChange={(e) => handleChange(i, 'description', e.target.value)}
                    placeholder="설명"
                  />
                )}
              </TableCell>
              {!readOnly && (
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemove(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={readOnly ? 3 : 4} className="text-center text-muted-foreground py-4">
                경비 항목이 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">합계</TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(totalExpense)}</TableCell>
              <TableCell></TableCell>
              {!readOnly && <TableCell></TableCell>}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
