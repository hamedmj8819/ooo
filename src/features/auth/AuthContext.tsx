import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { SystemUser, UserRole } from '../../types';

interface AuthContextType {
  currentUser: SystemUser | null;
  currentUserRole: UserRole;
  isAuthLoading: boolean;
  setCurrentUserRole: (role: UserRole) => void;
  login: (username: string, password: string) => Promise<SystemUser>;
  changePassword: (oldPw: string, newPw: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: currentUser = null,
    isLoading: isAuthLoading,
  } = useQuery<SystemUser | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await api.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 60000,
  });

  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);

  const currentUserRole: UserRole =
    currentUser?.role === 'super_admin' && roleOverride
      ? roleOverride
      : (currentUser?.role || 'super_admin');

  const setCurrentUserRole = useCallback(
    (role: UserRole) => {
      if (currentUser?.role === 'super_admin') {
        setRoleOverride(role);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.setQueryData(['auth', 'me'], null);
    };

    window.addEventListener('mes:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('mes:unauthorized', handleUnauthorized);
    };
  }, [queryClient]);

  const login = useCallback(
    async (u: string, p: string) => {
      const user = await api.auth.login(u, p);
      queryClient.setQueryData(['auth', 'me'], user);
      queryClient.invalidateQueries();
      return user;
    },
    [queryClient]
  );

  const changePassword = useCallback(async (oldPw: string, newPw: string) => {
    try {
      await api.auth.changePassword(oldPw, newPw);
      return { success: true, message: 'کلمه عبور با موفقیت تغییر یافت.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در تغییر کلمه عبور';
      return { success: false, message: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentUserRole,
        isAuthLoading,
        setCurrentUserRole,
        login,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
