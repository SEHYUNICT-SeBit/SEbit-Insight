'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogIn, Shield, AlertCircle } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: '인증 코드가 누락되었습니다. 다시 시도해주세요.',
  oauth_not_configured: '네이버 웍스 연동이 설정되지 않았습니다.',
  token_exchange_failed: '네이버 웍스 인증에 실패했습니다. 다시 시도해주세요.',
  profile_fetch_failed: '네이버 웍스 프로필 조회에 실패했습니다.',
  internal_error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

function LoginContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // URL 파라미터 처리: session_token 또는 error
  useEffect(() => {
    const sessionToken = searchParams.get('session_token');
    const errorParam = searchParams.get('error');

    if (sessionToken) {
      // OAuth 콜백에서 받은 세션 토큰을 localStorage에 저장
      localStorage.setItem('session_token', sessionToken);
      // URL에서 토큰 제거 후 홈으로 이동
      window.location.href = '/';
      return;
    }

    if (errorParam) {
      setError(ERROR_MESSAGES[errorParam] || `로그인 오류: ${errorParam}`);
    }
  }, [searchParams]);

  const handleDevLogin = async (email: string, label: string) => {
    setIsLoading(label);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const result = await response.json();
        // session_id를 localStorage에 저장 (크로스 도메인 쿠키 fallback)
        if (result.session_id) {
          localStorage.setItem('session_token', result.session_id);
        }
        window.location.href = '/';
      } else {
        const errData = await response.json().catch(() => null);
        setError(errData?.message || '로그인에 실패했습니다.');
      }
    } catch {
      setError('서버에 연결할 수 없습니다.');
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
          {/* 에러 메시지 표시 */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 네이버 웍스 로그인 */}
          <Button
            className="w-full h-12 text-base"
            size="lg"
            onClick={handleNaverWorksLogin}
          >
            <LogIn className="h-5 w-5 mr-2" />
            네이버웍스로 로그인
          </Button>

          {/* 개발용 로그인 - API ENVIRONMENT가 development일 때만 작동 (항상 표시) */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              개발용 로그인
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
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
