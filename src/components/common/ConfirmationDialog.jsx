import React from 'react';
import Modal from './Modal';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger', 'warning', 'success', 'info'
  isLoading = false,
}) {
  const iconMap = {
    danger: <AlertCircle className="w-6 h-6 text-[#C1123F]" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    success: <CheckCircle className="w-6 h-6 text-[#16A36A]" />,
    info: <AlertCircle className="w-6 h-6 text-blue-500" />,
  };

  const confirmButtonStyles = {
    danger: 'bg-[#C1123F] hover:bg-[#9E0E32] text-white shadow-rose-950/20',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    success: 'bg-[#16A36A] hover:bg-emerald-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  }[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
          {iconMap[type]}
        </div>

        <h3 className="text-lg font-bold text-[#172033]">{title}</h3>
        <p className="text-sm text-[#64748B] mt-2 leading-relaxed">{message}</p>

        <div className="flex items-center gap-3 w-full mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-[#172033] hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold shadow-md transition-all ${confirmButtonStyles}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
