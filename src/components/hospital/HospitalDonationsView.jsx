import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartHandshake,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  PlusCircle,
  FileText,
  User,
  Calendar,
  Eye,
  Lock,
  Activity,
  Droplet,
} from 'lucide-react';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function HospitalDonationsView({
  donations,
  arrivals,
  requests,
  onRecordDonation,
}) {
  const { user, staffRole } = useAuth();
  const { addToast } = useToast();

  const isMedicalStaff = staffRole === 'hospital_admin' || staffRole === 'medical_staff';

  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedArrivalForRecord, setSelectedArrivalForRecord] = useState(null);
  const [viewDonationDetails, setViewDonationDetails] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    arrivalId: '',
    requestId: 'REQ-8831',
    donorName: 'Dr. Aryan Sharma',
    bloodGroup: 'O+',
    outcome: 'Donated', // Donated | Medically Deferred | No-show | Cancelled
    unitsCollected: 1,
    componentType: 'Whole Blood (450 mL)',
    screeningMetrics: {
      hb: '13.5 g/dL',
      bp: '120/80',
      weight: '68 kg',
      pulse: '74 bpm',
    },
    deferralReason: '',
    medicalNotes: 'Clinical examination cleared. Well-tolerated phlebotomy collection.',
  });

  // Arrived donors queue who need donation recorded
  const arrivedDonorsQueue = useMemo(() => {
    return arrivals.filter((a) => a.arrivalStatus === 'Arrived' && !a.donationRecorded);
  }, [arrivals]);

  // Summary counts
  const summary = useMemo(() => {
    const totalRecords = donations.length;
    const totalDonated = donations.filter((d) => d.outcome === 'Donated').length;
    const totalUnits = donations
      .filter((d) => d.outcome === 'Donated')
      .reduce((sum, d) => sum + (d.unitsCollected || 1), 0);
    const totalDeferred = donations.filter((d) => d.outcome === 'Medically Deferred').length;
    return { totalRecords, totalDonated, totalUnits, totalDeferred };
  }, [donations]);

  // Filtered donation history
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      if (outcomeFilter !== 'ALL' && d.outcome !== outcomeFilter) {
        return false;
      }
      if (bloodGroupFilter !== 'ALL' && d.bloodGroup !== bloodGroupFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDonor = d.donorName.toLowerCase().includes(q);
        const matchReq = d.requestId.toLowerCase().includes(q);
        const matchStaff = (d.recordedByStaffName || '').toLowerCase().includes(q);
        if (!matchDonor && !matchReq && !matchStaff) return false;
      }
      return true;
    });
  }, [donations, outcomeFilter, bloodGroupFilter, searchQuery]);

  const handleOpenRecordForArrival = (arr) => {
    setSelectedArrivalForRecord(arr);
    setFormData({
      arrivalId: arr.id,
      requestId: arr.requestId,
      donorName: arr.donorName,
      bloodGroup: arr.bloodGroup,
      outcome: 'Donated',
      unitsCollected: 1,
      componentType: 'Whole Blood (450 mL)',
      screeningMetrics: {
        hb: '13.5 g/dL',
        bp: '120/80',
        weight: '68 kg',
        pulse: '74 bpm',
      },
      deferralReason: '',
      medicalNotes: 'Pre-donation examination cleared. Phlebotomy executed without adverse reaction.',
    });
    setIsRecordModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isMedicalStaff) {
      addToast({
        title: 'Authorization Required',
        message: 'Only authorized Medical Staff can record clinical donation outcomes and deferrals.',
        type: 'error',
      });
      return;
    }

    try {
      await onRecordDonation(formData);
      setIsRecordModalOpen(false);
      setSelectedArrivalForRecord(null);
      addToast({
        title: 'Donation Outcome Recorded',
        message: `Outcome for ${formData.donorName} recorded as ${formData.outcome}. Audit trail logged.`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not record donation outcome.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & MEDICAL PROTOCOL NOTICE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
            Donation Management & Clinical Outcomes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Medical officer screening, phlebotomy outcome documentation, and confidential clinical deferral tracking
          </p>
        </div>

        {isMedicalStaff && arrivedDonorsQueue.length > 0 && (
          <button
            type="button"
            onClick={() => handleOpenRecordForArrival(arrivedDonorsQueue[0])}
            className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Arrived Donor Outcome</span>
          </button>
        )}
      </div>

      {/* MEDICAL AUTHORIZATION BADGE */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-white">Clinical Assessment Protocol:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Restricted to Medical Staff
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All donation records, physiological vital screenings, and medical deferrals are audited and tied to the licensed medical officer logged in. Sensitive medical deferral reasons are kept confidential.
          </p>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Units Collected"
          value={summary.totalUnits}
          icon={Droplet}
          colorScheme="crimson"
          subtitle="Successful blood units"
        />
        <StatCard
          title="Completed Donations"
          value={summary.totalDonated}
          icon={CheckCircle2}
          colorScheme="emerald"
          subtitle="Successful phlebotomies"
        />
        <StatCard
          title="Medically Deferred"
          value={summary.totalDeferred}
          icon={AlertTriangle}
          colorScheme="amber"
          subtitle="Clinical safety deferrals"
        />
        <StatCard
          title="Total Outcome Records"
          value={summary.totalRecords}
          icon={FileText}
          colorScheme="slate"
          subtitle="All logged assessments"
        />
      </div>

      {/* ARRIVED DONORS AWAITING SCREENING BANNER */}
      {arrivedDonorsQueue.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C1123F] animate-ping" />
              <h3 className="font-bold text-sm text-[#172033]">
                Arrived Donors Awaiting Phlebotomy Screening ({arrivedDonorsQueue.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-rose-700">Present at Blood Bank</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {arrivedDonorsQueue.map((arr) => (
              <div
                key={arr.id}
                className="p-4 bg-white rounded-2xl border border-rose-200 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C1123F] text-white flex items-center justify-center font-extrabold text-sm">
                    {arr.bloodGroup}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#172033]">{arr.donorName}</h4>
                    <p className="text-[11px] text-slate-500">
                      Req: {arr.requestId} • Checked in at {arr.checkInTime || 'Counter'}
                    </p>
                  </div>
                </div>

                {isMedicalStaff ? (
                  <button
                    type="button"
                    onClick={() => handleOpenRecordForArrival(arr)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>Record Outcome</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">
                    Awaiting Medical Staff
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search donor name, requisition ID, or attending officer..."
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

        {/* Outcome Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          {['ALL', 'Donated', 'Medically Deferred', 'No-show', 'Cancelled'].map((out) => (
            <button
              key={out}
              type="button"
              onClick={() => setOutcomeFilter(out)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                outcomeFilter === out
                  ? 'bg-[#172033] text-white shadow-sm'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {out === 'ALL' ? 'All Outcomes' : out}
            </button>
          ))}
        </div>
      </div>

      {/* DONATION AUDIT HISTORY TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#172033]">Donation & Assessment Records</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {filteredDonations.length} Records
            </span>
          </div>
        </div>

        {filteredDonations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#172033]">No Donation Records Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No historical records matched your search or outcome filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDonations.map((don) => {
              const isDonated = don.outcome === 'Donated';
              const isDeferred = don.outcome === 'Medically Deferred';

              return (
                <div
                  key={don.id}
                  className="p-5 sm:p-6 transition-colors hover:bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0 ${
                        isDonated
                          ? 'bg-[#16A36A] text-white'
                          : isDeferred
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      <span>{don.bloodGroup}</span>
                      <span className="text-[9px] font-normal uppercase opacity-80">
                        {isDonated ? 'Donated' : 'Screen'}
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-[#172033]">
                          {don.donorName}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isDonated
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isDeferred
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {don.outcome}
                        </span>

                        {isDonated && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            +{don.unitsCollected || 1} Unit ({don.componentType || 'Whole Blood'})
                          </span>
                        )}

                        <span className="text-xs text-slate-400">
                          Req: {don.requestId}
                        </span>
                      </div>

                      {/* Vitals Summary */}
                      {don.screeningMetrics && (
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 font-mono">
                          <span>Hb: {don.screeningMetrics.hb}</span>
                          <span>•</span>
                          <span>BP: {don.screeningMetrics.bp}</span>
                          <span>•</span>
                          <span>Weight: {don.screeningMetrics.weight}</span>
                        </div>
                      )}

                      {/* Deferral note (if applicable) */}
                      {isDeferred && don.deferralReason && (
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-snug">
                          <strong>Clinical Deferral Reason: </strong>
                          {don.deferralReason}
                        </div>
                      )}

                      {/* Audit Details */}
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                        <span>Recorded by {don.recordedByStaffName} ({don.recordedByStaffRole})</span>
                        <span>•</span>
                        <span>{don.donationDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start lg:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewDonationDetails(don)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Audit Record</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECORD OUTCOME MODAL (Medical Staff Only) */}
      {isRecordModalOpen && (
        <Modal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          title={`Clinical Donation Assessment: ${formData.donorName}`}
          subtitle={`Requisition ${formData.requestId} • Blood Group ${formData.bloodGroup}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Assessment Outcome <span className="text-[#C1123F]">*</span>
              </label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              >
                <option value="Donated">Donated (Phlebotomy Completed Successfully)</option>
                <option value="Medically Deferred">Medically Deferred (Failed Vitals / Safety Criteria)</option>
                <option value="No-show">No-show (Donor Did Not Arrive)</option>
                <option value="Cancelled">Cancelled (Patient/Procedure Cancelled)</option>
              </select>
            </div>

            {formData.outcome === 'Donated' && (
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">
                    Units Collected <span className="text-[#C1123F]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    required
                    value={formData.unitsCollected}
                    onChange={(e) => setFormData({ ...formData, unitsCollected: e.target.value })}
                    className="w-full p-2 rounded-xl border border-emerald-300 text-xs bg-white"
                  />
                  <p className="text-[10px] text-emerald-800 mt-1">
                    Adds directly to hospital requirement fulfillment count.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">
                    Blood Component Type
                  </label>
                  <select
                    value={formData.componentType}
                    onChange={(e) => setFormData({ ...formData, componentType: e.target.value })}
                    className="w-full p-2 rounded-xl border border-emerald-300 text-xs bg-white"
                  >
                    <option value="Whole Blood (450 mL)">Whole Blood (450 mL)</option>
                    <option value="Packed Red Blood Cells (PRBC)">Packed Red Blood Cells (PRBC)</option>
                    <option value="Single Donor Platelets (SDP)">Single Donor Platelets (SDP)</option>
                    <option value="Fresh Frozen Plasma (FFP)">Fresh Frozen Plasma (FFP)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Vitals screen metrics */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Pre-Donation Physical Examination:
              </span>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Hemoglobin</span>
                  <input
                    type="text"
                    value={formData.screeningMetrics.hb}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        screeningMetrics: { ...formData.screeningMetrics, hb: e.target.value },
                      })
                    }
                    className="w-full p-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Blood Pressure</span>
                  <input
                    type="text"
                    value={formData.screeningMetrics.bp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        screeningMetrics: { ...formData.screeningMetrics, bp: e.target.value },
                      })
                    }
                    className="w-full p-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Weight</span>
                  <input
                    type="text"
                    value={formData.screeningMetrics.weight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        screeningMetrics: { ...formData.screeningMetrics, weight: e.target.value },
                      })
                    }
                    className="w-full p-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Pulse Rate</span>
                  <input
                    type="text"
                    value={formData.screeningMetrics.pulse}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        screeningMetrics: { ...formData.screeningMetrics, pulse: e.target.value },
                      })
                    }
                    className="w-full p-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {formData.outcome === 'Medically Deferred' && (
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Confidential Deferral Reason <span className="text-[#C1123F]">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.deferralReason}
                  onChange={(e) => setFormData({ ...formData, deferralReason: e.target.value })}
                  placeholder="e.g. Hemoglobin below 12.5 g/dL, recent antibiotic course, or elevated BP..."
                  className="w-full p-2.5 rounded-xl border border-amber-300 text-xs text-[#172033] bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Physician Notes / Bag ID Tracking
              </label>
              <textarea
                rows={2}
                value={formData.medicalNotes}
                onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all shadow-sm"
              >
                Save & Sign Audit Record
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW AUDIT DETAILS MODAL */}
      {viewDonationDetails && (
        <Modal
          isOpen={!!viewDonationDetails}
          onClose={() => setViewDonationDetails(null)}
          title={`Clinical Record: #${viewDonationDetails.id}`}
          subtitle={`Donor ${viewDonationDetails.donorName} (${viewDonationDetails.bloodGroup})`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#172033]">{viewDonationDetails.outcome}</span>
                <span className="font-bold text-[#C1123F]">{viewDonationDetails.bloodGroup}</span>
              </div>
              <p className="text-slate-600">
                {viewDonationDetails.outcome === 'Donated'
                  ? `${viewDonationDetails.unitsCollected} Unit(s) Collected • ${viewDonationDetails.componentType}`
                  : `Deferral: ${viewDonationDetails.deferralReason}`}
              </p>
            </div>

            {viewDonationDetails.screeningMetrics && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 font-mono">
                <div className="font-bold text-slate-800">Screening Vitals:</div>
                <div>Hemoglobin: {viewDonationDetails.screeningMetrics.hb}</div>
                <div>Blood Pressure: {viewDonationDetails.screeningMetrics.bp}</div>
                <div>Weight: {viewDonationDetails.screeningMetrics.weight}</div>
                <div>Pulse: {viewDonationDetails.screeningMetrics.pulse}</div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 leading-relaxed">
              <strong>Clinical Assessment Notes: </strong>
              {viewDonationDetails.medicalNotes}
            </div>

            <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-100">
              <div>Attending Officer: {viewDonationDetails.recordedByStaffName} ({viewDonationDetails.recordedByStaffRole})</div>
              <div>Date & Time: {viewDonationDetails.donationDate}</div>
              <div>Associated Request: {viewDonationDetails.requestId}</div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setViewDonationDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
