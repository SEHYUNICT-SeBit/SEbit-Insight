'use client';

import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step2Schema, type Step2FormData } from '@/validations/project';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useClients, useEmployees } from '@/hooks/useMasterData';
import { formatNumber } from '@/lib/utils';
import { Calculator } from 'lucide-react';

interface Step2ContractInfoProps {
  defaultValues?: Partial<Step2FormData>;
  projectType: 'SI' | 'SM';
  onNext: (data: Step2FormData) => void;
  onBack: () => void;
}

function generateMonthOptions(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];
  const [sy, sm] = startDate.split('-').map(Number);
  const [ey, em] = endDate.split('-').map(Number);
  if (!sy || !sm || !ey || !em) return [];
  const months: string[] = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

function generate12Months(startDate: string): string[] {
  if (!startDate) return [];
  const [sy, sm] = startDate.split('-').map(Number);
  if (!sy || !sm) return [];
  const months: string[] = [];
  let y = sy, m = sm;
  for (let i = 0; i < 12; i++) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

const SI_LABELS = ['착수금', '중도금1', '중도금2', '잔금'];

export function Step2ContractInfo({ defaultValues, projectType, onNext, onBack }: Step2ContractInfoProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      contractAmount: defaultValues?.contractAmount || undefined,
      startDate: defaultValues?.startDate || '',
      endDate: defaultValues?.endDate || '',
      clientId: defaultValues?.clientId || '',
      pmType: defaultValues?.pmType || 'employee',
      pmId: defaultValues?.pmId || '',
      pmName: defaultValues?.pmName || '',
      paymentSchedule: defaultValues?.paymentSchedule || undefined,
    },
  });

  const pmType = watch('pmType');
  const contractAmount = watch('contractAmount');
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const [pmSearch, setPmSearch] = useState('');

  const [siAmounts, setSiAmounts] = useState<number[]>(() => {
    if (defaultValues?.paymentSchedule && projectType === 'SI') {
      return SI_LABELS.map((label) => {
        const item = defaultValues.paymentSchedule?.find((p) => p.label === label);
        return item?.amount || 0;
      });
    }
    return [0, 0, 0, 0];
  });
  const [siMonths, setSiMonths] = useState<string[]>(() => {
    if (defaultValues?.paymentSchedule && projectType === 'SI') {
      return SI_LABELS.map((label) => {
        const item = defaultValues.paymentSchedule?.find((p) => p.label === label);
        return item?.period || '';
      });
    }
    return ['', '', '', ''];
  });
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const { data: clientsData } = useClients();
  const { data: employeesData } = useEmployees();
  const clients = clientsData?.data || [];
  const employees = employeesData?.data || [];

  const filteredEmployees = pmSearch
    ? employees.filter((emp) =>
        emp.name.toLowerCase().includes(pmSearch.toLowerCase()) ||
        emp.department_name?.toLowerCase().includes(pmSearch.toLowerCase())
      )
    : employees;

  const monthOptions = useMemo(
    () => generateMonthOptions(startDate?.slice(0, 7) || '', endDate?.slice(0, 7) || ''),
    [startDate, endDate]
  );

  const smSchedule = useMemo(() => {
    if (projectType !== 'SM' || !contractAmount || !startDate) return [];
    const months = generate12Months(startDate.slice(0, 7));
    const perMonth = Math.floor(contractAmount / 12);
    const remainder = contractAmount - perMonth * 11;
    return months.map((month, i) => ({
      label: `${i + 1}월차`,
      period: month,
      amount: i < 11 ? perMonth : remainder,
    }));
  }, [projectType, contractAmount, startDate]);

  const siTotal = siAmounts.reduce((sum, a) => sum + a, 0);

  const autoFillBalance = () => {
    const first3 = siAmounts[0] + siAmounts[1] + siAmounts[2];
    const remaining = (contractAmount || 0) - first3;
    if (remaining >= 0) {
      const next = [...siAmounts];
      next[3] = remaining;
      setSiAmounts(next);
    }
  };

  const onSubmit = (data: Step2FormData) => {
    let schedule: Step2FormData['paymentSchedule'];

    if (projectType === 'SI') {
      const total = siAmounts.reduce((sum, a) => sum + a, 0);
      if (total !== data.contractAmount) {
        setScheduleError(`정산 합계(${formatNumber(total)}원)가 계약금액(${formatNumber(data.contractAmount)}원)과 일치하지 않습니다.`);
        return;
      }
      for (let i = 0; i < 4; i++) {
        if (siAmounts[i] > 0 && !siMonths[i]) {
          setScheduleError(`${SI_LABELS[i]}의 정산 월을 선택해주세요.`);
          return;
        }
      }
      schedule = SI_LABELS
        .map((label, i) => ({ label, period: siMonths[i], amount: siAmounts[i] }))
        .filter((item) => item.amount > 0);
    } else {
      schedule = smSchedule;
    }

    setScheduleError(null);
    onNext({ ...data, paymentSchedule: schedule });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 계약금액 */}
      <div className="space-y-2">
        <Label htmlFor="contractAmount">계약금액 (원) *</Label>
        <Controller
          name="contractAmount"
          control={control}
          render={({ field }) => (
            <Input
              id="contractAmount"
              type="text"
              inputMode="numeric"
              placeholder="숫자만 입력하세요"
              value={field.value ? formatNumber(field.value) : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                field.onChange(raw ? parseInt(raw, 10) : undefined);
              }}
            />
          )}
        />
        {errors.contractAmount && (
          <p className="text-sm text-destructive">{errors.contractAmount.message}</p>
        )}
      </div>

      {/* 시작일/종료일 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">시작일 *</Label>
          <Input id="startDate" type="date" {...register('startDate')} />
          {errors.startDate && (
            <p className="text-sm text-destructive">{errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">종료일 *</Label>
          <Input id="endDate" type="date" {...register('endDate')} />
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* 계약처 */}
      <div className="space-y-2">
        <Label htmlFor="clientId">계약처 *</Label>
        <Select id="clientId" {...register('clientId')}>
          <option value="">계약처를 선택하세요</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </Select>
        {errors.clientId && (
          <p className="text-sm text-destructive">{errors.clientId.message}</p>
        )}
      </div>

      {/* 담당 PM */}
      <div className="space-y-3">
        <Label>담당 PM *</Label>
        <Controller
          name="pmType"
          control={control}
          render={({ field }) => (
            <div className="flex rounded-md border border-input overflow-hidden w-fit">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  field.value === 'employee'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
                onClick={() => field.onChange('employee')}
              >
                정직원
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-input ${
                  field.value === 'freelancer'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
                onClick={() => field.onChange('freelancer')}
              >
                외주개발자
              </button>
            </div>
          )}
        />
        {pmType === 'employee' && (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="이름으로 검색..."
              value={pmSearch}
              onChange={(e) => setPmSearch(e.target.value)}
              className="h-9"
            />
            <Select {...register('pmId')}>
              <option value="">PM을 선택하세요</option>
              {filteredEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.position} - {emp.department_name})
                </option>
              ))}
            </Select>
            {errors.pmId && (
              <p className="text-sm text-destructive">{errors.pmId.message}</p>
            )}
          </div>
        )}
        {pmType === 'freelancer' && (
          <div className="space-y-2">
            <Input {...register('pmName')} placeholder="외주개발자 PM 이름을 입력하세요" />
            {errors.pmName && (
              <p className="text-sm text-destructive">{errors.pmName.message}</p>
            )}
          </div>
        )}
      </div>

      {/* 정산 일정 */}
      {contractAmount > 0 && startDate && (
        <div className="space-y-3 border-t pt-4">
          <Label className="text-base font-semibold">
            정산 일정
            {projectType === 'SM' && (
              <span className="text-xs text-muted-foreground font-normal ml-2">(12개월 자동 분할)</span>
            )}
          </Label>

          {projectType === 'SI' ? (
            <>
              <div className="space-y-2">
                {SI_LABELS.map((label, i) => (
                  <div key={label} className="grid grid-cols-[90px_1fr_1fr] gap-2 items-center">
                    <span className="text-sm font-medium">{label}</span>
                    <Select
                      value={siMonths[i]}
                      onChange={(e) => {
                        const next = [...siMonths];
                        next[i] = e.target.value;
                        setSiMonths(next);
                      }}
                    >
                      <option value="">월 선택</option>
                      {monthOptions.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </Select>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="금액 (원)"
                      value={siAmounts[i] ? formatNumber(siAmounts[i]) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        const next = [...siAmounts];
                        next[i] = raw ? parseInt(raw, 10) : 0;
                        setSiAmounts(next);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <Button type="button" variant="outline" size="sm" onClick={autoFillBalance}>
                  <Calculator className="h-3.5 w-3.5 mr-1" />
                  잔금 자동계산
                </Button>
                <div className="text-right">
                  <span className={siTotal === contractAmount ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                    합계: {formatNumber(siTotal)}원
                  </span>
                  <span className="text-muted-foreground"> / {formatNumber(contractAmount)}원</span>
                  {siTotal === contractAmount && <span className="ml-1 text-green-600">&#10003;</span>}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {smSchedule.map((item) => (
                <div key={item.period} className="grid grid-cols-[70px_1fr_1fr] gap-2 items-center text-sm py-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span>{item.period}</span>
                  <span className="text-right font-medium">{formatNumber(item.amount)}원</span>
                </div>
              ))}
              <div className="border-t pt-2 text-sm text-right font-medium">
                합계: {formatNumber(smSchedule.reduce((sum, s) => sum + s.amount, 0))}원
              </div>
            </div>
          )}

          {scheduleError && (
            <p className="text-sm text-destructive">{scheduleError}</p>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          이전
        </Button>
        <Button type="submit">다음</Button>
      </div>
    </form>
  );
}
