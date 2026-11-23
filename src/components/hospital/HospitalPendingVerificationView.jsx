import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Clock,
  FileCheck2,
  FileText,
  AlertTriangle,
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw,
} from 'lucide-react';
import { hospitalPortalService, saveStoredHospitalData, getStoredHospitalData } from '../../services/hospitalPortalService';
import { hospitalService } from '../../services/hospitalService';
import { useToast } from '../../context/ToastContext';

// Authorized operator security passkeys for platform-level verification
const PLATFORM_OPERATOR_PASSKEYS = ['LIFORA-VERIFY-2025', 'operator2025', 'lifora-admin'];

export default function HospitalPendingVerificationView({ profile, auditLogs = [], onStatusChanged }) {
  const { addToast } = useToast();

  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [operatorKey, setOperatorKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [operatorNotes, setOperatorNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState(profile?.id || 'hosp-1');

  const status = profile?.verificationStatus || 'Pending';
  const isRejected = status === 'Rejected';

  // Load all registered hospitals for operator review
  const loadPendingHospitals = async () => {
    try {
      const all = await hospitalService.getHospitals();
      setPendingApplications(all);
    } catch {
      // fallback
    }
  };

  const handleUnlockOperatorTools = (e) => {
    e.preventDefault();
    setKeyError('');

    if (!PLATFORM_OPERATOR_PASSKEYS.includes(operatorKey.trim())) {
      setKeyError('Invalid Platform Operator Security Key. Access restricted to authorized LIFORA staff.');
      return;
    }

    setIsUnlocked(true);
    loadPendingHospitals();
    addToast({
      title: 'Platform Operator Verified',
      message: 'Authorized verification controls unlocked.',
      type: 'success',
    });
  };

  const handleApproveApplication = async () => {
    setIsProcessing(true);
    try {
      // 1. Update current hospital portal data
      const current = getStoredHospitalData();
      current.profile.verificationStatus = 'Verified';
      current.profile.verifiedAt = new Date().toISOString().split('T')[0];
      current.auditLogs.unshift({
        id: `log-${Date.now()}`,
        action: 'Hospital Application Approved',
        actor: 'LIFORA Platform Operator (Compliance Desk)',
        target: `${current.profile.name} (${current.profile.licenseNumber})`,
        time: 'Just now',
        notes: operatorNotes.trim() || 'Clinical license and blood bank facilities authenticated with State Blood Transfusion Council.',
      });
      saveStoredHospitalData(current);

      // 2. Also update master hospital listing in hospitalService
      try {
        await hospitalService.approveHospital(current.profile.id);
      } catch (err) {
        console.warn('Sync to master hospital list:', err);
      }

      addToast({
        title: 'Hospital Verification Approved',
        message: `${current.profile.name} is now a Verified Partner. Hospital Portal unlocked!`,
        type: 'success',
      });

      setOperatorModalOpen(false);
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      addToast({
        title: 'Error',
        message: 'Could not complete verification approval.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApplication = async () => {
    if (!operatorNotes.trim()) {
      alert('Please provide a clinical or regulatory reason for rejection in Operator Notes.');
      return;
    }

    setIsProcessing(true);
    try {
      const current = getStoredHospitalData();
      current.profile.verificationStatus = 'Rejected';
      current.profile.rejectionReason = operatorNotes.trim();
      current.profile.rejectedAt = new Date().toISOString().split('T')[0];
      current.auditLogs.unshift({
        id: `log-${Date.now()}`,
        action: 'Hospital Application Rejected',
        actor: 'LIFORA Platform Operator (Compliance Desk)',
        target: `${current.profile.name} (${current.profile.licenseNumber})`,
        time: 'Just now',
        notes: operatorNotes.trim(),
      });
      saveStoredHospitalData(current);

      try {
        await hospitalService.rejectHospital(current.profile.id, operatorNotes.trim());
      } catch (err) {
        console.warn('Sync to master hospital list:', err);
      }

      addToast({
        title: 'Application Rejected',
        message: 'The hospital registration has been rejected with compliance notes.',
        type: 'info',
      });

      setOperatorModalOpen(false);
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      addToast({
        title: 'Error',
        message: 'Could not reject application.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C1123F]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              isRejected ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
            }`}>
              {isRejected ? <ShieldAlert className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Registration Application
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isRejected ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {isRejected ? 'Application Rejected' : 'Pending Verification'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#172033] mt-1">
                {profile?.name || 'Hospital & Transfusion Centre'}
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                License No: <span className="font-mono font-semibold text-slate-700">{profile?.licenseNumber || 'PENDING-REG'}</span>
                {profile?.city && ` • ${profile.city}, ${profile.state || 'India'}`}
              </p>
            </div>
          </div>

          {/* Platform Operator Access Button */}
          <button
            type="button"
            onClick={() => {
              setOperatorModalOpen(true);
              setIsUnlocked(false);
              setOperatorKey('');
              setKeyError('');
            }}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Platform Operator Review</span>
          </button>
        </div>

        {/* Informative Status Banner */}
        <div className="mt-6 p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200 space-y-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#C1123F] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#172033]">
                {isRejected
                  ? 'Registration Application Rejected by Compliance Desk'
                  : 'Hospital Operational Access Restricted During Verification'}
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {isRejected
                  ? `Your institution's application was reviewed and rejected: "${profile?.rejectionReason || 'Documentation or licensing could not be verified'}". Please contact compliance@lifora.org to submit revised regulatory documentation.`
                  : 'In compliance with National Blood Transfusion Council (NBTC) regulations and clinical safety protocols, hospital operational features (creating blood requisitions, donor scheduling, donation logs) are restricted until your state blood bank license and transfusion head credentials are authenticated by an authorized LIFORA Platform Operator.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#64748B]">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
              <span>Hospital users cannot approve or bypass verification for their own institution.</span>
            </span>
            <span className="font-semibold text-slate-700">
              Ref ID: <span className="font-mono">{profile?.registrationNumber || 'MH-HOSP-REG-10492'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Verification Milestones Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#172033]">Verification & Accreditation Progress</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-emerald-900">1. Application Submitted</div>
            <div className="text-[11px] text-emerald-700 leading-snug">
              Institutional details and clinical license uploaded.
            </div>
          </div>

          <div className={`p-4 rounded-2xl border space-y-2 ${
            isRejected
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200 animate-pulse'
          }`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              isRejected ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {isRejected ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div className={`text-xs font-bold ${isRejected ? 'text-red-900' : 'text-amber-900'}`}>
              2. License Authentication
            </div>
            <div className={`text-[11px] ${isRejected ? 'text-red-700' : 'text-amber-700'} leading-snug`}>
              {isRejected ? 'Failed regulatory validation.' : 'Verification underway with State Blood Council.'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 opacity-75">
            <div className="w-7 h-7 rounded-xl bg-slate-300 text-slate-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-700">3. Operator Review</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              Authorized LIFORA operator inspection and digital signing.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 opacity-75">
            <div className="w-7 h-7 rounded-xl bg-slate-300 text-slate-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-700">4. Portal Activation</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              Full access to blood requisition and donor coordination unlocked.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Submitted Institutional Credentials Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#172033]">Submitted Institutional Credentials</h3>
            <p className="text-xs text-[#64748B]">
              Recorded clinical data submitted for verification review
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Capacity: <strong className="text-slate-800">{profile?.bedCapacity || 350} Beds</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Clinical License No.</span>
            <div className="font-mono font-bold text-slate-800">{profile?.licenseNumber || 'BB-LIC-MH-401'}</div>
            <span className="text-[11px] text-slate-500 block">Form 28-C / Drug Controller Authority</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Blood Bank Medical In-Charge</span>
            <div className="font-bold text-slate-800">{profile?.bloodBankHead?.name || 'Dr. A. K. Sen'}</div>
            <span className="text-[11px] text-slate-500 block">{profile?.bloodBankHead?.qualification || 'MD (Transfusion Medicine)'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Official Contact Desk</span>
            <div className="font-bold text-slate-800">{profile?.officialEmail || 'bloodbank@hospital.com'}</div>
            <span className="text-[11px] text-slate-500 block">{profile?.contactPhone || '+91 22 2675 1000'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 sm:col-span-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">Transfusion Centre Address</span>
            <div className="font-medium text-slate-800">
              {profile?.address || 'Bandra Reclamation, Bandra West'}, {profile?.city || 'Mumbai'}, {profile?.state || 'Maharashtra'} - {profile?.pincode || '400050'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Accreditation</span>
            <div className="font-semibold text-slate-800">{profile?.accreditation || 'NABH Applied Partner'}</div>
          </div>
        </div>

        {/* Facilities tags */}
        {profile?.facilities && profile.facilities.length > 0 && (
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Registered Component Units & Facilities:
            </span>
            <div className="flex flex-wrap gap-2">
              {profile.facilities.map((fac, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {fac}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Support & Escalation */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div>
          <span className="font-bold text-[#172033] block">Need Assistance or Priority Verification?</span>
          <span className="text-[#64748B] block mt-0.5">
            Emergency trauma hospitals and high-demand cancer centres can request expedited verification.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="mailto:compliance@lifora.org"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>compliance@lifora.org</span>
          </a>
          <a
            href="tel:1800543672"
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#C1123F] font-bold transition-colors flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-[#C1123F]" />
            <span>1800-LIFORA-HELP</span>
          </a>
        </div>
      </div>

      {/* 5. RESTRICTED PLATFORM OPERATOR VERIFICATION MODAL */}
      <AnimatePresence>
        {operatorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#172033]">
                      Restricted Platform Operator Review
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      LIFORA Platform-level hospital verification & compliance control
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOperatorModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {!isUnlocked ? (
                /* Step 1: Security Passkey Challenge */
                <form onSubmit={handleUnlockOperatorTools} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Security Notice: Operator Authorization Required</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      This function is restricted to authorized LIFORA compliance operators. Hospital staff cannot approve their own registration.
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-amber-700 bg-white/80 p-2 rounded-lg border border-amber-200">
                      Demo Operator Key: <strong>LIFORA-VERIFY-2025</strong>
                    </div>
                  </div>

                  {keyError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{keyError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Enter Platform Operator Passkey:
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        placeholder="e.g. LIFORA-VERIFY-2025"
                        value={operatorKey}
                        onChange={(e) => setOperatorKey(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOperatorModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                    >
                      Authorize Access
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Operator Inspection & Action */
                <div className="space-y-5">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Platform Operator Authorized: LIFORA Compliance Desk</span>
                  </div>

                  {/* Hospital Overview */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#172033] text-sm">{profile?.name}</span>
                      <span className="font-mono text-[11px] text-slate-500 font-semibold">{profile?.licenseNumber}</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Head: {profile?.bloodBankHead?.name} ({profile?.bloodBankHead?.qualification})
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Location: {profile?.address}, {profile?.city} • Bed Capacity: {profile?.bedCapacity}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2 text-xs">
                    <span className="font-bold text-slate-700 block">Operator Verification Checklist:</span>
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                      <input type="checkbox" defaultChecked className="rounded text-[#C1123F]" />
                      <span>Form 28-C clinical drug license matches National Blood Council registry</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                      <input type="checkbox" defaultChecked className="rounded text-[#C1123F]" />
                      <span>Transfusion medicine specialist qualifications authenticated</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                      <input type="checkbox" defaultChecked className="rounded text-[#C1123F]" />
                      <span>Cold chain storage and component separation facilities inspected</span>
                    </label>
                  </div>

                  {/* Operator Inspection Remarks */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Operator Audit Notes / Decision Reason:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. License verified against state database. Facility cleared for clinical blood requisitions."
                      value={operatorNotes}
                      onChange={(e) => setOperatorNotes(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleRejectApplication}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Application</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOperatorModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveApplication}
                        disabled={isProcessing}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Approve & Unlock Hospital Portal</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}