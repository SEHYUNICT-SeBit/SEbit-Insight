'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useProjectExpenses } from '@/hooks/useProjects';
import { useAddExpense } from '@/hooks/useProjectMutations';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Save } from 'lucide-react';
import type { ExpenseCreateRequest } from '@/types/project.types';

interface ExpenseTableProps {
  projectId: string;
}

export function ExpenseTable({ projectId }: ExpenseTableProps) {
  const { data, isLoading } = useProjectExpenses(projectId);
  const addMutation = useAddExpense(projectId);
  const { isManager } = useUser();

  const expenses = data?.data || [];
  const summary = data?.summary;

  const [showAddRow, setShowAddRow] = useState(false);
  const [newRow, setNewRow] = useState<ExpenseCreateRequest>({
    category: '출장비',
    expense_type: 'other',
    amount: 0,
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  const handleAdd = () => {
    addMutation.mutate(newRow, {
      onSuccess: () => {
        setShowAddRow(false);
        setNewRow({
          category: '출장비',
          expense_type: 'other',
          amount: 0,
          description: '',
          expense_date: new Date().toISOString().split('T')[0],
        });
      },
    });
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold">경비</h3>
        {isManager && (
          <Button variant="outline" size="sm" onClick={() => setShowAddRow(true)}>
            <Plus className="h-4 w-4 mr-1" />
            경비 추가
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>분류</TableHead>
            <TableHead className="text-right">금액</TableHead>
            <TableHead>설명</TableHead>
            <TableHead>지출일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((exp) => (
            <TableRow key={exp.id}>
              <TableCell>{exp.category}</TableCell>
              <TableCell className="text-right">{formatCurrency(exp.amount)}</TableCell>
              <TableCell className="text-muted-foreground">{exp.description || '-'}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(exp.expense_date || '')}</TableCell>
            </TableRow>
          ))}
          {showAddRow && (
            <TableRow>
              <TableCell>
                <Select
                  value={newRow.category}
                  onValueChange={(v) => setNewRow({ ...newRow, category: v as ExpenseCreateRequest['category'] })}
                  className="h-8 text-xs"
                >
                  <option value="출장비">출장비</option>
                  <option value="장비">장비</option>
                  <option value="외주">외주</option>
                  <option value="기타">기타</option>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  className="h-8 text-xs w-32"
                  value={newRow.amount}
                  onChange={(e) => setNewRow({ ...newRow, amount: parseFloat(e.target.value) || 0 })}
                />
              </TableCell>
              <TableCell>
                <Input
                  className="h-8 text-xs"
                  value={newRow.description}
                  onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                  placeholder="설명"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    value={newRow.expense_date}
                    onChange={(e) => setNewRow({ ...newRow, expense_date: e.target.value })}
                  />
                  <Button size="icon" className="h-8 w-8" onClick={handleAdd} disabled={addMutation.isPending}>
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
          {expenses.length === 0 && !showAddRow && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                경비 내역이 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {summary && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">합계</TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(summary.total_expense)}
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>

      {summary && summary.by_category && Object.keys(summary.by_category).length > 0 && (
        <div className="mt-4 flex gap-4 text-sm">
          {Object.entries(summary.by_category).map(([cat, amount]) => (
            <div key={cat}>
              <span className="text-muted-foreground">{cat}: </span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
