'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DepartmentBadge } from '@/components/common/DepartmentBadge';
import { useDepartments, useCreateDepartment } from '@/hooks/useMasterData';
import { formatDate } from '@/lib/utils';
import { Plus, Save, Loader2 } from 'lucide-react';

export function DepartmentSettings() {
  const { data: departmentsData, isLoading } = useDepartments();
  const createMutation = useCreateDepartment();
  const departments = departmentsData?.data || [];

  const [showAdd, setShowAdd] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newId || !newName) return;
    createMutation.mutate(
      { id: newId, name: newName },
      {
        onSuccess: () => {
          setShowAdd(false);
          setNewId('');
          setNewName('');
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">부서 관리</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-1" />
          부서 추가
        </Button>
      </CardHeader>
      <CardContent>
        {showAdd && (
          <div className="flex gap-3 mb-4 p-3 border rounded-md bg-muted/50">
            <div className="space-y-1">
              <Label className="text-xs">부서 코드</Label>
              <Input
                className="h-8 w-24"
                placeholder="예: SE"
                value={newId}
                onChange={(e) => setNewId(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs">부서명</Label>
              <Input
                className="h-8"
                placeholder="예: SE 사업부"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={handleAdd} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">코드</TableHead>
              <TableHead>부서명</TableHead>
              <TableHead>등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  등록된 부서가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <DepartmentBadge departmentId={dept.id} />
                  </TableCell>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(dept.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
