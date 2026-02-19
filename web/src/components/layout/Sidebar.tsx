'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderKanban, Users, Receipt, Settings,
  User, Shield, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

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

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, isMaster, isAdmin } = useUser();

  const NavLink = ({ href, label, icon: Icon, isActive }: {
    href: string; label: string; icon: React.ElementType; isActive: boolean;
  }) => {
    const link = (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>{label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'hidden md:flex md:flex-col border-r bg-card h-screen sticky top-0 transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Header */}
        <div className={cn('p-4 border-b', collapsed && 'px-3')}>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">SE</span>
            </div>
            {!collapsed && (
              <span className="font-bold text-lg whitespace-nowrap">SEbit Insight</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 p-4 space-y-1', collapsed && 'px-2')}>
          {navItems.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <NavLink key={item.href} {...item} isActive={isActive} />
            );
          })}

          {isAdmin && adminNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <NavLink key={item.href} {...item} isActive={isActive} />
            );
          })}

          {isMaster && (
            <NavLink
              href="/admin"
              label="권한 관리"
              icon={Shield}
              isActive={pathname.startsWith('/admin')}
            />
          )}
        </nav>

        {/* User Profile */}
        <div className={cn('p-4 border-t', collapsed && 'px-2')}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {user?.name || '사용자'} ({roleLabels[user?.role || 'user']})
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || '사용자'}</p>
                <Badge variant="outline" className="text-xs">
                  {roleLabels[user?.role || 'user'] || '사용자'}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <div className={cn('p-2 border-t', collapsed && 'px-2')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn('w-full', collapsed ? 'px-0 justify-center' : 'justify-start gap-2')}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs text-muted-foreground">메뉴 접기</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
