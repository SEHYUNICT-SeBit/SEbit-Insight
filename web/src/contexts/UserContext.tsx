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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';
        const response = await fetch(`${baseUrl}/api/auth/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUser({
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            departmentId: data.department_id,
            departmentName: data.department_name,
            position: data.position,
          });
        } else {
          // Auth failure: redirect to login in production
          if (process.env.NODE_ENV !== 'development') {
            window.location.href = '/login';
            return;
          }
          // Dev fallback
          setUser({
            id: 'dev_user',
            email: 'dev@sebit.co.kr',
            name: '개발자',
            role: 'master',
            departmentId: 'SE',
            departmentName: '소프트웨어엔지니어링',
            position: '팀장',
          });
        }
      } catch {
        // API error: use dev fallback only in development
        if (process.env.NODE_ENV === 'development') {
          setUser({
            id: 'dev_user',
            email: 'dev@sebit.co.kr',
            name: '개발자',
            role: 'master',
            departmentId: 'SE',
            departmentName: '소프트웨어엔지니어링',
            position: '팀장',
          });
        } else {
          window.location.href = '/login';
          return;
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';
      await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  // Hierarchical role checks
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
