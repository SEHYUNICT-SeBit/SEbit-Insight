'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { calculateStaffingCost } from '@/lib/cost-calculator';
import { Plus, Trash2 } from 'lucide-react';
import type { RateCard } from '@/types/master.types';

interface StaffingRow {
  position: string;
  manMonth: number;
  monthlyRate: number;
  employeeId?: string;
  note?: string;
}

interface StaffingCostTableProps {
  rows: StaffingRow[];
  rateCards: RateCard[];
  onChange: (rows: StaffingRow[]) => void;
  readOnly?: boolean;
}

export function StaffingCostTable({ rows, rateCards, onChange, readOnly = false }: StaffingCostTableProps) {
  const handleChange = (index: number, field: keyof StaffingRow, value: string | number) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handlePositionChange = (index: number, position: string) => {
    const rateCard = rateCards.find((rc) => rc.position === position);
    const updated = [...rows];
    updated[index] = {
      ...updated[index],
      position,
      monthlyRate: rateCard?.monthly_rate || updated[index].monthlyRate,
    };
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([...rows, { position: '', manMonth: 1, monthlyRate: 0, note: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const totalManMonth = rows.reduce((sum, r) => sum + r.manMonth, 0);
  const totalCost = rows.reduce((sum, r) => sum + calculateStaffingCost(r.manMonth, r.monthlyRate), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">투입 인력 원가</h4>
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
            <TableHead>직급</TableHead>
            <TableHead className="w-[100px] text-right">M/M</TableHead>
            <TableHead className="w-[120px] text-right">단가(만원/월)</TableHead>
            <TableHead className="w-[140px] text-right">소계</TableHead>
            <TableHead>비고</TableHead>
            {!readOnly && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const subtotal = calculateStaffingCost(row.manMonth, row.monthlyRate);
            return (
              <TableRow key={i}>
                <TableCell>
                  {readOnly ? (
                    row.position
                  ) : (
                    <Select
                      value={row.position}
                      onValueChange={(v) => handlePositionChange(i, v)}
                      className="h-8 text-xs"
                    >
                      <option value="">직급 선택</option>
                      {rateCards.map((rc) => (
                        <option key={rc.id} value={rc.position}>{rc.position}</option>
                      ))}
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    row.manMonth
                  ) : (
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8 text-xs text-right"
                      value={row.manMonth}
                      onChange={(e) => handleChange(i, 'manMonth', parseFloat(e.target.value) || 0)}
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    row.monthlyRate.toLocaleString()
                  ) : (
                    <Input
                      type="number"
                      className="h-8 text-xs text-right"
                      value={row.monthlyRate}
                      onChange={(e) => handleChange(i, 'monthlyRate', parseFloat(e.target.value) || 0)}
                    />
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(subtotal)}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    row.note || '-'
                  ) : (
                    <Input
                      className="h-8 text-xs"
                      value={row.note || ''}
                      onChange={(e) => handleChange(i, 'note', e.target.value)}
                      placeholder="비고"
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
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold">합계</TableCell>
            <TableCell className="text-right font-semibold">{totalManMonth.toFixed(1)}</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right font-semibold">{formatCurrency(totalCost)}</TableCell>
            <TableCell></TableCell>
            {!readOnly && <TableCell></TableCell>}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
