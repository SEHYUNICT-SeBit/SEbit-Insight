'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SettlementFilterBar } from '@/components/settlements/SettlementFilterBar';
import { SettlementTable } from '@/components/settlements/SettlementTable';
import { SettlementDialog } from '@/components/settlements/SettlementDialog';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSettlements } from '@/hooks/useSettlements';
import { useUser } from '@/contexts/UserContext';
import type { SettlementFilter, Settlement } from '@/types/settlement.types';

export default function SettlementsPage() {
  const [filter, setFilter] = useState<SettlementFilter>({});
  const { data, isLoading, isError } = useSettlements(filter);
  const { isManager } = useUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Settlement | null>(null);

  const handleCreate = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (settlement: Settlement) => {
    setEditData(settlement);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="정산 관리"
        description="프로젝트별 월별 정산을 관리합니다."
        actions={
          isManager ? (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              정산 등록
            </Button>
          ) : undefined
        }
      />

      <SettlementFilterBar filter={filter} onFilterChange={setFilter} />

      {isLoading ? (
        <TableSkeleton rows={8} cols={9} />
      ) : isError ? (
        <div className="text-center py-12 text-muted-foreground">
          데이터를 불러오는데 실패했습니다.
        </div>
      ) : (
        <SettlementTable
          settlements={data?.data || []}
          onEdit={handleEdit}
          canEdit={isManager}
        />
      )}

      <SettlementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editData={editData}
      />
    </div>
  );
}
