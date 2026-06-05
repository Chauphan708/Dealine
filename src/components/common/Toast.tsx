'use client';

// ============================================
// DeadlineGuard — Common Toast Component & Context
// ============================================

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

// ---- Toast Provider ----
interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const contextValue = useMemo(() => ({ toast, removeToast }), [toast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Container */}
      <div className="toast-container" id="toast-root">
        {toasts.map((item) => (
          <Toast key={item.id} item={item} onClose={() => removeToast(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ---- Single Toast Component ----
interface ToastProps {
  item: ToastItem;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ item, onClose }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'success':
        return <CheckCircle2 size={18} className="toast-icon-success" />;
      case 'error':
        return <AlertCircle size={18} className="toast-icon-error" />;
      case 'warning':
        return <AlertTriangle size={18} className="toast-icon-warning" />;
      case 'info':
      default:
        return <Info size={18} className="toast-icon-info" />;
    }
  };

  return (
    <div className={`toast toast-${item.type}`} id={`toast-${item.id}`}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{item.message}</span>
        <button className="toast-close" onClick={onClose} aria-label="Close alert">
          <X size={16} />
        </button>
      </div>
      <div
        className="toast-progress"
        style={{ animationDuration: `${item.duration || 4000}ms` }}
      ></div>
    </div>
  );
};

export default ToastProvider;
