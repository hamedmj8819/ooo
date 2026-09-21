import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/AuthContext';
import { useRealtimeSSE } from './hooks/useRealtimeSSE';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { CadViewerModal } from './components/CadViewerModal';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoadingState } from './components/common/LoadingState';
import { ShieldCheck } from 'lucide-react';
import type { StageEngineeringDoc } from './types';

const CeoPage = lazy(() => import('./features/admin/pages/CeoPage').then((m) => ({ default: m.CeoPage })));
const PlanningPage = lazy(() => import('./features/orders/pages/PlanningPage').then((m) => ({ default: m.PlanningPage })));
const EngineeringPage = lazy(() => import('./features/engineering/pages/EngineeringPage').then((m) => ({ default: m.EngineeringPage })));
const QCPage = lazy(() => import('./features/qc/pages/QCPage').then((m) => ({ default: m.QCPage })));
const ProductionPage = lazy(() => import('./features/production/pages/ProductionPage').then((m) => ({ default: m.ProductionPage })));
const OperatorPage = lazy(() => import('./features/operator/pages/OperatorPage').then((m) => ({ default: m.OperatorPage })));
const WarehousePage = lazy(() => import('./features/warehouse/pages/WarehousePage').then((m) => ({ default: m.WarehousePage })));
const SuperAdminPage = lazy(() => import('./features/admin/pages/SuperAdminPage').then((m) => ({ default: m.SuperAdminPage })));

export default function App() {
  const { currentUser, isAuthLoading, currentUserRole, login, changePassword } = useAuth();

  // Real-time Server-Sent Events (SSE) listener for live notifications and updates
  useRealtimeSSE(Boolean(currentUser));

  // Global CAD 3D / Blueprint Viewer modal state
  const [cadModalData, setCadModalData] = useState<{
    doc: StageEngineeringDoc;
    partName: string;
    orderNumber: string;
  } | null>(null);

  const handleOpenCadViewer = (doc: StageEngineeringDoc, partName: string, orderNumber: string) => {
    setCadModalData({ doc, partName, orderNumber });
  };

  const handleLogin = async (u: string, p: string) => {
    try {
      const user = await login(u, p);
      return { success: true, mustChangePassword: user.mustChangePassword };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'نام کاربری یا کلمه عبور اشتباه است.';
      return { success: false, message: msg };
    }
  };

  if (isAuthLoading) {
    return <LoadingState message="در حال بررسی نشست امن کاربر..." />;
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} onChangePassword={changePassword} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Application Bar */}
      <Header />

      {/* Main Content Area with Protected Routes */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={<LoadingState message="در حال بارگذاری بخش انتخابی..." />}>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ceo"
              element={
                <ProtectedRoute allowedRoles={['ceo', 'super_admin']}>
                  <CeoPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/planning"
              element={
                <ProtectedRoute allowedRoles={['planning', 'super_admin']}>
                  <PlanningPage onOpenCadViewer={handleOpenCadViewer} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/engineering"
              element={
                <ProtectedRoute allowedRoles={['engineering', 'super_admin']}>
                  <EngineeringPage onOpenCadViewer={handleOpenCadViewer} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/qc"
              element={
                <ProtectedRoute allowedRoles={['qc', 'super_admin']}>
                  <QCPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/production"
              element={
                <ProtectedRoute allowedRoles={['production', 'super_admin']}>
                  <ProductionPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/operator"
              element={
                <ProtectedRoute allowedRoles={['operator', 'super_admin']}>
                  <OperatorPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/warehouse"
              element={
                <ProtectedRoute allowedRoles={['warehouse', 'super_admin']}>
                  <WarehousePage />
                </ProtectedRoute>
              }
            />

            {/* Default role-based redirect */}
            <Route
              path="*"
              element={
                currentUserRole === 'super_admin' ? (
                  <Navigate to="/admin" replace />
                ) : currentUserRole === 'ceo' ? (
                  <Navigate to="/ceo" replace />
                ) : currentUserRole === 'planning' ? (
                  <Navigate to="/planning" replace />
                ) : currentUserRole === 'engineering' ? (
                  <Navigate to="/engineering" replace />
                ) : currentUserRole === 'qc' ? (
                  <Navigate to="/qc" replace />
                ) : currentUserRole === 'production' ? (
                  <Navigate to="/production" replace />
                ) : currentUserRole === 'operator' ? (
                  <Navigate to="/operator" replace />
                ) : (
                  <Navigate to="/warehouse" replace />
                )
              }
            />
          </Routes>
        </Suspense>
      </main>

      {/* Global CAD 3D Model & 2D Drawing Modal */}
      {cadModalData && (
        <CadViewerModal
          doc={cadModalData.doc}
          partName={cadModalData.partName}
          orderNumber={cadModalData.orderNumber}
          onClose={() => setCadModalData(null)}
        />
      )}

      {/* Footer & Offline LAN Node Bar */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-3 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-slate-300">
              سامانه یکپارچه مدیریت تولید کارخانه (MES Offline Server)
            </span>
            <span className="text-slate-500">|</span>
            <span>طراحی شده برای خطوط ساخت کمپرسورهای اسکرو و بلوئرهای لوپ</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              شبکه داخلی امن (LAN 100% Offline)
            </span>
            <span className="hidden sm:inline">نسخه ۲.۵ صنعتی</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
