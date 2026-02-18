'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useDepartments } from '@/hooks/useMasterData';
import type { SettlementFilter } from '@/types/settlement.types';
import { SETTLEMENT_STATUS_LABELS, type SettlementStatus } from '@/types/settlement.types';

interface SettlementFilterBarProps {
  filter: SettlementFilter;
  onFilterChange: (filter: SettlementFilter) => void;
}

export function SettlementFilterBar({ filter, onFilterChange }: SettlementFilterBarProps) {
  const handleReset = () => {
    onFilterChange({});
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1 max-w-xs">
        <Input
          type="month"
          value={filter.period || ''}
          onChange={(e) =>
            onFilterChange({ ...filter, period: e.target.value || undefined, page: 1 })
          }
          className="w-full"
        />
      </div>

      <Select
        value={filter.status || ''}
        onValueChange={(value) =>
          onFilterChange({
            ...filter,
            status: (value as SettlementStatus) || undefined,
            page: 1,
          })
        }
      >
        <option value="">전체 상태</option>
        {Object.entries(SETTLEMENT_STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Select>

      <Button variant="ghost" size="icon" onClick={handleReset} title="필터 초기화">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
