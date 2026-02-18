import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

export function formatManWon(amount: number): string {
  if (amount >= 10000) {
    return `${formatNumber(Math.round(amount / 10000))}억`;
  }
  return `${formatNumber(amount)}만`;
}

export function formatPercent(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatPeriod(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
}

export function getProfitRateColor(rate: number): string {
  if (rate >= 30) return 'text-green-600';
  if (rate >= 15) return 'text-blue-600';
  if (rate >= 0) return 'text-yellow-600';
  return 'text-red-600';
}

export function getProfitRateLabel(rate: number): string {
  if (rate >= 30) return '우수';
  if (rate >= 15) return '양호';
  if (rate >= 0) return '주의';
  return '손실';
}

export function getProfitRateBgColor(rate: number): string {
  if (rate >= 30) return 'bg-green-100 text-green-700';
  if (rate >= 15) return 'bg-blue-100 text-blue-700';
  if (rate >= 0) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}
