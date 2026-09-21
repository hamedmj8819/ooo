import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  showAlert: (title: string, message: string, variant?: 'info' | 'warning' | 'danger') => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
    isAlertOnly?: boolean;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve,
        isAlertOnly: false,
      });
    });
  }, []);

  const showAlert = useCallback(
    (title: string, message: string, variant: 'info' | 'warning' | 'danger' = 'info'): Promise<void> => {
      return new Promise((resolve) => {
        setModalState({
          isOpen: true,
          options: {
            title,
            message,
            confirmText: 'تایید و متوجه شدم',
            variant,
          },
          resolve: () => resolve(),
          isAlertOnly: true,
        });
      });
    },
    []
  );

  const handleConfirm = () => {
    if (modalState) {
      modalState.resolve(true);
      setModalState(null);
    }
  };

  const handleCancel = () => {
    if (modalState) {
      modalState.resolve(false);
      setModalState(null);
    }
  };

  return (
    <ModalContext.Provider value={{ confirm, showAlert }}>
      {children}
      {modalState?.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          dir="rtl"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`p-3 rounded-xl shrink-0 ${
                  modalState.options.variant === 'danger'
                    ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                    : modalState.options.variant === 'warning'
                    ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                    : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50'
                }`}
              >
                {modalState.options.variant === 'danger' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : modalState.options.variant === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 id="modal-title" className="text-base font-bold text-slate-100">
                  {modalState.options.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                  {modalState.options.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              {!modalState.isAlertOnly && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  {modalState.options.cancelText || 'انصراف'}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-colors ${
                  modalState.options.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
                    : modalState.options.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50'
                    : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/50'
                }`}
                autoFocus
              >
                {modalState.options.confirmText || 'تایید'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useConfirmModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useConfirmModal must be used within a ModalProvider');
  }
  return context;
}
