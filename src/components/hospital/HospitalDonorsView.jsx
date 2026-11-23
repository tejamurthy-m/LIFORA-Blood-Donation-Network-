import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  MessageSquare,
  FileText,
  UserCheck,
  Send,
  Lock,
  Sparkles,
} from 'lucide-react';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function HospitalDonorsView({
  donorResponses,
  requests,
  onUpdateDonorStatus,
  onScheduleArrival,
}) {
  const { user, staffRole } = useAuth();
  const { addToast } = useToast();

  const canCoordinate = staffRole === 'hospital_admin' || staffRole === 'donor_coordinator';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');
  const [requestFilter, setRequestFilter] = useState('ALL');

  // Contact / Appointment Modal
  const [contactModalDonor, setContactModalDonor] = useState(null);
  const [newStatus, setNewStatus] = useState('Contacted');
  const [notes, setNotes] = useState('');
  const [scheduleArrivalDate, setScheduleArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleArrivalTime, setScheduleArrivalTime] = useState('14:00');
  const [shouldScheduleArrival, setShouldScheduleArrival] = useState(false);

  // Filtered Donors
  const filteredDonors = useMemo(() => {
    return donorResponses.filter((d) => {
      if (statusFilter !== 'ALL' && d.responseStatus !== statusFilter) {
        return false;
      }
      if (bloodGroupFilter !== 'ALL' && d.bloodGroup !== bloodGroupFilter) {
        return false;
      }
      if (requestFilter !== 'ALL' && d.requestId !== requestFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = d.donorName.toLowerCase().includes(q);
        const matchReq = d.requestId.toLowerCase().includes(q);
        const matchBg = d.bloodGroup.toLowerCase().includes(q);
        if (!matchName && !matchReq && !matchBg) return false;
      }
      return true;
    });
  }, [donorResponses, statusFilter, bloodGroupFilter, requestFilter, searchQuery]);

  // Summary counts
  const summary = useMemo(() => {
    const total = donorResponses.length;
    const confirmed = donorResponses.filter((d) => d.responseStatus === 'Confirmed').length;
    const contacted = donorResponses.filter((d) => d.responseStatus === 'Contacted').length;
    const interested = donorResponses.filter((d) => d.responseStatus === 'Interested').length;
    return { total, confirmed, contacted, interested };
  }, [donorResponses]);

  const handleOpenContact = (donor) => {
    setContactModalDonor(donor);
    setNewStatus(donor.responseStatus);
    setNotes(donor.notes || '');
    setShouldScheduleArrival(donor.responseStatus === 'Confirmed');
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!contactModalDonor) return;

    try {
      await onUpdateDonorStatus(contactModalDonor.id, newStatus, notes);

      // If status is Confirmed and user checked Schedule Arrival
      if (shouldScheduleArrival && onScheduleArrival) {
        await onScheduleArrival({
          requestId: contactModalDonor.requestId,
          responseId: contactModalDonor.id,
          donorName: contactModalDonor.donorName,
          bloodGroup: contactModalDonor.bloodGroup,
          expectedDate: scheduleArrivalDate,
          expectedTime: scheduleArrivalTime,
          notes: notes || 'Confirmed appointment via donor coordinator.',
        });
      }

      setContactModalDonor(null);
      addToast({
        title: 'Donor Status Updated',
        message: `${contactModalDonor.donorName} marked as ${newStatus}.`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not update donor response.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & MEDICAL DISCLAIMER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
            Donor Management & Coordination
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Coordinate with voluntary community donors who have answered hospital blood requisitions
          </p>
        </div>
      </div>

      {/* COMPLIANCE ALERT BOX */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Medical Eligibility Protocol:</span>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Per clinical standards, donor responses indicate community willingness to donate. Official medical eligibility (hemoglobin screening, vital signs, and serology) must be determined exclusively by qualified medical staff at the hospital phlebotomy counter.
          </p>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Responders"
          value={summary.total}
          icon={Users}
          colorScheme="blue"
          subtitle="All received responses"
        />
        <StatCard
          title="Confirmed Donors"
          value={summary.confirmed}
          icon={CheckCircle2}
          colorScheme="emerald"
          subtitle="Arrival appointment agreed"
        />
        <StatCard
          title="Contacted"
          value={summary.contacted}
          icon={Phone}
          colorScheme="amber"
          subtitle="Outreach initiated"
        />
        <StatCard
          title="New Responders"
          value={summary.interested}
          icon={Sparkles}
          colorScheme="crimson"
          subtitle="Awaiting coordinator call"
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search donor name or request ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            />
          </div>

          {/* Blood group */}
          <div className="md:col-span-3">
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

          {/* Request ID filter */}
          <div className="md:col-span-4">
            <select
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            >
              <option value="ALL">All Associated Requests</option>
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} ({r.bloodGroup} • {r.location})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          {['ALL', 'Confirmed', 'Contacted', 'Interested', 'Withdrawn', 'Not Reachable'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-[#172033] text-white shadow-sm'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Donors' : st}
            </button>
          ))}
        </div>
      </div>

      {/* DONORS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#172033]">Donor Responders Queue</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {filteredDonors.length} of {donorResponses.length}
            </span>
          </div>
        </div>

        {filteredDonors.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#172033]">No Donor Responses Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No donor records matched your filter settings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDonors.map((donor) => {
              const isConfirmed = donor.responseStatus === 'Confirmed';
              const isContacted = donor.responseStatus === 'Contacted';
              const isInterested = donor.responseStatus === 'Interested';

              return (
                <div
                  key={donor.id}
                  className="p-5 sm:p-6 transition-colors hover:bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Donor Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#C1123F] text-white flex flex-col items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
                      <span>{donor.bloodGroup}</span>
                      <span className="text-[9px] font-normal uppercase opacity-80">Group</span>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-[#172033]">
                          {donor.donorName}
                        </span>

                        {/* Response status badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isContacted
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isInterested
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {donor.responseStatus}
                        </span>

                        <span className="text-xs text-slate-500 font-medium">
                          for Requisition <strong className="text-slate-800">{donor.requestId}</strong>
                        </span>
                      </div>

                      {/* Contact Info (Only if permitted) */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        {donor.hasConsent ? (
                          <>
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{donor.phone}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{donor.email}</span>
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Contact info masked (In-App dispatch only)</span>
                          </span>
                        )}
                        <span>•</span>
                        <span className="text-slate-400 text-[11px]">Responded {donor.responseDate}</span>
                      </div>

                      {/* Coordinator notes */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed mt-1">
                        <strong>Outreach Notes: </strong>
                        {donor.notes || 'No coordinator notes recorded yet.'}
                        {donor.contactedBy && (
                          <span className="text-slate-400 block text-[10px] mt-0.5">
                            Logged by: {donor.contactedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenContact(donor)}
                      disabled={!canCoordinate}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title={canCoordinate ? 'Update response status or add notes' : 'Requires Donor Coordinator role'}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Contact / Update</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTACT / APPOINTMENT MODAL */}
      {contactModalDonor && (
        <Modal
          isOpen={!!contactModalDonor}
          onClose={() => setContactModalDonor(null)}
          title={`Donor Coordination: ${contactModalDonor.donorName}`}
          subtitle={`Responding to ${contactModalDonor.requestId} (${contactModalDonor.bloodGroup})`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveContact} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Donor Response Status <span className="text-[#C1123F]">*</span>
              </label>
              <select
                value={newStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewStatus(val);
                  if (val === 'Confirmed') setShouldScheduleArrival(true);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              >
                <option value="Interested">Interested (Initial Response)</option>
                <option value="Contacted">Contacted (Spoke / Reached Out)</option>
                <option value="Confirmed">Confirmed (Agreed to Visit)</option>
                <option value="Withdrawn">Withdrawn (Donor Cancelled)</option>
                <option value="Not Reachable">Not Reachable (No Answer)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Coordination Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log donor comments, preferred timeslot, or special medical remarks..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              />
            </div>

            {/* Schedule Arrival Appointment Option */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={shouldScheduleArrival}
                  onChange={(e) => setShouldScheduleArrival(e.target.checked)}
                  className="rounded text-[#C1123F] accent-[#C1123F]"
                />
                <span>Schedule Donor Arrival Appointment</span>
              </label>

              {shouldScheduleArrival && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Visit Date</label>
                    <input
                      type="date"
                      required
                      value={scheduleArrivalDate}
                      onChange={(e) => setScheduleArrivalDate(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs text-[#172033] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Expected Time</label>
                    <input
                      type="time"
                      required
                      value={scheduleArrivalTime}
                      onChange={(e) => setScheduleArrivalTime(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs text-[#172033] bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setContactModalDonor(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all shadow-sm"
              >
                Save Donor Record
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
