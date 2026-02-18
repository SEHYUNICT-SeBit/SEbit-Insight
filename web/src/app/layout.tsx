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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
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
