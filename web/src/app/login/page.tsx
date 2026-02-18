'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogIn, User, Shield, Users } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleDevLogin = async (email: string, label: string) => {
    setIsLoading(label);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        alert('로그인에 실패했습니다.');
      }
    } catch {
      alert('서버에 연결할 수 없습니다.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleNaverWorksLogin = () => {
    window.location.href = `${BASE_URL}/api/auth/login`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">SE</span>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">SEbit Insight</CardTitle>
            <CardDescription className="mt-2">
              프로젝트 수익성 관리 시스템에 로그인하세요
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Production Login */}
          <Button
            className="w-full h-12 text-base"
            size="lg"
            onClick={handleNaverWorksLogin}
          >
            <LogIn className="h-5 w-5 mr-2" />
            네이버웍스로 로그인
          </Button>

          {/* Dev Login Section - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  개발 모드 로그인
                </span>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleDevLogin('ceo@sehyunict.com', '대표이사')}
                  disabled={isLoading !== null}
                >
                  <Shield className="h-4 w-4 mr-2 text-purple-500" />
                  대표이사 (마스터)
                  <span className="ml-auto text-xs text-muted-foreground">ceo@sehyunict.com</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleDevLogin('hjkim@sehyunict.com', '김혁진')}
                  disabled={isLoading !== null}
                >
                  <Shield className="h-4 w-4 mr-2 text-purple-500" />
                  김혁진 이사 (마스터)
                  <span className="ml-auto text-xs text-muted-foreground">hjkim@sehyunict.com</span>
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                그 외 관리자/매니저/사용자 계정은 로그인 후 권한 관리에서 등록
              </p>

              {isLoading && (
                <p className="text-center text-sm text-muted-foreground">
                  {isLoading} 계정으로 로그인 중...
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
