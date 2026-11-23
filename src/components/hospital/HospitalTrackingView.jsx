import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Users,
  HeartHandshake,
  Droplet,
  Edit,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';
import ConfirmationDialog from '../common/ConfirmationDialog';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hospitalPortalService } from '../../services/hospitalPortalService';

export default function HospitalTrackingView({
  requests,
  arrivals,
  donations,
  onUpdateRequest,
  onCloseRequest,
}) {
  const { user, staffRole } = useAuth();
  const { addToast } = useToast();

  const canEditRequirement = staffRole === 'hospital_admin' || staffRole === 'request_manager';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');

  // Edit requirement modal
  const [editingItem, setEditingItem] = useState(null);
  const [updatedUnits, setUpdatedUnits] = useState(1);
  const [closeConfirmId, setCloseConfirmId] = useState(null);

  // Compute fulfillment records strictly per Section 9 rule
  const trackingData = useMemo(() => {
    return hospitalPortalService.getRequirementTracking(requests, arrivals, donations);
  }, [requests, arrivals, donations]);

  // Overall totals
  const overall = useMemo(() => {
    const totalRequired = trackingData.reduce((sum, r) => sum + r.requiredUnits, 0);
    const totalCollected = trackingData.reduce((sum, r) => sum + r.successfulDonations, 0);
    const totalRemaining = trackingData.reduce((sum, r) => sum + r.remainingUnits, 0);
    const overallPct = totalRequired > 0 ? Math.round((totalCollected / totalRequired) * 100) : 0;
    return { totalRequired, totalCollected, totalRemaining, overallPct };
  }, [trackingData]);

  // Filtered
  const filteredTracking = useMemo(() => {
    return trackingData.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (bloodGroupFilter !== 'ALL' && item.bloodGroup !== bloodGroupFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = item.id.toLowerCase().includes(q);
        const matchLoc = item.location.toLowerCase().includes(q);
        const matchBg = item.bloodGroup.toLowerCase().includes(q);
        if (!matchId && !matchLoc && !matchBg) return false;
      }
      return true;
    });
  }, [trackingData, statusFilter, bloodGroupFilter, searchQuery]);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setUpdatedUnits(item.requiredUnits);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await onUpdateRequest(editingItem.id, {
        unitsRequired: parseInt(updatedUnits, 10),
      });
      setEditingItem(null);
      addToast({
        title: 'Requirement Updated',
        message: `${editingItem.id} target updated to ${updatedUnits} units.`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not update requirement.', type: 'error' });
    }
  };

  const handleConfirmClose = async () => {
    if (!closeConfirmId) return;
    try {
      await onCloseRequest(closeConfirmId);
      setCloseConfirmId(null);
      addToast({
        title: 'Requirement Closed',
        message: 'Requirement archived and donor broadcasts concluded.',
        type: 'info',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not close requirement.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & RULE EXPLANATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
            Blood Requirement Tracking
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time requisition monitoring, blood unit deficit tracking, and verified donation fulfillment
          </p>
        </div>
      </div>

      {/* COMPLIANCE CRITERIA BOX (Section 9) */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-xs text-white">Clinical Fulfillment Rule (Standard Protocol):</span>
          <p className="text-xs text-slate-300 leading-relaxed">
            Per clinical standards, donor responses and scheduled arrivals do <strong>NOT</strong> count as successful donations. Only verified, collected units logged by medical staff count toward the fulfilled quantity. One donation corresponds to exactly 1 collected unit.
          </p>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Required"
          value={`${overall.totalRequired} Units`}
          icon={Droplet}
          colorScheme="crimson"
          subtitle="Cumulative hospital demand"
        />
        <StatCard
          title="Successful Donations"
          value={`${overall.totalCollected} Units`}
          icon={CheckCircle2}
          colorScheme="emerald"
          subtitle="Collected & banked"
        />
        <StatCard
          title="Remaining Deficit"
          value={`${overall.totalRemaining} Units`}
          icon={AlertTriangle}
          colorScheme="amber"
          subtitle="Active shortage"
        />
        <StatCard
          title="Fulfilment Rate"
          value={`${overall.overallPct}%`}
          icon={TrendingUp}
          colorScheme="blue"
          subtitle="Overall network fulfillment"
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by request ID, ward, or blood group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            >
              <option value="ALL">All Blood Groups</option>
              {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          {['ALL', 'Active', 'Partially Fulfilled', 'Fulfilled', 'Closed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-[#172033] text-white shadow-sm'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Requirements' : st}
            </button>
          ))}
        </div>
      </div>

      {/* TRACKING CARDS / LIST */}
      <div className="space-y-4">
        {filteredTracking.map((item) => {
          const isComplete = item.fulfilmentPercentage >= 100;

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 transition-all hover:border-slate-300"
            >
              {/* Top row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#C1123F] text-white flex flex-col items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
                    <span>{item.bloodGroup}</span>
                    <span className="text-[9px] font-normal uppercase opacity-80">Req</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-[#172033]">{item.bloodGroup} Blood Requirement</h4>
                      <StatusBadge status={item.urgency} type="urgency" size="sm" />
                      <StatusBadge status={item.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.id} • {item.location} • Target: {item.requiredDate}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {canEditRequirement && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Adjust Units</span>
                    </button>
                  )}

                  {item.status !== 'Closed' && canEditRequirement && (
                    <button
                      type="button"
                      onClick={() => setCloseConfirmId(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-[#C1123F] text-slate-600 text-xs font-bold transition-colors"
                    >
                      Close Requirement
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Quantitative Breakdown Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Original Requirement
                  </span>
                  <span className="text-base font-black text-[#172033] mt-0.5 block">
                    {item.requiredUnits} <span className="text-xs font-medium text-slate-500">Units</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <span className="text-blue-700 font-bold block text-[10px] uppercase">
                    Confirmed Donors
                  </span>
                  <span className="text-base font-black text-blue-900 mt-0.5 block">
                    {item.confirmedDonors} <span className="text-xs font-medium text-blue-600">Scheduled</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-emerald-700 font-bold block text-[10px] uppercase">
                    Successful Donations
                  </span>
                  <span className="text-base font-black text-emerald-900 mt-0.5 block">
                    {item.successfulDonations} <span className="text-xs font-medium text-emerald-600">Collected</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <span className="text-rose-700 font-bold block text-[10px] uppercase">
                    Remaining Deficit
                  </span>
                  <span className="text-base font-black text-[#C1123F] mt-0.5 block">
                    {item.remainingUnits} <span className="text-xs font-medium text-rose-500">Units</span>
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    Fulfillment Progress: {item.successfulDonations} of {item.requiredUnits} Units
                  </span>
                  <span className={`font-black ${isComplete ? 'text-[#16A36A]' : 'text-[#C1123F]'}`}>
                    {item.fulfilmentPercentage}% Complete
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete ? 'bg-[#16A36A]' : item.fulfilmentPercentage > 0 ? 'bg-[#C1123F]' : 'bg-slate-300'
                    }`}
                    style={{ width: `${item.fulfilmentPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADJUST UNITS MODAL */}
      {editingItem && (
        <Modal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          title={`Adjust Requirement: ${editingItem.id}`}
          subtitle={`Clinical target adjustment for ${editingItem.bloodGroup} at ${editingItem.location}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Required Units <span className="text-[#C1123F]">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={updatedUnits}
                onChange={(e) => setUpdatedUnits(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Current successful donations: {editingItem.successfulDonations} units.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all shadow-sm"
              >
                Update Requirement
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM CLOSE DIALOG */}
      <ConfirmationDialog
        isOpen={!!closeConfirmId}
        onClose={() => setCloseConfirmId(null)}
        onConfirm={handleConfirmClose}
        title="Close Blood Requirement"
        message="Are you sure you want to close this requirement? Active broadcasting to nearby donors will cease."
        confirmText="Close Requirement"
        type="warning"
      />
    </div>
  );
}
