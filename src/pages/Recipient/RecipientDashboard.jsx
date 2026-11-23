import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  AlertTriangle,
  Users,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  Phone,
  ArrowRight,
  Sparkles,
  MapPin,
  Copy,
  Compass,
  Check,
  Building2,
  Heart
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import UserProfileView from '../../components/dashboard/UserProfileView';
import UserSettingsView from '../../components/dashboard/UserSettingsView';
import UserNotificationsView from '../../components/dashboard/UserNotificationsView';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { requestService } from '../../services/requestService';

export default function RecipientDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync route path to specific views
  const isProfileView = location.pathname.includes('/recipient/profile');
  const isSettingsView = location.pathname.includes('/recipient/settings');
  const isNotificationsView = location.pathname.includes('/recipient/notifications');
  const isRequestsView = location.pathname.includes('/recipient/requests');
  const isTrackView = location.pathname.includes('/recipient/track');

  useEffect(() => {
    let isMounted = true;
    requestService.getRequests().then((data) => {
      if (isMounted) {
        setRequests(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    addToast({ title: 'Copied', message: `Tracking ID ${code} copied to clipboard.`, type: 'info' });
  };

  const handleMarkFulfilled = async (id) => {
    try {
      const updated = await requestService.updateStatus(id, 'Fulfilled');
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      addToast({
        title: 'Request Marked Fulfilled',
        message: 'Clinical donation verified and fulfilled.',
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not update request status.', type: 'error' });
    }
  };

  const totalRequests = requests.length;
  const activeRequests = requests.filter((r) => r.status !== 'Fulfilled').length;
  const totalResponses = requests.reduce((acc, r) => acc + (r.donorResponses || 0), 0);
  const fulfilledCount = requests.filter((r) => r.status === 'Fulfilled').length;

  // Route Sub-Views
  if (isProfileView) {
    return <UserProfileView />;
  }

  if (isSettingsView) {
    return <UserSettingsView />;
  }

  if (isNotificationsView) {
    return <UserNotificationsView />;
  }

  // Sub-view: Track Requests
  if (isTrackView) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C1123F] flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#172033]">Live Request Tracking & Hospital Dispatch</h2>
              <p className="text-xs text-[#64748B]">Real-time monitoring of blood requisition stages across certified blood centres</p>
            </div>
          </div>

          <div className="space-y-6">
            {requests.map((req) => (
              <div key={req.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C1123F] text-white flex items-center justify-center font-bold">
                      {req.bloodGroup}
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-500 uppercase">{req.trackingId || req.id}</span>
                      <h4 className="font-bold text-sm text-slate-900">{req.hospitalName}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={req.status} size="sm" />
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                      {req.donorResponses || 0} Donors Responded
                    </span>
                  </div>
                </div>

                {/* 4 Stage Tracker */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  {req.timeline?.map((step) => (
                    <div
                      key={step.step}
                      className={`p-3 rounded-xl border text-xs ${
                        step.done ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[10px] uppercase">Stage 0{step.step}</span>
                        {step.done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <p className="font-bold text-xs">{step.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{step.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Sub-view: My Requests View
  if (isRequestsView) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-[#172033]">My Blood Requisitions</h2>
            <p className="text-xs text-[#64748B]">
              Track patient requests, live broadcast status, and hospital donor arrivals
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/recipient/emergency-request"
              className="px-4 py-2 rounded-xl bg-red-100 text-[#C1123F] font-bold text-xs hover:bg-red-200 transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Emergency Alert</span>
            </Link>

            <Link
              to="/recipient/create-request"
              className="px-4 py-2 rounded-xl bg-[#C1123F] text-white font-bold text-xs hover:bg-[#9E0E32] transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Requisition</span>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C1123F] to-[#F04462] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                    {req.bloodGroup}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {req.trackingId || req.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(req.trackingId || req.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        title="Copy Tracking ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <StatusBadge status={req.urgency} type="urgency" size="sm" />
                    </div>
                    <h4 className="font-bold text-base text-[#172033]">
                      {req.patientName} • {req.unitsRequired} Units at {req.hospitalName}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={req.status} size="sm" />
                  {req.status !== 'Fulfilled' && (
                    <button
                      type="button"
                      onClick={() => handleMarkFulfilled(req.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-[#16A36A] hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>

              {/* 4-Stage Tracker */}
              <div className="pt-3 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {req.timeline?.map((step) => (
                    <div
                      key={step.step}
                      className={`p-3 rounded-2xl border text-xs transition-all ${
                        step.done
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11px]">Stage 0{step.step}</span>
                        {step.done ? (
                          <CheckCircle2 className="w-4 h-4 text-[#16A36A]" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="font-bold text-xs">{step.title}</div>
                      {step.detail && (
                        <div className="text-[10px] mt-1 text-slate-500 leading-tight">
                          {step.detail}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // DEFAULT VIEW: Recipient Dashboard Overview
  return (
    <div className="space-y-8">
      {/* 1. Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#172033] via-[#222E47] to-[#172033] text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C1123F]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-xs font-semibold border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#F04462]" />
              <span>Recipient Care Portal • Patient Coordinator</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || 'Priya Nair'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Coordinate patient blood needs, monitor real-time donor responses, and request emergency life-support units.
            </p>
          </div>

          {/* Quick Actions in Banner */}
          <div className="flex flex-col sm:flex-row gap-3 self-start md:self-auto">
            <Link
              to="/recipient/emergency-request"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#C1123F] hover:bg-[#9E0E32] text-white font-bold text-xs shadow-lg shadow-rose-950/20 transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>Create Emergency Request</span>
            </Link>

            <Link
              to="/recipient/find-donors"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-xs transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Find Nearby Donors</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <StatCard
          title="Total Requests"
          value={totalRequests}
          subtitle="All patient postings"
          icon={FileText}
          colorScheme="blue"
        />
        <StatCard
          title="Active Requests"
          value={activeRequests}
          subtitle="Currently broadcasting"
          icon={Clock}
          colorScheme="crimson"
        />
        <StatCard
          title="Donor Responses"
          value={totalResponses}
          subtitle="Ready to donate"
          icon={Users}
          colorScheme="emerald"
        />
        <StatCard
          title="Fulfilled Units"
          value={fulfilledCount}
          subtitle="Completed transfusions"
          icon={CheckCircle2}
          colorScheme="slate"
        />
      </div>

      {/* 3. Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/recipient/find-donors"
          className="px-4 py-2 rounded-xl bg-[#C1123F] text-white text-xs font-bold hover:bg-[#9E0E32] transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find Available Donors</span>
        </Link>
        <Link
          to="/recipient/create-request"
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Create Planned Request</span>
        </Link>
        <Link
          to="/recipient/track"
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Compass className="w-3.5 h-3.5 text-slate-500" />
          <span>Track Request Dispatches</span>
        </Link>
      </div>

      {/* 4. Active Blood Requests Table & Live Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-[#172033]">
              Recent Blood Requisitions & Coordination Status
            </h3>
            <p className="text-xs text-[#64748B]">
              Real-time dispatch status at partner blood banks
            </p>
          </div>

          <Link
            to="/recipient/requests"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C1123F] hover:text-[#9E0E32]"
          >
            <span>View All Requisitions ({requests.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 space-y-4"
            >
              {/* Request Summary Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#C1123F] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                    {req.bloodGroup}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {req.trackingId || req.id}
                      </span>
                      <StatusBadge status={req.urgency} type="urgency" size="sm" />
                    </div>
                    <h4 className="font-bold text-base text-[#172033]">
                      {req.hospitalName} • {req.unitsRequired} Units
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    {req.donorResponses || 0} Donors Responded
                  </span>
                  <StatusBadge status={req.status} size="sm" />
                </div>
              </div>

              {/* 4-Stage Status Tracker */}
              <div className="pt-3 border-t border-slate-200/60">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Live Dispatch Stages:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {req.timeline?.map((step) => (
                    <div
                      key={step.step}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        step.done
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11px]">Stage 0{step.step}</span>
                        {step.done ? (
                          <CheckCircle2 className="w-4 h-4 text-[#16A36A]" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="font-bold text-xs">{step.title}</div>
                      {step.detail && (
                        <div className="text-[10px] mt-1 text-slate-500 leading-tight">
                          {step.detail}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions & Contact Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#64748B] pt-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{req.hospitalLocation}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Contact: {req.contactPerson}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-medium text-slate-700">{req.contactPhone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
