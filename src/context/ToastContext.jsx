import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'info', duration = 4500 }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast = { id, title, message, type };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="assertive"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isEmergency = toast.type === 'emergency';

            const borderStyles = isEmergency
              ? 'border-red-600 bg-red-950/95 text-white shadow-xl shadow-red-900/30'
              : isSuccess
              ? 'border-emerald-600/30 bg-white text-[#172033] shadow-lg shadow-emerald-950/5'
              : isError
              ? 'border-rose-500/30 bg-white text-[#172033] shadow-lg shadow-rose-950/5'
              : 'border-slate-200 bg-white text-[#172033] shadow-lg';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md ${borderStyles}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isEmergency && <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />}
                  {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#16A36A]" />}
                  {isError && <AlertCircle className="w-5 h-5 text-[#C1123F]" />}
                  {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  {toast.title && (
                    <h4
                      className={`text-sm font-semibold leading-tight ${
                        isEmergency ? 'text-white' : 'text-[#172033]'
                      }`}
                    >
                      {toast.title}
                    </h4>
                  )}
                  {toast.message && (
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isEmergency ? 'text-red-200' : 'text-[#64748B]'
                      }`}
                    >
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className={`p-1 rounded-lg transition-colors ${
                    isEmergency
                      ? 'text-red-300 hover:text-white hover:bg-red-800/50'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
