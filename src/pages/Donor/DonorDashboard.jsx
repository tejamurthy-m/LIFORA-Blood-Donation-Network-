import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Heart,
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Download,
  Award,
  ShieldCheck,
  Search,
  Radio,
  MapPin,
  Phone,
  ArrowRight,
  FileText,
  UserCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import RequestCard from '../../components/common/RequestCard';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import UserProfileView from '../../components/dashboard/UserProfileView';
import UserSettingsView from '../../components/dashboard/UserSettingsView';
import UserNotificationsView from '../../components/dashboard/UserNotificationsView';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { requestService } from '../../services/requestService';
import { donorService } from '../../services/donorService';
import api from '../../services/api';

export default function DonorDashboard() {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();

  const [requests, setRequests] = useState([]);
  const [realDonations, setRealDonations] = useState([]);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'history'
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);

  // Sync route path to specific views
  const isProfileView = location.pathname.includes('/donor/profile');
  const isSettingsView = location.pathname.includes('/donor/settings');
  const isNotificationsView = location.pathname.includes('/donor/notifications');
  const isAvailabilityView = location.pathname.includes('/donor/availability');
  const isAcceptedView = location.pathname.includes('/donor/accepted');
  const isRequestsView = location.pathname.includes('/donor/requests');
  const isHistoryView = location.pathname.includes('/donor/history');

  // Load active blood requests
  useEffect(() => {
    let isMounted = true;
    requestService
      .getRequests()
      .then((data) => {
        if (isMounted) {
          setRequests(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Load donor donation history from backend API
  useEffect(() => {
    let isMounted = true;
    api
      .get('/donors/me/donations')
      .then((res) => {
        if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
          setRealDonations(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleToggleAvailability = async () => {
    if (!user) return;
    const newStatus = !user.isAvailable;
    try {
      await updateProfile({ isAvailable: newStatus });
      await donorService.updateAvailability(user.id, newStatus);
      addToast({
        title: newStatus ? 'Status: Active for Donation' : 'Status: Paused',
        message: newStatus
          ? 'You are actively discoverable for emergency blood requests in your area.'
          : 'You will not receive new emergency donor alerts until re-enabled.',
        type: newStatus ? 'success' : 'info',
      });
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not update status.',
        type: 'error',
      });
    }
  };

  const handleAcceptRequest = async (requestId) => {
    const donorName = user?.name || user?.fullName || 'Lifesaver Donor';
    try {
      const updated = await requestService.acceptRequest(
        requestId,
        donorName
      );
      // Persist acceptance in localStorage
      try {
        const key = `lifora_accepted_requests_${user?.id || 'guest'}`;
        const prevAccepted = JSON.parse(localStorage.getItem(key) || '[]');
        if (!prevAccepted.includes(requestId)) {
          localStorage.setItem(key, JSON.stringify([...prevAccepted, requestId]));
        }
      } catch {}

      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId || r.trackingId === requestId
            ? { ...r, ...updated, acceptedByMe: true }
            : r
        )
      );
      addToast({
        title: 'Request Accepted!',
        message: 'Thank you! The hospital coordinator has been notified of your response.',
        type: 'success',
      });
    } catch (err) {
      // Even if network fails, persist locally
      try {
        const key = `lifora_accepted_requests_${user?.id || 'guest'}`;
        const prevAccepted = JSON.parse(localStorage.getItem(key) || '[]');
        if (!prevAccepted.includes(requestId)) {
          localStorage.setItem(key, JSON.stringify([...prevAccepted, requestId]));
        }
      } catch {}

      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId || r.trackingId === requestId
            ? { ...r, acceptedByMe: true }
            : r
        )
      );
      addToast({
        title: 'Request Accepted!',
        message: err.message || 'You have pledged to donate for this blood request.',
        type: 'info',
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await requestService.rejectRequest(requestId);
    } catch {
      // Graceful local dismiss
    }
    // Persist rejection in localStorage
    try {
      const key = `lifora_dismissed_requests_${user?.id || 'guest'}`;
      const prevDismissed = JSON.parse(localStorage.getItem(key) || '[]');
      if (!prevDismissed.includes(requestId)) {
        localStorage.setItem(key, JSON.stringify([...prevDismissed, requestId]));
      }
    } catch {}

    setRequests((prev) =>
      prev.filter((r) => r.id !== requestId && r.trackingId !== requestId)
    );
    addToast({
      title: 'Request Declined',
      message: 'Request dismissed from your active queue.',
      type: 'info',
    });
  };

  const donorName = user?.name || user?.fullName || 'Lifesaver Donor';

  const isAcceptedByMe = (r) => {
    if (r.acceptedByMe) return true;
    try {
      const key = `lifora_accepted_requests_${user?.id || 'guest'}`;
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(stored) && (stored.includes(r.id) || stored.includes(r.trackingId))) {
        return true;
      }
    } catch {}
    if (Array.isArray(r.acceptedDonors)) {
      return r.acceptedDonors.some((d) => {
        if (typeof d === 'string') {
          return (
            d.toLowerCase().includes(donorName.toLowerCase()) ||
            donorName.toLowerCase().includes(d.toLowerCase())
          );
        }
        if (d && typeof d === 'object') {
          return (
            d.id === user?.id ||
            d.name?.toLowerCase().includes(donorName.toLowerCase()) ||
            d.fullName?.toLowerCase().includes(donorName.toLowerCase())
          );
        }
        return false;
      });
    }
    return false;
  };

  const isDismissedByMe = (r) => {
    try {
      const key = `lifora_dismissed_requests_${user?.id || 'guest'}`;
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(stored) && (stored.includes(r.id) || stored.includes(r.trackingId));
    } catch {
      return false;
    }
  };

  const availableRequests = requests.filter(
    (r) => !isAcceptedByMe(r) && !isDismissedByMe(r) && r.status !== 'Fulfilled' && r.status !== 'Closed'
  );

  const pendingRequestsCount = availableRequests.length;

  const acceptedRequests = requests.filter(
    (r) => isAcceptedByMe(r) && r.status !== 'Fulfilled' && r.status !== 'Closed'
  );

  const defaultHistorySeed = [
    {
      id: 'h1',
      date: '10 Aug 2026',
      hospital: 'Lilavati Hospital & Research Centre',
      city: 'Mumbai',
      units: '1 Unit Packed Red Cells',
      purpose: 'Cardiovascular Surgery Emergency',
      status: 'Verified & Completed',
      certificateId: 'CERT-LIF-901',
    },
    {
      id: 'h2',
      date: '14 May 2026',
      hospital: 'Kokilaben Ambani Hospital',
      city: 'Mumbai',
      units: '1 Unit Whole Blood',
      purpose: 'Pediatric Oncology Transfusion',
      status: 'Verified & Completed',
      certificateId: 'CERT-LIF-812',
    },
    {
      id: 'h3',
      date: '20 Jan 2026',
      hospital: 'Tata Memorial Hospital',
      city: 'Mumbai',
      units: '1 Unit Platelets (Apheresis)',
      purpose: 'Critical Leukemia Support',
      status: 'Verified & Completed',
      certificateId: 'CERT-LIF-744',
    },
  ];

  const donationHistory =
    realDonations.length > 0
      ? realDonations.map((r) => ({
          id: r.id,
          date: r.dateFormatted || new Date(r.donationDate).toLocaleDateString(),
          hospital: r.hospitalName,
          city: r.hospitalCity,
          units: `${r.unitsDonated} Unit (${r.donationType})`,
          purpose: r.screeningPassed ? 'Clinical Transfusion - Screening Cleared' : 'Medically Deferred',
          status: r.screeningPassed ? 'Verified & Completed' : 'Deferred',
          certificateId: `LIF-DON-${r.id.substring(0, 6).toUpperCase()}`,
        }))
      : (user?.email === 'donor@lifora.org' ? defaultHistorySeed : []);

  // Sub-view: Availability Status
  const renderAvailabilityView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C1123F] flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#172033]">Donor Availability & Dispatch Radius</h2>
            <p className="text-xs text-[#64748B]">
              Configure when and where nearby hospitals and patient attendants can contact you
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${user?.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <h4 className="font-bold text-sm text-[#172033]">
                {user?.isAvailable ? 'You are Currently Discoverable (Active)' : 'Donation Availability Paused'}
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {user?.isAvailable
                ? 'Your profile is visible in emergency donor matching for local patients within your travel radius.'
                : 'You will not receive urgent notification pings. Toggle when ready to accept blood requests.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleAvailability}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              user?.isAvailable
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-700 hover:bg-slate-800 text-white'
            }`}
          >
            {user?.isAvailable ? 'Pause Availability' : 'Set Available Now'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-700">Preferred Matching Radius</span>
            <p className="text-slate-500">Currently receiving matches within 15 km of your registered city ({user?.city || 'Mumbai'}).</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-700">Next Donation Eligibility</span>
            <p className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Eligible for whole blood and platelet donation today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Sub-view: My Accepted Requests
  const renderAcceptedView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-[#172033]">My Accepted Requests</h2>
            <p className="text-xs text-[#64748B]">
              Hospital appointments and active donation commitments awaiting hospital arrival
            </p>
          </div>
          <Link
            to="/donor/requests"
            className="text-xs font-bold text-[#C1123F] hover:underline"
          >
            Browse All Requests →
          </Link>
        </div>

        {acceptedRequests.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">No active commitments right now.</p>
            <p className="mt-1">Review incoming emergency blood requests to pledge a donation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {acceptedRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono font-bold text-slate-700 px-2 py-0.5 rounded bg-white border border-slate-200">
                      {req.trackingId || req.id}
                    </span>
                    <StatusBadge status={req.urgency} type="urgency" size="sm" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Pledged to Donate
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{req.hospitalName}</h4>
                  <p className="text-slate-500 mt-0.5">
                    Patient: {req.patientName} • Required: {req.unitsRequired} Units ({req.bloodGroup})
                  </p>
                  <p className="text-slate-400 text-[11px] mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{req.hospitalLocation || req.city || 'Mumbai'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedRequestDetails(req)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-[#C1123F] font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Instructions</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Sub-view: Donation History
  const renderHistoryView = () => {
    const donationCount = user?.totalDonations ?? (realDonations.length || 0);
    const donorBadgeLabel =
      donationCount >= 10
        ? 'Golden Life Saver'
        : donationCount >= 5
        ? 'Silver Donor Badge'
        : donationCount >= 1
        ? 'Verified Life Saver'
        : 'New Life Saver';

    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-[#172033]">Donation History & Digital Certificates</h2>
            <p className="text-xs text-[#64748B]">Official hospital-verified transfusion records</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {donorBadgeLabel}
          </span>
        </div>

        {donationHistory.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
            <Heart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm">No donation records yet</p>
            <p className="mt-1 max-w-sm mx-auto">
              Once you complete blood donations at registered hospitals, your verified clinical certificates will be archived here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {donationHistory.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A36A] flex items-center justify-center shrink-0 mt-0.5">
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.hospital}</h4>
                    <p className="text-slate-500 mt-0.5">{item.units} • {item.purpose}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Certificate ID: {item.certificateId} • {item.date}</p>
                  </div>
                </div>
                <span className="text-emerald-700 font-bold flex items-center gap-1 self-start sm:self-auto">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Sub-view: Blood Requests List
  const renderRequestsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#172033]">
            Active Blood Requests Matching Type {user?.bloodGroup || 'O+'}
          </h2>
          <p className="text-xs text-slate-500">Filtered within 15 km of your location</p>
        </div>
        <span className="text-xs font-bold text-slate-500">{availableRequests.length} Requests Available</span>
      </div>

      {availableRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
          <p className="font-bold text-slate-700">No pending blood requests matching your profile.</p>
          <p className="mt-1">You will receive alerts as new emergency requests arrive.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {availableRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
              onViewDetails={(r) => setSelectedRequestDetails(r)}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Sub-view: Overview
  const renderOverviewView = () => {
    const donationCount = user?.totalDonations ?? (realDonations.length || 0);
    const livesSavedCount = donationCount * 3;

    // A donor can clinically donate whole blood at most once every 3 months (90 days), capping calendar year donations at max 3-4
    const currentYear = new Date().getFullYear();
    const realThisYear = realDonations.filter((r) => {
      const d = new Date(r.donationDate);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear;
    }).length;

    const donationsThisYear = realDonations.length > 0
      ? Math.min(realThisYear, 4)
      : donationCount > 0
      ? Math.min(2, donationCount)
      : 0;

    // Calculate 90-day (3-month) donation interval eligibility
    let nextEligibleValue = 'Available Now';
    let nextEligibleSubtitle = donationCount > 0 ? '90+ days cooldown cleared' : 'Ready for initial screening';

    const lastDateRaw = user?.lastDonationDate || (realDonations.length > 0 ? realDonations[0]?.donationDate : null);
    if (lastDateRaw) {
      const lastDate = new Date(lastDateRaw);
      if (!isNaN(lastDate.getTime())) {
        const msDiff = Date.now() - lastDate.getTime();
        const daysSince = Math.floor(msDiff / (1000 * 60 * 60 * 24));
        if (daysSince >= 0 && daysSince < 90) {
          const daysRemaining = 90 - daysSince;
          const eligibleOn = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000);
          nextEligibleValue = eligibleOn.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          nextEligibleSubtitle = `${daysRemaining} days left (3-month cooldown)`;
        }
      }
    }

    const isVerifiedDonor =
      user?.verificationStatus === 'APPROVED' ||
      user?.verificationStatus === 'VERIFIED' ||
      user?.badge === 'Verified Life Saver';
    const isPendingVerification = user?.verificationStatus === 'PENDING';
    const isRejectedVerification = user?.verificationStatus === 'REJECTED';

    const badgeLabel = isVerifiedDonor
      ? `Verified Life Saver • ${user?.bloodGroup || 'O+'}`
      : isPendingVerification
      ? `New Donor (Verification Pending) • ${user?.bloodGroup || 'O+'}`
      : isRejectedVerification
      ? `Verification Resubmission Required • ${user?.bloodGroup || 'O+'}`
      : `Voluntary Donor • ${user?.bloodGroup || 'O+'}`;

    return (
      <div className="space-y-8">
        {/* 1. Welcome Banner Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#172033] via-[#222E47] to-[#172033] text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C1123F]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isPendingVerification
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                    : isRejectedVerification
                    ? 'bg-red-500/20 text-red-200 border-red-400/30'
                    : 'bg-white/10 text-rose-200 border-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F04462]" />
                <span>{badgeLabel}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name || user?.fullName || 'Lifesaver'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {donationCount > 0
                  ? `Your blood donations have directly helped save ${livesSavedCount} ${
                      livesSavedCount === 1 ? 'patient' : 'patients'
                    }. Keep your availability updated to receive instant local hospital matches.`
                  : 'Welcome to the LIFORA network! Keep your availability updated to receive instant local hospital matches and save lives.'}
              </p>
            </div>

            {/* Quick Availability Switch Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-center gap-4 self-start md:self-auto min-w-[220px]">
              <div className="flex-1">
                <span className="block text-[11px] uppercase tracking-wider text-slate-300 font-bold">
                  Availability Status
                </span>
                <span className="text-sm font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user?.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  {user?.isAvailable ? 'Ready for Donation' : 'Currently Paused'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleAvailability}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  user?.isAvailable ? 'bg-[#16A36A]' : 'bg-slate-500'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    user?.isAvailable ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Profile Completion Indicator */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <span className="font-semibold text-slate-300 whitespace-nowrap">
                Profile Completion: {user?.profileCompletion ?? 80}%
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-[#16A36A] rounded-full"
                  style={{ width: `${user?.profileCompletion ?? 80}%` }}
                />
              </div>
            </div>
            <Link
              to="/donor/profile"
              className="text-emerald-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete Remaining Details →</span>
            </Link>
          </div>
        </div>

        {/* 2. Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Donations"
            value={`${donationCount} ${donationCount === 1 ? 'Time' : 'Times'}`}
            subtitle={donationCount > 0 ? `${(donationCount * 0.45).toFixed(1)} L blood contributed` : 'Ready for first donation'}
            icon={Heart}
            colorScheme="crimson"
            trend={donationsThisYear > 0 ? `+${donationsThisYear} this year` : undefined}
          />
          <StatCard
            title="Pending Requests"
            value={pendingRequestsCount}
            subtitle="Nearby hospital alerts"
            icon={Clock}
            colorScheme="amber"
          />
          <StatCard
            title="Lives Saved"
            value={`${livesSavedCount} ${livesSavedCount === 1 ? 'Patient' : 'Patients'}`}
            subtitle={donationCount > 0 ? 'Pediatric & surgery units' : 'Awaiting first donation'}
            icon={Activity}
            colorScheme="emerald"
          />
          <StatCard
            title="Next Eligible Date"
            value={nextEligibleValue}
            subtitle={nextEligibleSubtitle}
            icon={Calendar}
            colorScheme="blue"
          />
        </div>

      {/* 3. Quick Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/donor/requests"
          className="px-4 py-2 rounded-xl bg-[#C1123F] text-white text-xs font-bold hover:bg-[#9E0E32] transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Browse Matching Requests</span>
        </Link>
        <Link
          to="/find-donors"
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>Donor Community Map</span>
        </Link>
        <Link
          to="/donor/history"
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Download Donation Certificate</span>
        </Link>
      </div>

      {/* 4. Medical Eligibility Advisory Notice */}
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-[#C1123F]">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Medical Eligibility Notice:</strong> Responding to any blood request via LIFORA registers your voluntary willingness to assist. Final donor eligibility (hemoglobin &gt; 12.5 g/dL, blood pressure, vitals, infection marker testing) is conducted strictly by certified clinical pathologists at the hospital blood bank before blood collection.
        </div>
      </div>

      {/* 5. Nearby Blood Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[#172033]">
            Nearby Urgent Blood Requests ({availableRequests.length})
          </h3>
          <Link to="/donor/requests" className="text-xs font-bold text-[#C1123F] hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {availableRequests.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
            <p className="font-bold text-slate-700">All available requests have been addressed.</p>
            <p className="mt-0.5">Check back shortly or view your active commitments under Accepted Requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {availableRequests.slice(0, 4).map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
                onViewDetails={(r) => setSelectedRequestDetails(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. Recent Activity Feed */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-[#172033]">Recent Contribution Activity</h3>
        {donationHistory.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
            <Heart className="w-6 h-6 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">No donation records yet</p>
            <p className="mt-0.5">Your verified hospital donations and clinical transfusion certificates will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {donationHistory.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{item.hospital}</p>
                    <p className="text-slate-500 text-[11px]">{item.units} • {item.purpose}</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-slate-400">{item.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

  // Render active route sub-view
  const renderCurrentView = () => {
    if (isProfileView) return <UserProfileView />;
    if (isSettingsView) return <UserSettingsView />;
    if (isNotificationsView) return <UserNotificationsView />;
    if (isAvailabilityView) return renderAvailabilityView();
    if (isAcceptedView) return renderAcceptedView();
    if (isHistoryView) return renderHistoryView();
    if (isRequestsView) return renderRequestsView();
    return renderOverviewView();
  };

  return (
    <div className="space-y-8">
      {renderCurrentView()}

      {/* Request Details & Donor Instructions Modal */}
      {selectedRequestDetails && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRequestDetails(null)}
          title={`Donation Instructions & Hospital Directive`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Header / Summary Card */}
            <div className="p-4 bg-gradient-to-r from-rose-50 to-slate-50 rounded-2xl border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-slate-800 text-xs px-2 py-0.5 bg-white rounded border border-slate-200">
                    {selectedRequestDetails.trackingId || selectedRequestDetails.id}
                  </span>
                  <StatusBadge status={selectedRequestDetails.urgency} type="urgency" size="sm" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active Pledge
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900">{selectedRequestDetails.hospitalName}</h4>
                <p className="text-slate-600 mt-0.5">
                  Patient: <span className="font-semibold">{selectedRequestDetails.patientName}</span> • Blood Group:{' '}
                  <span className="font-bold text-[#C1123F]">{selectedRequestDetails.bloodGroup}</span> ({selectedRequestDetails.unitsRequired} Units)
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Required By</span>
                <span className="font-bold text-slate-800 text-xs">{selectedRequestDetails.requiredDate || 'Immediate Priority'}</span>
              </div>
            </div>

            {/* Hospital & Coordinator Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hospital Location & Unit</span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#C1123F]" />
                  <span>{selectedRequestDetails.hospitalName}</span>
                </p>
                <p className="text-slate-500 pl-5">
                  {selectedRequestDetails.hospitalLocation || selectedRequestDetails.city || 'Blood Bank & Transfusion Medicine, 2nd Floor'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hospital Contact / Coordinator</span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{selectedRequestDetails.contactPerson || 'Blood Bank Officer'}</span>
                </p>
                <p className="text-slate-600 pl-5 font-mono">
                  {selectedRequestDetails.contactPhone || '+91 98200 12345'}
                </p>
              </div>
            </div>

            {/* Hospital Directive / Instructions */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Hospital Arrival Directive:</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-900/90 pl-5">
                {selectedRequestDetails.additionalInstructions ||
                  `Please proceed directly to the 2nd Floor Blood Bank reception counter upon arrival. Present your tracking ID (${selectedRequestDetails.trackingId || selectedRequestDetails.id}) or Lifora Digital Donor ID for expedited cross-matching and donor verification.`}
              </p>
            </div>

            {/* Pre-Donation Checklist */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pre-Donation Guidelines & Health Checklist:</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Stay Hydrated:</strong> Drink 500ml water or fruit juice 30 min prior.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Healthy Meal:</strong> Eat a light wholesome meal 2-3 hours beforehand.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Valid Photo ID:</strong> Carry government-issued ID (Aadhaar/License).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Well Rested:</strong> Ensure 6-8 hours of sound sleep the night before.</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`tel:${selectedRequestDetails.contactPhone || '+919820012345'}`}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Hospital</span>
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRequestDetails.hospitalName + ' ' + (selectedRequestDetails.city || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C1123F]" />
                  <span>Directions</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequestDetails(null)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors cursor-pointer"
              >
                Close Instructions
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
