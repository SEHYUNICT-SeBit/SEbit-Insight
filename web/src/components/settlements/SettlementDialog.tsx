'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settlementSchema, type SettlementFormData } from '@/validations/settlement';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useProjects } from '@/hooks/useProjects';
import { useCreateSettlement, useUpdateSettlement } from '@/hooks/useSettlements';
import { SETTLEMENT_STATUS_LABELS } from '@/types/settlement.types';
import type { Settlement } from '@/types/settlement.types';
import { Loader2 } from 'lucide-react';

interface SettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: Settlement | null;
}

export function SettlementDialog({ open, onOpenChange, editData }: SettlementDialogProps) {
  const isEdit = !!editData;
  const createMutation = useCreateSettlement();
  const updateMutation = useUpdateSettlement();
  const { data: projectsData } = useProjects({ limit: 100 });
  const projects = projectsData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      projectId: '',
      period: '',
      revenue: 0,
      totalLabor: 0,
      totalExpense: 0,
      status: 'pending',
      note: '',
    },
  });

  useEffect(() => {
    if (editData) {
      reset({
        projectId: editData.project_id,
        period: editData.period,
        revenue: editData.revenue,
        totalLabor: editData.total_labor,
        totalExpense: editData.total_expense,
        status: editData.status,
        note: editData.note || '',
      });
    } else {
      reset({
        projectId: '',
        period: '',
        revenue: 0,
        totalLabor: 0,
        totalExpense: 0,
        status: 'pending',
        note: '',
      });
    }
  }, [editData, reset]);

  const onSubmit = (data: SettlementFormData) => {
    const payload = {
      project_id: data.projectId,
      period: data.period,
      revenue: data.revenue,
      total_labor: data.totalLabor,
      total_expense: data.totalExpense,
      status: data.status,
      note: data.note,
    };

    if (isEdit && editData) {
      updateMutation.mutate(
        {
          id: editData.id,
          data: {
            revenue: data.revenue,
            total_labor: data.totalLabor,
            total_expense: data.totalExpense,
            status: data.status,
            note: data.note,
          },
        },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const revenue = watch('revenue') || 0;
  const totalLabor = watch('totalLabor') || 0;
  const totalExpense = watch('totalExpense') || 0;
  const operatingProfit = revenue - totalLabor - totalExpense;
  const profitRate = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? '정산 수정' : '정산 등록'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectId">프로젝트 *</Label>
            <Select id="projectId" {...register('projectId')} disabled={isEdit}>
              <option value="">프로젝트를 선택하세요</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.project_code})
                </option>
              ))}
            </Select>
            {errors.projectId && (
              <p className="text-sm text-destructive">{errors.projectId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">정산 기간 *</Label>
            <Input id="period" type="month" {...register('period')} disabled={isEdit} />
            {errors.period && (
              <p className="text-sm text-destructive">{errors.period.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="revenue">매출 (원) *</Label>
              <Input
                id="revenue"
                type="number"
                {...register('revenue', { valueAsNumber: true })}
              />
              {errors.revenue && (
                <p className="text-sm text-destructive">{errors.revenue.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalLabor">인건비 (원) *</Label>
              <Input
                id="totalLabor"
                type="number"
                {...register('totalLabor', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalExpense">경비 (원) *</Label>
              <Input
                id="totalExpense"
                type="number"
                {...register('totalExpense', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md text-sm space-y-1">
            <div className="flex justify-between">
              <span>영업이익</span>
              <span className="font-medium">{operatingProfit.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span>이익률</span>
              <span className="font-medium">{profitRate.toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">상태 *</Label>
            <Select id="status" {...register('status')}>
              {Object.entries(SETTLEMENT_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">비고</Label>
            <Textarea id="note" {...register('note')} placeholder="메모 (선택사항)" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
