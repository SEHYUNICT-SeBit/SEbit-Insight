'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LayoutDashboard, FolderKanban, Receipt, Settings, LogOut, Shield, Sun, Moon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  master: '마스터',
  admin: '어드민',
  manager: '매니저',
  user: '사용자',
};

const roleBadgeColors: Record<string, string> = {
  master: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  admin: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  manager: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  user: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700',
};

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/projects', label: '프로젝트', icon: FolderKanban },
  { href: '/settlements', label: '정산 관리', icon: Receipt },
  { href: '/settings', label: '마스터 데이터', icon: Settings },
];

const pageNames: Record<string, string> = {
  '/': '대시보드',
  '/projects': '프로젝트',
  '/projects/new': '프로젝트 등록',
  '/settlements': '정산 관리',
  '/settings': '마스터 데이터',
  '/admin': '권한 관리',
  '/hr': '인사정보',
  '/login': '로그인',
};

function getPageName(pathname: string): string {
  if (pageNames[pathname]) return pageNames[pathname];
  if (pathname.match(/^\/projects\/[^/]+\/cost$/)) return '원가 분석';
  if (pathname.match(/^\/projects\/[^/]+$/)) return '프로젝트 상세';
  return '페이지';
}

const THEME_KEY = 'sebit-theme';

export function Header() {
  const pathname = usePathname();
  const { user, isMaster, isAdmin, logout } = useUser();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  const pageName = getPageName(pathname);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSheetOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{pageName}</h1>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {user?.name || '사용자'}
        </span>
        <Badge
          variant="outline"
          className={cn(roleBadgeColors[user?.role || 'user'])}
        >
          {roleLabels[user?.role || 'user'] || '사용자'}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={dark ? '라이트 모드' : '다크 모드'}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="로그아웃"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>SEbit Insight</SheetTitle>
          </SheetHeader>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
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

            {/* Admin: HR menu in mobile nav */}
            {isAdmin && (
              <Link
                href="/hr"
                onClick={() => setSheetOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith('/hr')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Users className="h-4 w-4" />
                <span>인사정보</span>
              </Link>
            )}

            {/* Master-only: Admin menu in mobile nav */}
            {isMaster && (
              <Link
                href="/admin"
                onClick={() => setSheetOpen(false)}
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
        </SheetContent>
      </Sheet>
    </header>
  );
}
