import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#17120f] text-[#f7f2ea] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#231b17] border border-[#c89d5c]/50 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-700/60 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-bold text-[#fbf7f0]">
                {this.props.fallbackTitle || 'حدث خطأ غير متوقع في الواجهة'}
              </h2>
              <p className="text-xs sm:text-sm text-[#b09e90] leading-relaxed">
                تم احتواء الخطأ لمنع تعطل الصفحة. يمكنك إعادة المحاولة أو العودة للصفحة الرئيسية.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-[11px] text-red-300/90 font-mono text-left overflow-x-auto" dir="ltr">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] font-bold text-xs transition-all shadow-lg cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1c1512] hover:bg-[#2e231e] border border-[#4a382e] text-[#d8cfc4] text-xs font-semibold transition-all cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#c89d5c]" />
                <span>تحديث الصفحة بالكامل</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
