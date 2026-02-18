import type { Staffing } from '@/types/project.types';

export interface CostCalculationResult {
  totalLabor: number;
  totalFreelancer: number;
  totalSubcontract: number;
  totalOther: number;
  totalExpense: number;
  totalCost: number;
  operatingProfit: number;
  profitRate: number;
}

export function calculateCost(
  staffing: Pick<Staffing, 'man_month' | 'monthly_rate'>[],
  freelancerExpenses: { monthlyRate: number; manMonth: number }[],
  subcontractExpenses: { amount: number }[],
  otherExpenses: { amount: number }[],
  contractAmount: number
): CostCalculationResult {
  const totalLabor = staffing.reduce(
    (sum, s) => sum + s.man_month * s.monthly_rate * 10000,
    0
  );
  const totalFreelancer = freelancerExpenses.reduce(
    (sum, f) => sum + f.monthlyRate * f.manMonth * 10000,
    0
  );
  const totalSubcontract = subcontractExpenses.reduce(
    (sum, s) => sum + s.amount,
    0
  );
  const totalOther = otherExpenses.reduce(
    (sum, o) => sum + o.amount,
    0
  );
  const totalExpense = totalFreelancer + totalSubcontract + totalOther;
  const totalCost = totalLabor + totalExpense;
  const operatingProfit = contractAmount - totalCost;
  const profitRate =
    contractAmount > 0 ? (operatingProfit / contractAmount) * 100 : 0;

  return {
    totalLabor,
    totalFreelancer,
    totalSubcontract,
    totalOther,
    totalExpense,
    totalCost,
    operatingProfit,
    profitRate: Math.round(profitRate * 100) / 100,
  };
}

export function calculateStaffingCost(manMonth: number, monthlyRate: number): number {
  return manMonth * monthlyRate * 10000;
}

export function calculateTotalManMonth(
  staffing: Pick<Staffing, 'man_month'>[]
): number {
  return staffing.reduce((sum, s) => sum + s.man_month, 0);
}
