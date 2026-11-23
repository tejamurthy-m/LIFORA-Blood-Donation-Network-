import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Droplet, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BloodGroupCard({ info, onClick, isSelected = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(info.type);
    } else {
      navigate(`/find-donors?bloodGroup=${encodeURIComponent(info.type)}`);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`group cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden ${
        isSelected
          ? 'bg-rose-50/70 border-[#C1123F] ring-2 ring-[#C1123F]/20 shadow-md'
          : 'bg-white hover:bg-white/90 border-slate-200/80 hover:border-[#C1123F]/40 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Background blood droplet glow */}
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-[#C1123F]/5 group-hover:bg-[#C1123F]/10 transition-colors pointer-events-none" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F04462] to-[#C1123F] text-white flex items-center justify-center font-extrabold text-xl shadow-sm shadow-[#C1123F]/20">
            {info.type}
          </div>
          <div>
            <h4 className="font-bold text-[#172033] group-hover:text-[#C1123F] transition-colors">
              {info.label}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <Users className="w-3.5 h-3.5" />
              <span>{info.population} population</span>
            </div>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-rose-100 text-slate-400 group-hover:text-[#C1123F] flex items-center justify-center transition-colors">
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      <p className="mt-3.5 text-xs text-[#64748B] line-clamp-2 leading-relaxed">
        {info.description}
      </p>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <div className="text-slate-500">
          <span className="font-semibold text-slate-700">Give: </span>
          {info.canGiveTo.slice(0, 2).join(', ')}
          {info.canGiveTo.length > 2 && '...'}
        </div>
        {info.isHighDemand && (
          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#C1123F] font-semibold border border-rose-200">
            High Demand
          </span>
        )}
      </div>
    </motion.div>
  );
}
