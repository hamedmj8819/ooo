import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { currentUser, currentUserRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUserRole) && currentUserRole !== 'super_admin') {
    return (
      <div className="p-8 text-center text-rose-400 font-bold bg-slate-900 border border-slate-800 rounded-2xl" dir="rtl">
        دسترس‌یابی به این بخش برای نقش «{currentUserRole}» مجاز نمی‌باشد.
      </div>
    );
  }

  return <>{children}</>;
}
