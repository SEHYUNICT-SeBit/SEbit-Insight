import { z } from 'zod';

export const settlementSchema = z.object({
  projectId: z.string().min(1, '프로젝트를 선택하세요'),
  period: z.string().min(1, '정산 기간을 입력하세요').regex(/^\d{4}-\d{2}$/, 'YYYY-MM 형식으로 입력하세요'),
  revenue: z.number({ required_error: '매출액을 입력하세요' }).min(0, '매출액은 0 이상이어야 합니다'),
  totalLabor: z.number({ required_error: '인건비를 입력하세요' }).min(0, '인건비는 0 이상이어야 합니다'),
  totalExpense: z.number({ required_error: '경비를 입력하세요' }).min(0, '경비는 0 이상이어야 합니다'),
  status: z.enum(['pending', 'completed', 'on_hold'], { required_error: '상태를 선택하세요' }),
  note: z.string().optional(),
});

export type SettlementFormData = z.infer<typeof settlementSchema>;
