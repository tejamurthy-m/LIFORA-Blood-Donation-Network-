import React from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Calendar, Users, AlertCircle, Check, X, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function RequestCard({
  request,
  onAccept,
  onReject,
  showActions = true,
  onViewDetails,
}) {
  const isEmergency = request.urgency?.toLowerCase() === 'emergency';
  const hasAccepted = request.acceptedDonors && request.acceptedDonors.length > 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-5 transition-all relative overflow-hidden bg-white ${
        isEmergency
          ? 'border-red-300 ring-1 ring-red-500/20 shadow-md shadow-red-950/5'
          : 'border-slate-200/80 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Urgency Highlight Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          isEmergency
            ? 'bg-gradient-to-r from-[#C1123F] to-[#F04462]'
            : request.urgency?.toLowerCase() === 'urgent'
            ? 'bg-amber-400'
            : 'bg-blue-500'
        }`}
      />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-sm flex-shrink-0 ${
              isEmergency
                ? 'bg-gradient-to-br from-[#F04462] to-[#C1123F] text-white animate-pulse-subtle'
                : 'bg-rose-50 text-[#C1123F] border border-rose-200'
            }`}
          >
            {request.bloodGroup}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {request.trackingId || request.id}
              </span>
              <StatusBadge status={request.urgency} type="urgency" size="sm" />
            </div>
            <h4 className="font-bold text-[#172033] text-base mt-0.5">
              {request.hospitalName}
            </h4>
          </div>
        </div>

        <StatusBadge status={request.status} size="sm" />
      </div>

      {/* Details */}
      <div className="mt-4 space-y-2 text-xs text-[#64748B]">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{request.hospitalLocation || request.city}</span>
          {request.distanceKm && (
            <span className="text-slate-400 font-medium">({request.distanceKm} km away)</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#C1123F]" />
            <span>Required: {request.unitsRequired} {request.unitsRequired > 1 ? 'Units' : 'Unit'}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{request.requiredDate || 'Immediate'}</span>
          </div>

          {request.donorResponses > 0 && (
            <div className="flex items-center gap-1 text-emerald-600 font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>{request.donorResponses} responses</span>
            </div>
          )}
        </div>

        {request.additionalInstructions && (
          <p className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600 line-clamp-2">
            <span className="font-semibold text-slate-700">Note: </span>
            {request.additionalInstructions}
          </p>
        )}
      </div>

      {/* Notice about medical eligibility */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-600">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <span>
          Notice: Responding confirms your initial willingness. Final transfusion and medical eligibility decisions rest with hospital blood bank physicians.
        </span>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-4 flex items-center gap-2">
          {hasAccepted ? (
            <div className="w-full py-2 px-3 rounded-xl bg-emerald-50 text-[#16A36A] border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>You responded positively. Coordination active.</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onReject && onReject(request.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                Decline
              </button>

              <button
                type="button"
                onClick={() => onAccept && onAccept(request.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-xs font-bold text-white shadow-sm shadow-[#C1123F]/20 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Accept & Help
              </button>
            </>
          )}

          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(request)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="View Tracking Details"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
