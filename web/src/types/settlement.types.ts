export type SettlementStatus = 'pending' | 'completed' | 'on_hold';

export interface Settlement {
  id: string;
  project_id: string;
  project_name: string;
  period: string;
  revenue: number;
  total_labor: number;
  total_expense: number;
  operating_profit: number;
  profit_rate: number;
  status: SettlementStatus;
  note?: string;
  created_at: string;
  updated_at?: string;
}

export interface SettlementFilter {
  project_id?: string;
  period?: string;
  status?: SettlementStatus;
  page?: number;
  limit?: number;
}

export interface SettlementCreateRequest {
  project_id: string;
  period: string;
  revenue: number;
  total_labor: number;
  total_expense: number;
  status: SettlementStatus;
  note?: string;
}

export interface SettlementUpdateRequest {
  revenue?: number;
  total_labor?: number;
  total_expense?: number;
  status?: SettlementStatus;
  note?: string;
}

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  pending: '대기',
  completed: '완료',
  on_hold: '보류',
};

export const SETTLEMENT_STATUS_VARIANTS: Record<SettlementStatus, 'outline' | 'default' | 'secondary'> = {
  pending: 'outline',
  completed: 'default',
  on_hold: 'secondary',
};
