'use client';

import React, { useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step1Schema, type Step1FormData } from '@/validations/project';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDepartments, useEmployees } from '@/hooks/useMasterData';
import { getDepartmentBgClass } from '@/lib/department-colors';
import { cn } from '@/lib/utils';

interface Step1BasicInfoProps {
  defaultValues?: Partial<Step1FormData>;
  onNext: (data: Step1FormData) => void;
}

export function Step1BasicInfo({ defaultValues, onNext }: Step1BasicInfoProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: '',
      type: 'SI',
      departmentIds: [],
      salesRepId: '',
      description: '',
      ...defaultValues,
    },
  });

  const { data: departmentsData } = useDepartments();
  const { data: employeesData } = useEmployees();

  const departments = departmentsData?.data || [];
  const employees = employeesData?.data || [];

  const toggleDepartment = useCallback(
    (deptId: string, currentIds: string[], onChange: (val: string[]) => void) => {
      const index = currentIds.indexOf(deptId);
      if (index >= 0) {
        // Remove department (but only if more than 0 will remain, validation handles min)
        const next = currentIds.filter((id) => id !== deptId);
        onChange(next);
      } else {
        // Add department
        onChange([...currentIds, deptId]);
      }
    },
    []
  );

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">프로젝트명 *</Label>
        <Input id="name" {...register('name')} placeholder="프로젝트명을 입력하세요" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">유형 *</Label>
        <Select id="type" {...register('type')}>
          <option value="SI">SI (System Integration)</option>
          <option value="SM">SM (System Maintenance)</option>
        </Select>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>협업 부서 * <span className="text-xs text-muted-foreground">(참여하는 부서를 모두 선택하세요)</span></Label>
        <Controller
          name="departmentIds"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => {
                const isSelected = field.value.includes(dept.id);
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => toggleDepartment(dept.id, field.value, field.onChange)}
                    className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-full"
                  >
                    <Badge
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer select-none px-3 py-1.5 text-sm transition-all',
                        isSelected && getDepartmentBgClass(dept.id),
                        isSelected && 'border-0 ring-1 ring-offset-1',
                        !isSelected && 'opacity-60 hover:opacity-100'
                      )}
                    >
                      {dept.name}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.departmentIds && (
          <p className="text-sm text-destructive">{errors.departmentIds.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="salesRepId">영업대표 *</Label>
        <Select id="salesRepId" {...register('salesRepId')}>
          <option value="">영업대표를 선택하세요</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} ({emp.position} - {emp.department_name})
            </option>
          ))}
        </Select>
        {errors.salesRepId && (
          <p className="text-sm text-destructive">{errors.salesRepId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="프로젝트에 대한 설명을 입력하세요 (선택사항)"
          rows={3}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit">다음</Button>
      </div>
    </form>
  );
}
