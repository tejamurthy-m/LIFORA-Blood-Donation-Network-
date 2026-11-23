import React from 'react';
import { Search, HeartHandshake, FileText, AlertCircle } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Search,
  title = 'No results found',
  description = 'Try adjusting your search filters, expanding the distance radius, or checking another blood group.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-10 bg-white rounded-3xl border border-dashed border-slate-200 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 text-[#C1123F]">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-bold text-[#172033] tracking-tight">{title}</h3>
      <p className="text-xs text-[#64748B] max-w-sm mt-1.5 leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#C1123F] text-white text-xs font-bold hover:bg-[#9E0E32] transition-colors shadow-sm shadow-[#C1123F]/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
