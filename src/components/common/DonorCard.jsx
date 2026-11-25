import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Send, Eye, ShieldCheck, Heart } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function DonorCard({ donor, onViewProfile, onSendRequest }) {
  const isAvailable = donor.isAvailable;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#C1123F]/30 transition-all p-5 flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top Banner Accent */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isAvailable ? 'bg-gradient-to-r from-[#16A36A] to-emerald-400' : 'bg-slate-300'}`} />

      <div>
        {/* Header row: Blood group & Status */}
        <div className="flex items-start justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F04462] to-[#C1123F] text-white flex flex-col items-center justify-center font-extrabold shadow-sm shadow-[#C1123F]/25 shrink-0">
              <span className="text-lg leading-none">{donor.bloodGroup}</span>
              <span className="text-[9px] font-normal tracking-wide opacity-80 uppercase mt-0.5">Type</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-[#172033] text-sm sm:text-base truncate">
                  {donor.name || donor.privacySafeName || 'Anonymous Donor'}
                </h3>
                {donor.verified && (
                  <ShieldCheck className="w-4 h-4 text-[#C1123F] shrink-0" title="Identity & Blood Test Verified" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-[#64748B] mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{donor.area ? `${donor.area}, ${donor.city}` : donor.city}</span>
                {donor.distanceKm !== undefined && (
                  <>
                    <span className="text-slate-300 shrink-0">•</span>
                    <span className="font-medium text-slate-600 shrink-0 whitespace-nowrap">~{donor.distanceKm} km</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 pl-1">
            <StatusBadge status={isAvailable ? 'Available' : 'Unavailable'} type="availability" size="sm" />
          </div>
        </div>

        {/* Badges / recognition tag */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {donor.badge && (
            <StatusBadge status={donor.badge} type="badge" size="sm" />
          )}
          {donor.emergencyReady && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-[#C1123F] border border-rose-200">
              <Heart className="w-3 h-3 fill-rose-500" />
              Emergency Ready
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">Total Donations</span>
            <span className="font-bold text-[#172033] text-sm mt-0.5 block">
              {donor.totalDonations || 0} times
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Last Donated</span>
            <span className="font-medium text-[#172033] text-xs mt-0.5 block truncate">
              {donor.lastDonationDate || 'Available Now'}
            </span>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="mt-2.5 text-[11px] text-slate-600 italic">
          * Private contact details protected under LIFORA Medical Privacy protocol.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewProfile && onViewProfile(donor)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#172033] transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          View Profile
        </button>

        <button
          type="button"
          onClick={() => onSendRequest && onSendRequest(donor)}
          disabled={!isAvailable}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
            isAvailable
              ? 'bg-[#C1123F] hover:bg-[#9E0E32] shadow-rose-900/10'
              : 'bg-slate-300 cursor-not-allowed text-slate-500'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Send Request
        </button>
      </div>
    </motion.div>
  );
}
