'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRateCards } from '@/hooks/useMasterData';

export function RateCardSettings() {
  const { data: rateCardsData, isLoading } = useRateCards();
  const rateCards = rateCardsData?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">직급별 단가 기준표</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>직급</TableHead>
              <TableHead className="text-right">월단가 (만원)</TableHead>
              <TableHead>기본값</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : rateCards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  단가 기준표가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              rateCards.map((rc) => (
                <TableRow key={rc.id}>
                  <TableCell className="font-medium">{rc.position}</TableCell>
                  <TableCell className="text-right font-mono">
                    {rc.monthly_rate.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {rc.is_default ? (
                      <Badge variant="default" className="text-xs">
                        기본값
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        커스텀
                      </Badge>
                    )}
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
