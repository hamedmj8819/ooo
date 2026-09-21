import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-400 mb-4">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h1 className="text-lg font-bold text-slate-100 mb-2">خطای غیرمنتظره رخ داده است</h1>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              یک خطای غیرمنتظره در رندر صفحه یا اجرای کامپوننت رخ داده است.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 mb-6 text-right font-mono text-[11px] text-rose-300 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-950/50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              بارگذاری مجدد صفحه
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
