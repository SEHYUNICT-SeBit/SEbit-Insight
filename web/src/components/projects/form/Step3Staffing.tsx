'use client';

import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step3Schema, type Step3FormData } from '@/validations/project';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRateCards, useEmployees, useDepartments } from '@/hooks/useMasterData';
import { calculateStaffingCost } from '@/lib/cost-calculator';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Users, ChevronDown, ChevronUp, Search } from 'lucide-react';
import type { Employee } from '@/types/master.types';

interface Step3StaffingProps {
  defaultValues?: Partial<Step3FormData>;
  onNext: (data: Step3FormData) => void;
  onBack: () => void;
}

export function Step3Staffing({ defaultValues, onNext, onBack }: Step3StaffingProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      staffing: defaultValues?.staffing || [
        { position: '', manMonth: 1, monthlyRate: 0, employeeId: '', note: '' },
      ],
      freelancerExpenses: defaultValues?.freelancerExpenses || [],
      subcontractExpenses: defaultValues?.subcontractExpenses || [],
      otherExpenses: defaultValues?.otherExpenses || [],
    },
  });

  const {
    fields: staffingFields,
    append: appendStaffing,
    remove: removeStaffing,
  } = useFieldArray({ control, name: 'staffing' });

  const {
    fields: freelancerFields,
    append: appendFreelancer,
    remove: removeFreelancer,
  } = useFieldArray({ control, name: 'freelancerExpenses' });

  const {
    fields: subcontractFields,
    append: appendSubcontract,
    remove: removeSubcontract,
  } = useFieldArray({ control, name: 'subcontractExpenses' });

  const {
    fields: otherFields,
    append: appendOther,
    remove: removeOther,
  } = useFieldArray({ control, name: 'otherExpenses' });

  const { data: rateCardsData } = useRateCards();
  const { data: employeesData } = useEmployees();
  const { data: departmentsData } = useDepartments();

  const rateCards = rateCardsData?.data || [];
  const employees = employeesData?.data || [];
  const departments = departmentsData?.data || [];
  const watchStaffing = watch('staffing');
  const watchFreelancer = watch('freelancerExpenses');
  const watchSubcontract = watch('subcontractExpenses');
  const watchOther = watch('otherExpenses');

  // Rate card panel toggle
  const [showRateCard, setShowRateCard] = useState(false);

  // Employee select modal state
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [empModalTargetIndex, setEmpModalTargetIndex] = useState<number | null>(null);
  const [empSearch, setEmpSearch] = useState('');

  const handlePositionChange = (index: number, position: string) => {
    const rateCard = rateCards.find((rc) => rc.position === position);
    if (rateCard) {
      setValue(`staffing.${index}.monthlyRate`, rateCard.monthly_rate);
    }
  };

  // Group employees by department for the modal
  const employeesByDept = useMemo(() => {
    const filtered = empSearch
      ? employees.filter(
          (emp) =>
            emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
            emp.department_name?.toLowerCase().includes(empSearch.toLowerCase()) ||
            emp.position?.toLowerCase().includes(empSearch.toLowerCase())
        )
      : employees;

    const grouped: Record<string, { deptName: string; employees: Employee[] }> = {};
    for (const emp of filtered) {
      const deptId = emp.department_id;
      if (!grouped[deptId]) {
        grouped[deptId] = {
          deptName: emp.department_name || deptId,
          employees: [],
        };
      }
      grouped[deptId].employees.push(emp);
    }
    const deptOrder = departments.map((d) => d.id);
    return Object.entries(grouped).sort(([a], [b]) => {
      const ia = deptOrder.indexOf(a);
      const ib = deptOrder.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [employees, departments, empSearch]);

  const openEmployeeModal = (index: number) => {
    setEmpModalTargetIndex(index);
    setEmpSearch('');
    setEmpModalOpen(true);
  };

  const selectEmployee = (emp: Employee) => {
    if (empModalTargetIndex !== null) {
      setValue(`staffing.${empModalTargetIndex}.employeeId`, emp.id);
    }
    setEmpModalOpen(false);
  };

  const getEmployeeName = (employeeId?: string) => {
    if (!employeeId) return '';
    return employees.find((e) => e.id === employeeId)?.name || '';
  };

  const totalStaffingCost = watchStaffing?.reduce(
    (sum, s) => sum + calculateStaffingCost(s.manMonth || 0, s.monthlyRate || 0),
    0
  ) || 0;

  const totalFreelancerCost = watchFreelancer?.reduce(
    (sum, f) => sum + calculateStaffingCost(f.manMonth || 0, f.monthlyRate || 0),
    0
  ) || 0;

  const totalSubcontractCost = watchSubcontract?.reduce(
    (sum, s) => sum + (s.amount || 0),
    0
  ) || 0;

  const totalOtherCost = watchOther?.reduce(
    (sum, o) => sum + (o.amount || 0),
    0
  ) || 0;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-8">
      {/* ==================== 등급별 단가표 참조 패널 ==================== */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
          onClick={() => setShowRateCard(!showRateCard)}
        >
          <span>등급별 단가표</span>
          {showRateCard ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {showRateCard && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-3">
              {[...rateCards].sort((a, b) => b.monthly_rate - a.monthly_rate).map((rc) => (
                <div
                  key={rc.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm"
                >
                  <span className="font-medium">{rc.position}</span>
                  <span className="text-muted-foreground">
                    {rc.monthly_rate.toLocaleString()}만원
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================== 1. 실투입인력 ==================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-semibold">실투입인력</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendStaffing({ position: '', manMonth: 1, monthlyRate: 0, employeeId: '', note: '' })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            인력 추가
          </Button>
        </div>

        {errors.staffing?.root && (
          <p className="text-sm text-destructive mb-2">{errors.staffing.root.message}</p>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>담당자</TableHead>
              <TableHead>등급</TableHead>
              <TableHead className="w-[100px]">M/M</TableHead>
              <TableHead className="w-[120px]">단가(만원/월)</TableHead>
              <TableHead className="w-[130px] text-right">소계</TableHead>
              <TableHead>비고</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffingFields.map((field, index) => {
              const manMonth = watchStaffing?.[index]?.manMonth || 0;
              const monthlyRate = watchStaffing?.[index]?.monthlyRate || 0;
              const subtotal = calculateStaffingCost(manMonth, monthlyRate);
              const empName = getEmployeeName(watchStaffing?.[index]?.employeeId);

              return (
                <TableRow key={field.id}>
                  <TableCell>
                    <input type="hidden" {...register(`staffing.${index}.employeeId`)} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs w-full justify-start font-normal"
                      onClick={() => openEmployeeModal(index)}
                    >
                      <Users className="h-3 w-3 mr-1.5 shrink-0 text-muted-foreground" />
                      {empName || <span className="text-muted-foreground">담당자 선택</span>}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Select
                      {...register(`staffing.${index}.position`)}
                      className="h-8 text-xs"
                      onChange={(e) => {
                        register(`staffing.${index}.position`).onChange(e);
                        handlePositionChange(index, e.target.value);
                      }}
                    >
                      <option value="">등급 선택</option>
                      {[...rateCards].sort((a, b) => b.monthly_rate - a.monthly_rate).map((rc) => (
                        <option key={rc.id} value={rc.position}>
                          {rc.position} ({rc.monthly_rate.toLocaleString()}만원)
                        </option>
                      ))}
                    </Select>
                    {errors.staffing?.[index]?.position && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.staffing[index]?.position?.message}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8 text-xs"
                      {...register(`staffing.${index}.manMonth`, { valueAsNumber: true })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      {...register(`staffing.${index}.monthlyRate`, { valueAsNumber: true })}
                    />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatCurrency(subtotal)}
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-xs"
                      {...register(`staffing.${index}.note`)}
                      placeholder="비고"
                    />
                  </TableCell>
                  <TableCell>
                    {staffingFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeStaffing(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="text-right mt-2">
          <span className="text-sm text-muted-foreground">인건비 합계: </span>
          <span className="font-semibold">{formatCurrency(totalStaffingCost)}</span>
        </div>
      </div>

      {/* ==================== 조직 인력 선택 모달 ==================== */}
      <Dialog open={empModalOpen} onOpenChange={setEmpModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>조직 인력 선택</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="이름, 부서, 직급으로 검색..."
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto flex-1 -mx-6 px-6 space-y-4">
            {employeesByDept.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                검색 결과가 없습니다.
              </p>
            )}
            {employeesByDept.map(([deptId, group]) => (
              <div key={deptId}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {group.deptName}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{group.employees.length}명</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {group.employees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 rounded-md border text-left text-sm hover:bg-muted/70 transition-colors"
                      onClick={() => selectEmployee(emp)}
                    >
                      <span className="font-medium">{emp.name}</span>
                      <span className="text-xs text-muted-foreground">{emp.position}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== 2. 외주 인력 (프리랜서) ==================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-semibold">외주 인력 (프리랜서)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendFreelancer({ name: '', level: '중급', monthlyRate: 0, manMonth: 1, note: '' })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            프리랜서 추가
          </Button>
        </div>

        {freelancerFields.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>등급</TableHead>
                <TableHead className="w-[100px]">M/M</TableHead>
                <TableHead className="w-[120px]">단가(만원/월)</TableHead>
                <TableHead className="w-[130px] text-right">소계</TableHead>
                <TableHead>비고</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {freelancerFields.map((field, index) => {
                const manMonth = watchFreelancer?.[index]?.manMonth || 0;
                const monthlyRate = watchFreelancer?.[index]?.monthlyRate || 0;
                const subtotal = calculateStaffingCost(manMonth, monthlyRate);

                return (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Input
                        className="h-8 text-xs"
                        {...register(`freelancerExpenses.${index}.name`)}
                        placeholder="이름"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        {...register(`freelancerExpenses.${index}.level`)}
                        className="h-8 text-xs"
                      >
                        <option value="특급">특급</option>
                        <option value="고급">고급</option>
                        <option value="중급">중급</option>
                        <option value="초급">초급</option>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 text-xs"
                        {...register(`freelancerExpenses.${index}.manMonth`, { valueAsNumber: true })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        placeholder="직접 입력"
                        {...register(`freelancerExpenses.${index}.monthlyRate`, { valueAsNumber: true })}
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(subtotal)}
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-xs"
                        {...register(`freelancerExpenses.${index}.note`)}
                        placeholder="비고"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFreelancer(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {freelancerFields.length > 0 && (
          <div className="text-right mt-2">
            <span className="text-sm text-muted-foreground">외주 인력비 합계: </span>
            <span className="font-semibold">{formatCurrency(totalFreelancerCost)}</span>
          </div>
        )}
      </div>

      {/* ==================== 3. 업체외주비 ==================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-semibold">업체외주비</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendSubcontract({ companyName: '', amount: 0, note: '' })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            업체 추가
          </Button>
        </div>

        {subcontractFields.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>업체명</TableHead>
                <TableHead className="w-[160px]">계약 금액 (원)</TableHead>
                <TableHead>비고</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subcontractFields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Input
                      className="h-8 text-xs"
                      {...register(`subcontractExpenses.${index}.companyName`)}
                      placeholder="업체명"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      {...register(`subcontractExpenses.${index}.amount`, { valueAsNumber: true })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-xs"
                      {...register(`subcontractExpenses.${index}.note`)}
                      placeholder="비고"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeSubcontract(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {subcontractFields.length > 0 && (
          <div className="text-right mt-2">
            <span className="text-sm text-muted-foreground">업체외주비 합계: </span>
            <span className="font-semibold">{formatCurrency(totalSubcontractCost)}</span>
          </div>
        )}
      </div>

      {/* ==================== 4. 기타경비 ==================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-semibold">기타경비</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendOther({ subcategory: '파견비', description: '', amount: 0, note: '' })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            경비 추가
          </Button>
        </div>

        {otherFields.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>분류</TableHead>
                <TableHead>내역</TableHead>
                <TableHead className="w-[140px]">금액 (원)</TableHead>
                <TableHead>비고</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {otherFields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Select
                      {...register(`otherExpenses.${index}.subcategory`)}
                      className="h-8 text-xs"
                    >
                      <option value="파견비">파견비</option>
                      <option value="차량유지비">차량유지비</option>
                      <option value="복리후생">복리후생</option>
                      <option value="소모품비">소모품비</option>
                      <option value="업무추진비">업무추진비</option>
                      <option value="접대비">접대비</option>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-xs"
                      {...register(`otherExpenses.${index}.description`)}
                      placeholder="내역"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      {...register(`otherExpenses.${index}.amount`, { valueAsNumber: true })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-xs"
                      {...register(`otherExpenses.${index}.note`)}
                      placeholder="비고"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeOther(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {otherFields.length > 0 && (
          <div className="text-right mt-2">
            <span className="text-sm text-muted-foreground">기타경비 합계: </span>
            <span className="font-semibold">{formatCurrency(totalOtherCost)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          이전
        </Button>
        <Button type="submit">다음</Button>
      </div>
    </form>
  );
}
