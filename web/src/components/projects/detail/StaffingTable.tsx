'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useProjectStaffing } from '@/hooks/useProjects';
import { useAddStaffing, useUpdateStaffing } from '@/hooks/useProjectMutations';
import { useRateCards, useEmployees } from '@/hooks/useMasterData';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency } from '@/lib/utils';
import { calculateStaffingCost } from '@/lib/cost-calculator';
import { Plus, Save } from 'lucide-react';
import type { StaffingCreateRequest } from '@/types/project.types';

interface StaffingTableProps {
  projectId: string;
}

export function StaffingTable({ projectId }: StaffingTableProps) {
  const { data, isLoading } = useProjectStaffing(projectId);
  const addMutation = useAddStaffing(projectId);
  const updateMutation = useUpdateStaffing(projectId);
  const { data: rateCardsData } = useRateCards();
  const { data: employeesData } = useEmployees();
  const { isManager } = useUser();

  const rateCards = rateCardsData?.data || [];
  const employees = employeesData?.data || [];
  const staffingList = data?.data || [];
  const summary = data?.summary;

  const [showAddRow, setShowAddRow] = useState(false);
  const [newRow, setNewRow] = useState<StaffingCreateRequest>({
    employee_id: '',
    position: '',
    man_month: 1,
    monthly_rate: 0,
    note: '',
  });

  const handlePositionChange = (position: string) => {
    const rateCard = rateCards.find((rc) => rc.position === position);
    setNewRow({
      ...newRow,
      position,
      monthly_rate: rateCard?.monthly_rate || 0,
    });
  };

  const handleAdd = () => {
    addMutation.mutate(newRow, {
      onSuccess: () => {
        setShowAddRow(false);
        setNewRow({ employee_id: '', position: '', man_month: 1, monthly_rate: 0, note: '' });
      },
    });
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold">투입 인력</h3>
        {isManager && (
          <Button variant="outline" size="sm" onClick={() => setShowAddRow(true)}>
            <Plus className="h-4 w-4 mr-1" />
            인력 추가
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>담당자</TableHead>
            <TableHead>직급</TableHead>
            <TableHead className="text-right">M/M</TableHead>
            <TableHead className="text-right">단가(만원/월)</TableHead>
            <TableHead className="text-right">소계</TableHead>
            <TableHead>비고</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staffingList.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.employee_name || '-'}</TableCell>
              <TableCell>{s.position}</TableCell>
              <TableCell className="text-right">{s.man_month}</TableCell>
              <TableCell className="text-right">{s.monthly_rate.toLocaleString()}</TableCell>
              <TableCell className="text-right">{formatCurrency(s.total_cost)}</TableCell>
              <TableCell className="text-muted-foreground">{s.note || '-'}</TableCell>
            </TableRow>
          ))}
          {showAddRow && (
            <TableRow>
              <TableCell>
                <Select
                  value={newRow.employee_id}
                  onValueChange={(v) => setNewRow({ ...newRow, employee_id: v })}
                  className="h-8 text-xs"
                >
                  <option value="">선택</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={newRow.position}
                  onValueChange={handlePositionChange}
                  className="h-8 text-xs"
                >
                  <option value="">직급</option>
                  {rateCards.map((rc) => (
                    <option key={rc.id} value={rc.position}>{rc.position}</option>
                  ))}
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.1"
                  className="h-8 text-xs w-20"
                  value={newRow.man_month}
                  onChange={(e) => setNewRow({ ...newRow, man_month: parseFloat(e.target.value) || 0 })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  className="h-8 text-xs w-24"
                  value={newRow.monthly_rate}
                  onChange={(e) => setNewRow({ ...newRow, monthly_rate: parseFloat(e.target.value) || 0 })}
                />
              </TableCell>
              <TableCell className="text-right text-sm">
                {formatCurrency(calculateStaffingCost(newRow.man_month, newRow.monthly_rate))}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Input
                    className="h-8 text-xs flex-1"
                    value={newRow.note}
                    onChange={(e) => setNewRow({ ...newRow, note: e.target.value })}
                    placeholder="비고"
                  />
                  <Button size="icon" className="h-8 w-8" onClick={handleAdd} disabled={addMutation.isPending}>
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
          {staffingList.length === 0 && !showAddRow && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                투입 인력 정보가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {summary && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-semibold">합계</TableCell>
              <TableCell className="text-right font-semibold">{summary.total_man_month}</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(summary.total_labor_cost)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
