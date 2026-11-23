import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  UserCheck,
  Check,
  X,
  FileText,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function HospitalArrivalsView({
  arrivals,
  requests,
  onUpdateArrivalStatus,
  onProceedToDonation,
}) {
  const { user, staffRole } = useAuth();
  const { addToast } = useToast();

  const canCoordinate = staffRole === 'hospital_admin' || staffRole === 'donor_coordinator';
  const canRecordOutcome = staffRole === 'hospital_admin' || staffRole === 'medical_staff';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');

  // Edit / Status modal
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [editStatus, setEditStatus] = useState('Arrived');
  const [notes, setNotes] = useState('');

  // Summary counts
  const summary = useMemo(() => {
    const total = arrivals.length;
    const expected = arrivals.filter((a) => a.arrivalStatus === 'Expected').length;
    const arrived = arrivals.filter((a) => a.arrivalStatus === 'Arrived').length;
    const noshow = arrivals.filter((a) => a.arrivalStatus === 'No-show').length;
    return { total, expected, arrived, noshow };
  }, [arrivals]);

  // Filtered list
  const filteredArrivals = useMemo(() => {
    return arrivals.filter((a) => {
      if (statusFilter !== 'ALL' && a.arrivalStatus !== statusFilter) {
        return false;
      }
      if (bloodGroupFilter !== 'ALL' && a.bloodGroup !== bloodGroupFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = a.donorName.toLowerCase().includes(q);
        const matchReq = a.requestId.toLowerCase().includes(q);
        const matchPoint = (a.receptionPoint || '').toLowerCase().includes(q);
        if (!matchName && !matchReq && !matchPoint) return false;
      }
      return true;
    });
  }, [arrivals, statusFilter, bloodGroupFilter, searchQuery]);

  const handleQuickCheckIn = async (arrivalId) => {
    if (!canCoordinate) {
      addToast({
        title: 'Permission Required',
        message: 'Only Donor Coordinator and Hospital Admin can confirm donor check-in.',
        type: 'warning',
      });
      return;
    }

    try {
      await onUpdateArrivalStatus(
        arrivalId,
        'Arrived',
        new Date().toISOString().replace('T', ' ').substring(0, 16),
        'Donor checked in at blood bank reception.'
      );
      addToast({
        title: 'Donor Check-In Confirmed',
        message: 'Donor marked as Arrived. Ready for medical assessment and donation.',
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not update check-in status.', type: 'error' });
    }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!selectedArrival) return;

    try {
      await onUpdateArrivalStatus(selectedArrival.id, editStatus, null, notes);
      setSelectedArrival(null);
      addToast({
        title: 'Arrival Status Updated',
        message: `Arrival record updated to ${editStatus}.`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not update arrival record.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
            Donor Arrival Coordination
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitor scheduled donor visits, check in arriving donors, and hand off for medical screening
          </p>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Scheduled Visits"
          value={summary.total}
          icon={Calendar}
          colorScheme="slate"
          subtitle="All appointment slots"
        />
        <StatCard
          title="Expected Arrivals"
          value={summary.expected}
          icon={Clock}
          colorScheme="amber"
          subtitle="Awaiting donor arrival"
        />
        <StatCard
          title="Checked-In Donors"
          value={summary.arrived}
          icon={CheckCircle2}
          colorScheme="emerald"
          subtitle="Present at blood bank"
        />
        <StatCard
          title="No-Shows"
          value={summary.noshow}
          icon={XCircle}
          colorScheme="crimson"
          subtitle="Missed appointment"
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search donor name, request ID, or counter location..."
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
          {['ALL', 'Expected', 'Arrived', 'No-show', 'Cancelled'].map((st) => (
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
              {st === 'ALL' ? 'All Arrivals' : st}
            </button>
          ))}
        </div>
      </div>

      {/* ARRIVALS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#172033]">Scheduled Donor Arrivals</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {filteredArrivals.length} of {arrivals.length}
            </span>
          </div>
        </div>

        {filteredArrivals.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#172033]">No Arrivals Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No donor visits match your current filter settings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredArrivals.map((arr) => {
              const isExpected = arr.arrivalStatus === 'Expected';
              const isArrived = arr.arrivalStatus === 'Arrived';
              const isNoShow = arr.arrivalStatus === 'No-show';

              return (
                <div
                  key={arr.id}
                  className="p-5 sm:p-6 transition-colors hover:bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Donor & Time Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#C1123F] text-white flex flex-col items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
                      <span>{arr.bloodGroup}</span>
                      <span className="text-[9px] font-normal uppercase opacity-80">Arrival</span>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-[#172033]">
                          {arr.donorName}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isArrived
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isExpected
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : isNoShow
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {arr.arrivalStatus}
                        </span>

                        <span className="text-xs text-slate-500 font-medium">
                          for Requisition <strong className="text-slate-800">{arr.requestId}</strong>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{arr.expectedDate}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-bold text-[#C1123F]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Expected: {arr.expectedTime}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{arr.receptionPoint}</span>
                        </span>
                      </div>

                      {isArrived && arr.checkInTime && (
                        <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Checked in at: {arr.checkInTime}</span>
                        </div>
                      )}

                      {arr.notes && (
                        <p className="text-[11px] text-slate-500 leading-snug">
                          <strong>Note:</strong> {arr.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center flex-shrink-0">
                    {/* Check In Button (if Expected) */}
                    {isExpected && canCoordinate && (
                      <button
                        type="button"
                        onClick={() => handleQuickCheckIn(arr.id)}
                        className="px-4 py-2 rounded-xl bg-[#16A36A] hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Confirm Arrival</span>
                      </button>
                    )}

                    {/* Record Donation Outcome Button (if Arrived and Medical Staff) */}
                    {isArrived && canRecordOutcome && onProceedToDonation && (
                      <button
                        type="button"
                        onClick={() => onProceedToDonation(arr)}
                        className="px-4 py-2 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>Record Donation Outcome</span>
                      </button>
                    )}

                    {/* Edit status modal */}
                    {canCoordinate && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedArrival(arr);
                          setEditStatus(arr.arrivalStatus);
                          setNotes(arr.notes || '');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                      >
                        Update
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {selectedArrival && (
        <Modal
          isOpen={!!selectedArrival}
          onClose={() => setSelectedArrival(null)}
          title={`Update Arrival: ${selectedArrival.donorName}`}
          subtitle={`Arrival Slot for ${selectedArrival.requestId} (${selectedArrival.bloodGroup})`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveModal} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Arrival Status <span className="text-[#C1123F]">*</span>
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              >
                <option value="Expected">Expected (Awaiting Arrival)</option>
                <option value="Arrived">Arrived (Checked In)</option>
                <option value="No-show">No-show (Did Not Arrive)</option>
                <option value="Cancelled">Cancelled (Appointment Cancelled)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Coordinator Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for reschedule, late check-in, or counter assignment..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedArrival(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all shadow-sm"
              >
                Save Arrival Record
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
