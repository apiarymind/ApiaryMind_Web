'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastComponentProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastComponent({ toast, onClose }: ToastComponentProps) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'error':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'info':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg animate-slide-in-right ${getStyles()}`}
    >
      {getIcon()}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-white/60 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

let toastCallback: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastCallback = (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { ...toast, id }]);
    };

    return () => {
      toastCallback = null;
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onClose={handleClose} />
        ))}
      </div>
    </>
  );
}

export const toast = {
  success: (message: string, duration = 5000) => {
    if (toastCallback) {
      toastCallback({ type: 'success', message, duration });
    }
  },
  error: (message: string, duration = 5000) => {
    if (toastCallback) {
      toastCallback({ type: 'error', message, duration });
    }
  },
  warning: (message: string, duration = 5000) => {
    if (toastCallback) {
      toastCallback({ type: 'warning', message, duration });
    }
  },
  info: (message: string, duration = 5000) => {
    if (toastCallback) {
      toastCallback({ type: 'info', message, duration });
    }
  },
};
