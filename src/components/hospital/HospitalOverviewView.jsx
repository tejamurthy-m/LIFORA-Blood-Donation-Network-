import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Users,
  Clock,
  HeartHandshake,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Building2,
  Calendar,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  UserCheck,
} from 'lucide-react';
import StatCard from '../common/StatCard';
import StatusBadge from '../common/StatusBadge';
import CreateBloodRequestModal from './CreateBloodRequestModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../services/hospitalPortalService';

export default function HospitalOverviewView({
  hospitalState,
  onNavigate,
  onOpenCreateRequest,
  onCreateRequest,
  onCheckInDonor,
}) {
  const { user, staffRole } = useAuth();
  const { addToast } = useToast();

  const [isLocalCreateOpen, setIsLocalCreateOpen] = useState(false);

  const { profile, requests, donorResponses, arrivals, donations, notifications } = hospitalState;

  // Calculate 6 Summary KPIs
  const kpis = useMemo(() => {
    const activeRequests = requests.filter(
      (r) => r.status === 'Active' || r.status === 'Partially Fulfilled'
    ).length;

    const totalResponses = donorResponses.length;

    const expectedArrivals = arrivals.filter((a) => a.arrivalStatus === 'Expected').length;

    const successfulDonations = donations.filter((d) => d.outcome === 'Donated').length;

    const pendingArrivals = arrivals.filter(
      (a) => a.arrivalStatus === 'Expected' && a.expectedDate === new Date().toISOString().split('T')[0]
    ).length || expectedArrivals;

    // Requirements near completion (>= 70% fulfilled but not yet closed)
    const nearCompletion = requests.filter((r) => {
      const donCount = donations
        .filter((d) => d.requestId === r.id && d.outcome === 'Donated')
        .reduce((sum, d) => sum + (d.unitsCollected || 1), 0);
      const pct = (donCount / r.unitsRequired) * 100;
      return pct >= 60 && r.status !== 'Fulfilled' && r.status !== 'Closed';
    }).length;

    return {
      activeRequests,
      totalResponses,
      expectedArrivals,
      successfulDonations,
      pendingArrivals,
      nearCompletion,
    };
  }, [requests, donorResponses, arrivals, donations]);

  // Blood group breakdown for active requirements
  const bloodGroupDemand = useMemo(() => {
    const map = {};
    requests
      .filter((r) => r.status === 'Active' || r.status === 'Partially Fulfilled')
      .forEach((r) => {
        const donCount = donations
          .filter((d) => d.requestId === r.id && d.outcome === 'Donated')
          .reduce((sum, d) => sum + (d.unitsCollected || 1), 0);
        const rem = Math.max(0, r.unitsRequired - donCount);
        map[r.bloodGroup] = (map[r.bloodGroup] || 0) + rem;
      });

    return ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((bg) => ({
      group: bg,
      unitsNeeded: map[bg] || 0,
    }));
  }, [requests, donations]);

  // Permissions
  const canCreateRequest = staffRole === 'hospital_admin' || staffRole === 'request_manager';
  const canManageArrivals = staffRole === 'hospital_admin' || staffRole === 'donor_coordinator';
  const canRecordDonations = staffRole === 'hospital_admin' || staffRole === 'medical_staff';

  return (
    <div className="space-y-6">
      {/* 1. HOSPITAL BANNER */}
      <div className="bg-gradient-to-r from-[#172033] via-[#1E293B] to-[#172033] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#C1123F]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[#F04462] text-xs font-bold tracking-wide">
              <Building2 className="w-3.5 h-3.5" />
              <span>{profile.name} • {profile.licenseNumber}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Transfusion Medicine & Blood Centre</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>NABH Verified</span>
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Live hospital dispatch operations centre. Monitor active emergency requisitions, coordinate voluntary donor arrivals, and record certified hemovigilance outcomes.
            </p>
          </div>

          {/* Quick Actions in Banner */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {canCreateRequest && (
              <button
                type="button"
                onClick={() => {
                  setIsLocalCreateOpen(true);
                  if (onOpenCreateRequest) onOpenCreateRequest();
                }}
                className="px-4 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-950/30 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Blood Request</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('arrivals')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-2"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Manage Arrivals</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 6 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Active Requests"
          value={kpis.activeRequests}
          icon={FileText}
          colorScheme="crimson"
          subtitle="Hospital requisitions"
        />
        <StatCard
          title="Donor Responses"
          value={kpis.totalResponses}
          icon={Users}
          colorScheme="blue"
          subtitle="Community responders"
        />
        <StatCard
          title="Expected Arrivals"
          value={kpis.expectedArrivals}
          icon={Clock}
          colorScheme="amber"
          subtitle="Scheduled visits"
        />
        <StatCard
          title="Successful Units"
          value={kpis.successfulDonations}
          icon={HeartHandshake}
          colorScheme="emerald"
          subtitle="Collected donations"
        />
        <StatCard
          title="Pending Arrivals"
          value={kpis.pendingArrivals}
          icon={Activity}
          colorScheme="slate"
          subtitle="Awaiting counter check-in"
        />
        <StatCard
          title="Near Complete"
          value={kpis.nearCompletion}
          icon={TrendingUp}
          colorScheme="purple"
          subtitle=">= 60% fulfilled"
        />
      </div>

      {/* 3. BLOOD GROUP-WISE ACTIVE REQUIREMENTS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#172033]">
              Blood Group-wise Active Requirements
            </h3>
            <p className="text-xs text-slate-500">
              Current hospital blood bank deficits requiring voluntary donor allocation
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('tracking')}
            className="text-xs font-bold text-[#C1123F] hover:underline flex items-center gap-1"
          >
            <span>Requirement Tracker</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {bloodGroupDemand.map((item) => (
            <div
              key={item.group}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                item.unitsNeeded > 0
                  ? 'bg-rose-50/60 border-rose-200'
                  : 'bg-slate-50 border-slate-200/70 opacity-60'
              }`}
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#C1123F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm mb-2">
                {item.group}
              </div>
              <div className="text-lg font-black text-[#172033]">
                {item.unitsNeeded} <span className="text-[10px] font-medium text-slate-500">Units</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                {item.unitsNeeded > 0 ? 'Needed' : 'Sufficient'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. MAIN SPLIT: RECENT BLOOD REQUESTS + UPCOMING DONOR ARRIVALS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Blood Requests (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#172033]">
                Recent Blood Requests
              </h3>
              <p className="text-xs text-slate-500">
                Hospital wards and operating theater requisitions
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('requests')}
              className="text-xs font-bold text-[#C1123F] hover:underline flex items-center gap-1"
            >
              <span>View All ({requests.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {requests.slice(0, 4).map((req) => {
              const reqDonations = donations
                .filter((d) => d.requestId === req.id && d.outcome === 'Donated')
                .reduce((sum, d) => sum + (d.unitsCollected || 1), 0);
              const pct = Math.min(100, Math.round((reqDonations / req.unitsRequired) * 100));

              return (
                <div key={req.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C1123F] flex items-center justify-center font-extrabold text-sm border border-rose-100">
                        {req.bloodGroup}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#172033]">{req.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-500">{req.location}</span>
                          <StatusBadge status={req.urgency} type="urgency" size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {req.patientRef} • Needed by {req.requiredDate}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <StatusBadge status={req.status} size="sm" />
                      <div className="text-[11px] font-bold text-slate-700 mt-1">
                        {reqDonations} / {req.unitsRequired} Units ({pct}%)
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 100 ? 'bg-[#16A36A]' : pct > 0 ? 'bg-[#C1123F]' : 'bg-slate-300'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Upcoming Donor Arrivals (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#172033]">
                Upcoming Donor Arrivals
              </h3>
              <p className="text-xs text-slate-500">
                Scheduled donor visits awaiting check-in
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('arrivals')}
              className="text-xs font-bold text-[#C1123F] hover:underline flex items-center gap-1"
            >
              <span>Manage ({arrivals.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {arrivals.slice(0, 4).map((arr) => {
              const isArrived = arr.arrivalStatus === 'Arrived';

              return (
                <div key={arr.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#172033] flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {arr.bloodGroup}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#172033] truncate">{arr.donorName}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {arr.expectedDate} at {arr.expectedTime} • {arr.receptionPoint}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isArrived ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#16A36A] font-bold text-[11px] border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Arrived</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onCheckInDonor(arr.id)}
                        disabled={!canManageArrivals}
                        className="px-2.5 py-1 rounded-lg bg-[#C1123F] hover:bg-[#9E0E32] text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title={canManageArrivals ? 'Confirm donor arrival' : 'Requires Donor Coordinator role'}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Check In</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. RECENT DONATIONS & HOSPITAL NOTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Donation Activities (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#172033]">
                Recent Donation Activities
              </h3>
              <p className="text-xs text-slate-500">
                Phlebotomy outcomes logged by authorized Medical Staff
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('donations')}
              className="text-xs font-bold text-[#C1123F] hover:underline flex items-center gap-1"
            >
              <span>View All Records</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {donations.slice(0, 4).map((don) => (
              <div key={don.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      don.outcome === 'Donated'
                        ? 'bg-emerald-50 text-[#16A36A] border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {don.bloodGroup}
                  </div>
                  <div>
                    <span className="font-bold text-[#172033]">{don.donorName}</span>
                    <span className="text-slate-400 block text-[11px] mt-0.5">
                      {don.outcome === 'Donated'
                        ? `${don.unitsCollected} Unit Collected (${don.componentType})`
                        : `Deferred: ${don.deferralReason || 'Clinical deferral'}`}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      don.outcome === 'Donated'
                        ? 'bg-emerald-100 text-[#16A36A]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {don.outcome}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    By {don.recordedByStaffName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Hospital Notifications (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#172033]">
                Hospital Operational Alerts
              </h3>
              <p className="text-xs text-slate-500">
                Live blood requisitions and arrival dispatches
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="text-xs font-bold text-[#C1123F] hover:underline flex items-center gap-1"
            >
              <span>Inbox ({notifications.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="py-2.5 flex items-start gap-2.5">
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    !n.read ? 'bg-[#C1123F]' : 'bg-slate-300'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className={`font-bold text-[#172033] ${!n.read ? 'text-black' : 'text-slate-700'}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-1 mt-0.5">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {n.timestamp} • {n.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Blood Request Modal */}
      <CreateBloodRequestModal
        isOpen={isLocalCreateOpen}
        onClose={() => setIsLocalCreateOpen(false)}
        onCreateRequest={async (payload) => {
          if (onCreateRequest) {
            await onCreateRequest(payload);
          }
          setIsLocalCreateOpen(false);
        }}
      />
    </div>
  );
}
