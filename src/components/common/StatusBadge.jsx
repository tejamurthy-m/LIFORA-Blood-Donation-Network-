import React from 'react';
import { AlertCircle, CheckCircle, Clock, ShieldCheck, Heart } from 'lucide-react';

export default function StatusBadge({ status, type = 'status', className = '', size = 'md' }) {
  if (!status) return null;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 whitespace-nowrap shrink-0',
    md: 'text-xs px-2.5 py-1 gap-1.5 whitespace-nowrap shrink-0',
    lg: 'text-sm px-3.5 py-1.5 gap-2 whitespace-nowrap shrink-0',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5 whitespace-nowrap shrink-0';

  const normalized = status.toString().toLowerCase();

  // Urgency Badges
  if (type === 'urgency' || normalized === 'emergency' || normalized === 'urgent' || normalized === 'normal') {
    if (normalized === 'emergency') {
      return (
        <span
          className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full bg-red-100 text-[#C1123F] border border-red-300 animate-pulse ${sizeClasses} ${className}`}
        >
          <span className="w-2 h-2 rounded-full bg-[#C1123F] animate-ping" />
          <AlertCircle className="w-3.5 h-3.5 text-[#C1123F]" />
          Emergency
        </span>
      );
    }
    if (normalized === 'urgent') {
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses} ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Urgent
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Normal
      </span>
    );
  }

  // Availability Badges
  if (type === 'availability' || normalized === 'available' || normalized === 'unavailable') {
    const isAvail = normalized === 'available' || status === true;
    if (isAvail) {
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-emerald-50 text-[#16A36A] border border-emerald-200 ${sizeClasses} ${className}`}
        >
          <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
          Available Now
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-500 border border-slate-200 ${sizeClasses} ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        Unavailable
      </span>
    );
  }

  // Donor Recognition Badges
  if (type === 'badge' || ['golden donor', 'verified donor', 'universal lifesaver', 'rare blood hero'].includes(normalized)) {
    if (normalized.includes('golden')) {
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses} ${className}`}
        >
          <Heart className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          {status}
        </span>
      );
    }
    if (normalized.includes('universal') || normalized.includes('rare')) {
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses} ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          {status}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full bg-rose-50 text-[#C1123F] border border-rose-200 ${sizeClasses} ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-[#C1123F]" />
        {status}
      </span>
    );
  }

  // Generic Request Status
  if (normalized === 'in progress') {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses} ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-blue-600" />
        In Progress
      </span>
    );
  }
  if (normalized === 'fulfilled') {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-emerald-50 text-[#16A36A] border border-emerald-200 ${sizeClasses} ${className}`}
      >
        <CheckCircle className="w-3.5 h-3.5 text-[#16A36A]" />
        Fulfilled
      </span>
    );
  }
  if (normalized === 'pending') {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        Pending
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}
    >
      {status}
    </span>
  );
}
