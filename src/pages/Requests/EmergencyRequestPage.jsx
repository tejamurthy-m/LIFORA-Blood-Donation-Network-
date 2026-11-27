import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Phone,
  ShieldAlert,
  ArrowRight,
  Radio,
  Users,
} from 'lucide-react';
import { requestService } from '../../services/requestService';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function EmergencyRequestPage() {
  const { addToast } = useToast();
  const { user } = useAuth();

  const [bloodGroup, setBloodGroup] = useState('O+');
  const [hospitalName, setHospitalName] = useState('Lilavati Hospital, Mumbai');
  const [location, setLocation] = useState('Bandra West Reclamation');
  const [units, setUnits] = useState(2);
  const [contactName, setContactName] = useState('Duty Doctor / Relative');
  const [contactPhone, setContactPhone] = useState('+91 98201 99887');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live emergency tracking state
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [stage, setStage] = useState(1);

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const detectedCity =
        location?.toLowerCase().includes('bangalore') ||
        location?.toLowerCase().includes('bengaluru') ||
        hospitalName?.toLowerCase().includes('bangalore') ||
        hospitalName?.toLowerCase().includes('bengaluru')
          ? 'Bangalore'
          : user?.city || 'Mumbai';

      const result = await requestService.createRequest({
        patientName: 'Critical Emergency Patient',
        bloodGroup,
        unitsRequired: units,
        hospitalName,
        hospitalLocation: location,
        city: detectedCity,
        requiredDate: 'IMMEDIATE',
        urgency: 'Emergency',
        contactPerson: contactName,
        contactPhone,
        additionalInstructions: 'CRITICAL PRIORITY: Bypass surgical team requesting cross-matched blood reserve.',
        requesterId: user?.id || 'user_recipient_1',
      });

      setActiveEmergency(result);
      setStage(2);

      await notificationService.addNotification({
        type: 'emergency',
        rawType: 'EMERGENCY_REQUEST',
        title: 'Emergency Siren Broadcast Active 🚨',
        message: `High-priority requisition (${result.trackingId || 'EMERGENCY'}) for ${units} units of ${bloodGroup} at ${hospitalName} is broadcasting with sound sirens.`,
        metadata: {
          trackingId: result.trackingId,
          bloodGroup,
          hospitalName,
          units,
        },
      });

      addToast({
        title: 'Emergency Broadcast Active!',
        message: `High-priority sirens dispatched to all verified ${bloodGroup} donors nearby.`,
        type: 'emergency',
      });

      // Simulate step progression
      setTimeout(() => {
        setStage(3);
        addToast({
          title: 'Preliminary Response Received',
          message: 'Dr. Aryan S. and 1 other donor confirmed preliminary readiness.',
          type: 'success',
        });
      }, 3500);

      setTimeout(() => {
        setStage(4);
      }, 6500);
    } catch {
      addToast({
        title: 'Broadcast Error',
        message: 'Could not dispatch emergency request.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const emergencyStages = [
    {
      step: 1,
      title: 'Request Submitted',
      desc: 'Encrypted request logged in central dispatch system',
    },
    {
      step: 2,
      title: 'Potential Donors Notified',
      desc: 'Push & SMS priority alerts broadcast to all compatible donors within 15 km',
    },
    {
      step: 3,
      title: 'Donor Responses Received',
      desc: 'Willing donors acknowledging immediate availability',
    },
    {
      step: 4,
      title: 'Coordination in Progress',
      desc: 'Hospital blood bank verifying credentials and cross-matching',
    },
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Top High-Urgency Header */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-red-900 via-[#C1123F] to-red-950 text-white shadow-xl relative overflow-hidden border border-red-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
              <span>HIGH PRIORITY EMERGENCY DESK</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Emergency Blood Broadcast
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-xl leading-relaxed">
              Dispatches automated alerts to all active donors of the specified blood group within 15 km in under 60 seconds.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 text-xs space-y-1">
            <div className="font-bold text-red-200">24/7 Dispatch Hotline</div>
            <div className="text-lg font-black text-white">1800-LIFORA-HELP</div>
            <div className="text-[11px] text-red-300">Toll-free hospital tie-in line</div>
          </div>
        </div>
      </div>

      {/* Emergency Active Live Tracker (If submitted) */}
      {activeEmergency && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-red-200 shadow-lg space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  Live Emergency Response Active
                </span>
              </div>
              <h3 className="text-xl font-black text-[#172033] mt-0.5">
                Tracking ID: {activeEmergency.trackingId}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-red-50 text-[#C1123F] font-extrabold text-sm border border-red-200">
                {activeEmergency.bloodGroup} • {activeEmergency.unitsRequired} Units
              </span>
            </div>
          </div>

          {/* 4 Emergency Stages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {emergencyStages.map((st) => {
              const isPast = stage > st.step;
              const isCurrent = stage === st.step;

              return (
                <div
                  key={st.step}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-red-50 border-red-300 ring-2 ring-red-500/20 shadow-sm'
                      : isPast
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      Stage 0{st.step}
                    </span>
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16A36A]" />
                    ) : isCurrent ? (
                      <Radio className="w-4 h-4 text-[#C1123F] animate-pulse" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-300" />
                    )}
                  </div>

                  <h4
                    className={`text-sm font-bold ${
                      isCurrent
                        ? 'text-[#C1123F]'
                        : isPast
                        ? 'text-emerald-900'
                        : 'text-slate-500'
                    }`}
                  >
                    {st.title}
                  </h4>

                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Mandatory Prompt Disclaimer Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <strong className="text-[#172033]">Important Safety Disclaimer:</strong> Responding to an emergency broadcast indicates a willing donor's preliminary intent to travel to the designated blood bank. A donor response does not guarantee blood availability or medical compatibility until certified hospital blood bank cross-matching is completed.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/find-donors"
              className="px-5 py-2.5 rounded-xl bg-[#C1123F] text-white font-bold text-xs hover:bg-[#9E0E32] transition-colors"
            >
              Search Additional Donors Nearby
            </Link>
          </div>
        </motion.div>
      )}

      {/* Emergency Request Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#172033]">
            Initiate Emergency Blood Broadcast
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Fill in the minimum required details for rapid triage and broadcast.
          </p>
        </div>

        <form onSubmit={handleEmergencySubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                Required Blood Group *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-red-300 bg-red-50/30 text-lg font-black text-[#C1123F] focus:outline-none focus:ring-2 focus:ring-[#C1123F]"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    Blood Group: {bg}
                  </option>
                ))}
              </select>
            </div>

            {/* Units */}
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                Required Units *
              </label>
              <select
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-[#172033] bg-white"
              >
                <option value={1}>1 Unit (Urgent)</option>
                <option value={2}>2 Units (Surgical Standard)</option>
                <option value={3}>3 Units (Trauma / Massive)</option>
                <option value={4}>4+ Units (Critical Care)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hospital Name */}
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                Hospital / Blood Bank Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Lilavati Hospital & Research Centre"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            {/* Hospital Location */}
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                Hospital Area / Landmark *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Bandra West, Mumbai"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contact Name */}
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                Coordinator / Doctor Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. K. Mehta (Oncology Dept)"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                Direct Emergency Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98200 11223"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#C1123F] to-[#F04462] hover:from-[#A00E34] hover:to-[#C1123F] text-white font-extrabold text-sm shadow-xl shadow-red-950/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span>Broadcast High-Priority Emergency Alert</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
