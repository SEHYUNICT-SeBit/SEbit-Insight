'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { AppLayout } from './AppLayout';
import { Skeleton } from '@/components/ui/skeleton';

const PUBLIC_PATHS = ['/login'];

function LoadingSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex md:flex-col md:w-48 xl:w-60 border-r bg-card p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2 mt-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b bg-card flex items-center px-6">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  // Public paths don't need auth guard
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Not authenticated - redirect handled by UserContext
  // but render nothing while redirect happens
  if (!user) {
    return <LoadingSkeleton />;
  }

  // Authenticated - wrap with AppLayout
  return <AppLayout>{children}</AppLayout>;
}
