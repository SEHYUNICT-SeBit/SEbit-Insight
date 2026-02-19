'use client';

import React from 'react';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider } from '@/contexts/UserContext';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// 다크모드 초기화 (페이지 로드 시 깜빡임 방지)
const themeInitScript = `
(function(){
  var t=localStorage.getItem('sebit-theme');
  if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            <AuthGuard>{children}</AuthGuard>
            <Toaster />
          </UserProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
