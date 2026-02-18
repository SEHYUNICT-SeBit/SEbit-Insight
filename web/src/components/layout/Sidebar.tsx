'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FolderKanban, Users, Receipt, Settings, User, Shield } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Badge } from '@/components/ui/badge';

const roleLabels: Record<string, string> = {
  master: '마스터',
  admin: '어드민',
  manager: '매니저',
  user: '사용자',
};

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/projects', label: '프로젝트', icon: FolderKanban },
  { href: '/settlements', label: '정산 관리', icon: Receipt },
  { href: '/settings', label: '마스터 데이터', icon: Settings },
];

const adminNavItems = [
  { href: '/hr', label: '인사정보', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isMaster, isAdmin } = useUser();

  return (
    <aside className="hidden md:flex md:flex-col md:w-48 xl:w-60 border-r bg-card h-screen sticky top-0">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SE</span>
          </div>
          <span className="font-bold text-lg hidden xl:inline">SEbit Insight</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Admin-only: HR menu */}
        {isAdmin && adminNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Master-only: Admin menu */}
        {isMaster && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Shield className="h-4 w-4" />
            <span>권한 관리</span>
          </Link>
        )}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="hidden xl:block">
            <p className="text-sm font-medium">{user?.name || '사용자'}</p>
            <Badge variant="outline" className="text-xs">
              {roleLabels[user?.role || 'user'] || '사용자'}
            </Badge>
          </div>
        </div>
      </div>
    </aside>
  );
}
