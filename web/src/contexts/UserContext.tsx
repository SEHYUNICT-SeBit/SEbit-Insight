'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'master' | 'admin' | 'manager' | 'user';
  departmentId: string;
  departmentName?: string;
  position?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isMaster: boolean;
  isAdmin: boolean;
  isManager: boolean;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  isMaster: false,
  isAdmin: false,
  isManager: false,
  logout: async () => {},
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('session_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

/** 미인증 시 바로 네이버 웍스 OAuth로 이동 (/login 페이지는 콜백 처리용) */
function redirectToOAuth() {
  if (typeof window === 'undefined') return;
  // /login 페이지에서는 리다이렉트하지 않음 (콜백 토큰 처리 필요)
  if (window.location.pathname === '/login') return;
  window.location.href = `${API_BASE}/api/auth/login`;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      // /login 페이지에서는 인증 체크 생략
      if (window.location.pathname === '/login') {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const result = await response.json();
          const emp = result.data;
          if (emp) {
            setUser({
              id: emp.id,
              email: emp.email,
              name: emp.name,
              role: emp.role,
              departmentId: emp.department_id,
              departmentName: emp.department_name,
              position: emp.position,
            });
          } else {
            redirectToOAuth();
            return;
          }
        } else {
          localStorage.removeItem('session_token');
          redirectToOAuth();
          return;
        }
      } catch {
        localStorage.removeItem('session_token');
        redirectToOAuth();
        return;
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('session_token');
      setUser(null);
      window.location.href = `${API_BASE}/api/auth/login`;
    }
  };

  const isMaster = user?.role === 'master';
  const isAdmin = user?.role === 'master' || user?.role === 'admin';
  const isManager = user?.role === 'master' || user?.role === 'admin' || user?.role === 'manager';

  return (
    <UserContext.Provider value={{ user, isLoading, isMaster, isAdmin, isManager, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
