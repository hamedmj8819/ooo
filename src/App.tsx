import React, { useState } from 'react';
import { useMESStore } from './data/store';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { CeoView } from './components/RoleViews/CeoView';
import { PlanningView } from './components/RoleViews/PlanningView';
import { EngineeringView } from './components/RoleViews/EngineeringView';
import { ProductionView } from './components/RoleViews/ProductionView';
import { OperatorView } from './components/RoleViews/OperatorView';
import { SuperAdminView } from './components/RoleViews/SuperAdminView';
import { WarehouseView } from './components/RoleViews/WarehouseView';
import { QCView } from './components/RoleViews/QCView';
import { CadViewerModal } from './components/CadViewerModal';
import { StageEngineeringDoc } from './types';
import { WifiOff, Server, HardDrive, ShieldCheck } from 'lucide-react';

export default function App() {
  const store = useMESStore();

  // State for Global CAD 3D / Blueprint Viewer modal
  const [cadModalData, setCadModalData] = useState<{
    doc: StageEngineeringDoc;
    partName: string;
    orderNumber: string;
  } | null>(null);

  const handleOpenCadViewer = (doc: StageEngineeringDoc, partName: string, orderNumber: string) => {
    setCadModalData({ doc, partName, orderNumber });
  };

  // If user is not authenticated, show full-screen login screen
  if (!store.currentUser) {
    return (
      <LoginScreen
        users={store.users}
        onLogin={store.login}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Top Application Bar */}
      <Header
        currentRole={store.currentUserRole}
        onRoleChange={store.setCurrentUserRole}
        currentUser={store.currentUser}
        onLogout={store.logout}
        notifications={store.notifications}
        onMarkNotificationAsRead={store.markNotificationAsRead}
        onMarkAllNotificationsAsRead={store.markAllNotificationsAsRead}
        onExportJson={store.exportDatabase}
        onImportJson={store.importDatabase}
        onResetDefaults={store.resetFactoryData}
      />

      {/* Main Role Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {store.currentUserRole === 'super_admin' && (
          <SuperAdminView
            models={store.models}
            machines={store.machines}
            parts={store.parts}
            foundries={store.foundries}
            operators={store.operators}
            users={store.users}
            onAddModel={store.addModel}
            onAddMachine={store.addMachine}
            onAddFoundry={store.addFoundry}
            onAddPart={store.addPart}
            onAddOperator={store.addOperator}
            onAddUser={store.addUser}
            onUpdateUser={store.updateUser}
            onDeleteUser={store.deleteUser}
            onExportDatabase={store.exportDatabase}
            onImportDatabase={store.importDatabase}
            onResetFactoryData={store.resetFactoryData}
          />
        )}

        {store.currentUserRole === 'ceo' && (
          <CeoView
            models={store.models}
            parts={store.parts}
            orders={store.orders}
            machines={store.machines}
            onCreateOrder={store.createOrder}
            onDecideQuote={store.decideQuote}
            onOpenCadViewer={handleOpenCadViewer}
          />
        )}

        {store.currentUserRole === 'planning' && (
          <PlanningView
            orders={store.orders}
            machines={store.machines}
            foundries={store.foundries}
            models={store.models}
            parts={store.parts}
            onAddQuote={store.addQuoteToOrder}
            onMaterialReceivedAndIssuePO={store.markMaterialReceivedAndIssuePO}
            onCreateOrder={store.createOrder}
            onOpenCadViewer={handleOpenCadViewer}
            onReportBreakdown={store.reportMachineBreakdown}
            onResolveBreakdown={store.resolveMachineBreakdown}
            onHandoverToWarehouse={store.handoverToWarehouse}
          />
        )}

        {store.currentUserRole === 'engineering' && (
          <EngineeringView
            orders={store.orders}
            models={store.models}
            parts={store.parts}
            machines={store.machines}
            onUploadDoc={store.uploadEngineeringDoc}
            onUpdatePartStageDrawings={store.updatePartStageDrawings}
            onUpdatePartMasterDrawings={store.updatePartMasterDrawings}
            onOpenCadViewer={handleOpenCadViewer}
            onApproveQC={store.approveStageByEngineering}
            onRejectQC={store.rejectStageByEngineering}
          />
        )}

        {store.currentUserRole === 'qc' && (
          <QCView
            orders={store.orders}
            machines={store.machines}
            parts={store.parts}
            onSubmitStageQC={store.submitStageQCReport}
            onOpenCadViewer={handleOpenCadViewer}
          />
        )}

        {store.currentUserRole === 'production' && (
          <ProductionView
            orders={store.orders}
            machines={store.machines}
            operators={store.operators}
            onAssignStage={store.assignStageToMachine}
            onReportBreakdown={store.reportMachineBreakdown}
            onResolveBreakdown={store.resolveMachineBreakdown}
            onApproveQC={store.approveStageQC}
            onHandoverWarehouse={store.handoverToWarehouse}
          />
        )}

        {store.currentUserRole === 'operator' && (
          <OperatorView
            machines={store.machines}
            operators={store.operators}
            orders={store.orders}
            onFinishStage={store.finishStage}
            onReportBreakdown={store.reportMachineBreakdown}
            onResolveBreakdown={store.resolveMachineBreakdown}
            onOpenCadViewer={handleOpenCadViewer}
          />
        )}

        {store.currentUserRole === 'warehouse' && (
          <WarehouseView
            inventory={store.inventory}
            orders={store.orders}
            onHandoverReceipt={store.handoverToWarehouse}
          />
        )}

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
