'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

let toastIdCounter = 0;
const toastListeners: Array<(toast: Toast) => void> = [];

export function showToast(type: Toast['type'], title: string, message: string) {
  const toast: Toast = {
    id: `toast-${toastIdCounter++}`,
    type,
    title,
    message,
  };

  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    };

    toastListeners.push(listener);

    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4 flex items-start gap-3 animate-in slide-in-from-top',
            {
              'border-green-500': toast.type === 'success',
              'border-red-500': toast.type === 'error',
              'border-blue-500': toast.type === 'info',
            }
          )}
        >
          <div className="flex-shrink-0">
            {toast.type === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white">{toast.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
