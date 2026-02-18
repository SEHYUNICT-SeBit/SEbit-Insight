import { z } from 'zod';

export const step1Schema = z.object({
  name: z.string().min(2, '2자 이상 입력하세요').max(100, '100자 이하로 입력하세요'),
  type: z.enum(['SI', 'SM'], { required_error: '유형을 선택하세요' }),
  departmentIds: z.array(z.string()).min(1, '부서를 1개 이상 선택해주세요'),
  salesRepId: z.string().min(1, '영업대표를 선택하세요'),
  description: z.string().optional(),
});

export const paymentScheduleItemSchema = z.object({
  label: z.string(),
  period: z.string(),
  amount: z.number().min(0),
});

export const step2Schema = z.object({
  contractAmount: z.number({
    required_error: '계약금액을 입력하세요',
    invalid_type_error: '계약금액을 입력하세요',
  }).positive('계약금액은 0보다 커야 합니다'),
  startDate: z.string().min(1, '시작일을 선택하세요'),
  endDate: z.string().min(1, '종료일을 선택하세요'),
  clientId: z.string().min(1, '계약처를 선택하세요'),
  pmType: z.enum(['employee', 'freelancer']),
  pmId: z.string().optional(),
  pmName: z.string().optional(),
  paymentSchedule: z.array(paymentScheduleItemSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.pmType === 'employee' && (!data.pmId || data.pmId.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'PM을 선택하세요',
      path: ['pmId'],
    });
  }
  if (data.pmType === 'freelancer' && (!data.pmName || data.pmName.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'PM 이름을 입력하세요',
      path: ['pmName'],
    });
  }
});

export const staffingRowSchema = z.object({
  employeeId: z.string().optional(),
  position: z.string().min(1, '등급을 선택하세요'),
  manMonth: z.number().min(0.1, '0.1 이상 입력하세요').max(24, '24 이하로 입력하세요'),
  monthlyRate: z.number().min(0, '단가를 입력하세요'),
  note: z.string().optional(),
});

export const freelancerExpenseSchema = z.object({
  name: z.string().optional(),
  level: z.enum(['특급', '고급', '중급', '초급'], { required_error: '등급을 선택하세요' }),
  monthlyRate: z.number().min(1, '단가를 입력하세요'),
  manMonth: z.number().min(0.01, '0.01 이상 입력하세요').max(24, '24 이하로 입력하세요'),
  note: z.string().optional(),
});

export const subcontractExpenseSchema = z.object({
  companyName: z.string().optional().default(''),
  amount: z.number().min(0).optional().default(0),
  note: z.string().optional(),
});

export const otherExpenseSchema = z.object({
  subcategory: z.enum(
    ['파견비', '차량유지비', '복리후생', '소모품비', '업무추진비', '접대비'],
    { required_error: '분류를 선택하세요' }
  ),
  description: z.string().optional(),
  amount: z.number().min(0).optional().default(0),
  note: z.string().optional(),
});

export const step3Schema = z.object({
  staffing: z.array(staffingRowSchema).min(1, '투입 인력을 1명 이상 입력하세요'),
  freelancerExpenses: z.array(freelancerExpenseSchema).optional().default([]),
  subcontractExpenses: z.array(subcontractExpenseSchema).optional().default([]),
  otherExpenses: z.array(otherExpenseSchema).optional().default([]),
});

export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
export type StaffingRowData = z.infer<typeof staffingRowSchema>;
export type FreelancerExpenseData = z.infer<typeof freelancerExpenseSchema>;
export type SubcontractExpenseData = z.infer<typeof subcontractExpenseSchema>;
export type OtherExpenseData = z.infer<typeof otherExpenseSchema>;
