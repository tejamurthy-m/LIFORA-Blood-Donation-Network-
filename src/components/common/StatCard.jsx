import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'crimson', // 'crimson', 'blue', 'emerald', 'amber', 'slate'
  className = '',
}) {
  const schemeStyles = {
    crimson: {
      iconBg: 'bg-[#C1123F]/10 text-[#C1123F]',
      badge: 'text-[#C1123F] bg-rose-50',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600',
      badge: 'text-blue-700 bg-blue-50',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-[#16A36A]',
      badge: 'text-[#16A36A] bg-emerald-50',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600',
      badge: 'text-amber-700 bg-amber-50',
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-700',
      badge: 'text-slate-600 bg-slate-100',
    },
  }[colorScheme] || {
    iconBg: 'bg-[#C1123F]/10 text-[#C1123F]',
    badge: 'text-[#C1123F] bg-rose-50',
  };

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#64748B]">{title}</span>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${schemeStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {trend && (
              <span className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded ${schemeStyles.badge}`}>
                <TrendingUp className="w-3 h-3" />
                {trend}
              </span>
            )}
            {subtitle && <span className="text-[#64748B] truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
