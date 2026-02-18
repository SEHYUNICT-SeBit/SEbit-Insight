'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClients, useCreateClient } from '@/hooks/useMasterData';
import { Plus, Save, Loader2, Search } from 'lucide-react';

export function ClientSettings() {
  const [search, setSearch] = useState('');
  const { data: clientsData, isLoading } = useClients(search || undefined);
  const createMutation = useCreateClient();
  const clients = clientsData?.data || [];

  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    business_no: '',
    contact: '',
    phone: '',
  });

  const handleAdd = () => {
    if (!newClient.name) return;
    createMutation.mutate(newClient, {
      onSuccess: () => {
        setShowAdd(false);
        setNewClient({ name: '', business_no: '', contact: '', phone: '' });
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">계약처 관리</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-1" />
          계약처 추가
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="회사명/담당자 검색"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {showAdd && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 border rounded-md bg-muted/50">
            <div className="space-y-1">
              <Label className="text-xs">회사명 *</Label>
              <Input
                className="h-8"
                placeholder="회사명"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">사업자번호</Label>
              <Input
                className="h-8"
                placeholder="000-00-00000"
                value={newClient.business_no}
                onChange={(e) => setNewClient({ ...newClient, business_no: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">담당자</Label>
              <Input
                className="h-8"
                placeholder="담당자명"
                value={newClient.contact}
                onChange={(e) => setNewClient({ ...newClient, contact: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">전화번호</Label>
              <div className="flex gap-1">
                <Input
                  className="h-8"
                  placeholder="02-0000-0000"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
                <Button size="sm" className="h-8" onClick={handleAdd} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>회사명</TableHead>
              <TableHead>사업자번호</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>전화번호</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  등록된 계약처가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {client.business_no || '-'}
                  </TableCell>
                  <TableCell>{client.contact || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{client.phone || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
