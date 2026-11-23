import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Heart,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Activity,
  MoreVertical,
  Check,
  X,
  UserX,
  AlertCircle,
  Settings,
  Database,
  Radio,
  Save,
  Lock,
  Download,
  Terminal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import HospitalManagementView from '../../components/admin/HospitalManagementView';
import AdminNotificationsView from '../../components/admin/AdminNotificationsView';
import AdminAnalyticsView from '../../components/admin/AdminAnalyticsView';
import DonorVerificationView from '../../components/admin/DonorVerificationView';
import { getStoredUsers, saveStoredUsers } from '../../services/authService';
import { getStoredDonors, saveStoredDonors } from '../../services/donorService';
import { getStoredRequests, saveStoredRequests } from '../../services/requestService';
import { useToast } from '../../context/ToastContext';

// Chart seed analytics data
const DONATION_TRENDS_DATA = [
  { month: 'Jun', requests: 120, fulfilled: 114 },
  { month: 'Jul', requests: 145, fulfilled: 139 },
  { month: 'Aug', requests: 180, fulfilled: 172 },
  { month: 'Sep', requests: 210, fulfilled: 202 },
  { month: 'Oct', requests: 250, fulfilled: 238 },
  { month: 'Nov', requests: 295, fulfilled: 284 },
];

const BLOOD_DISTRIBUTION_DATA = [
  { name: 'O+', value: 38, count: 5630, color: '#C1123F' },
  { name: 'A+', value: 34, count: 5040, color: '#F04462' },
  { name: 'B+', value: 9, count: 1330, color: '#3B82F6' },
  { name: 'AB+', value: 3, count: 440, color: '#8B5CF6' },
  { name: 'O-', value: 7, count: 1040, color: '#16A36A' },
  { name: 'A-', value: 6, count: 890, color: '#F59E0B' },
  { name: 'B-', value: 2, count: 300, color: '#06B6D4' },
  { name: 'AB-', value: 1, count: 150, color: '#EC4899' },
];

export default function AdminDashboard() {
  const { addToast } = useToast();
  const location = useLocation();

  const [users, setUsers] = useState([]);
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Admin Platform Settings State
  const [defaultRadius, setDefaultRadius] = useState(15);
  const [smsGatewayActive, setSmsGatewayActive] = useState(true);
  const [autoVerifyHospitals, setAutoVerifyHospitals] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Sync route
  const isUsersView = location.pathname.includes('/admin/users');
  const isDonorsView = location.pathname.includes('/admin/donors');
  const isVerificationView = location.pathname.includes('/admin/verification');
  const isRequestsView = location.pathname.includes('/admin/requests');
  const isHospitalsView = location.pathname.includes('/admin/hospitals');
  const isAnalyticsView = location.pathname.includes('/admin/analytics');
  const isFeedbackView = location.pathname.includes('/admin/feedback');
  const isEmergenciesView = location.pathname.includes('/admin/emergencies');
  const isAuditView = location.pathname.includes('/admin/audit');
  const isNotificationsView = location.pathname.includes('/admin/notifications');
  const isSettingsView = location.pathname.includes('/admin/settings');

  useEffect(() => {
    setUsers(getStoredUsers());
    setDonors(getStoredDonors());
    setRequests(getStoredRequests());
  }, []);

  const totalUsers = users.length;
  const totalDonors = donors.length;
  const totalRecipients = users.filter((u) => u.role === 'recipient').length || 24;
  const activeRequests = requests.filter((r) => r.status !== 'Fulfilled').length;
  const fulfilledRequests = requests.filter((r) => r.status === 'Fulfilled').length;
  const pendingVerifications = 6;

  // Toggle user active status or verification
  const handleToggleUserStatus = (userId) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Suspended' ? 'Active' : 'Suspended';
        return { ...u, status: nextStatus };
      }
      return u;
    });
    setUsers(updated);
    saveStoredUsers(updated);
    addToast({
      title: 'User Status Updated',
      message: 'Account privileges updated in system registry.',
      type: 'info',
    });
  };

  const handleUpdateRequestStatus = (requestId, newStatus) => {
    const updated = requests.map((r) => {
      if (r.id === requestId) {
        return { ...r, status: newStatus };
      }
      return r;
    });
    setRequests(updated);
    saveStoredRequests(updated);
    addToast({
      title: 'Blood Request Updated',
      message: `Request status changed to ${newStatus}.`,
      type: 'success',
    });
  };

  const handleSavePlatformSettings = (e) => {
    e.preventDefault();
    addToast({
      title: 'Platform Config Saved',
      message: 'Emergency parameters, SMS gateway, and system rules updated.',
      type: 'success',
    });
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // VIEW 1: Platform Settings View
  if (isSettingsView) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C1123F] flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#172033]">Platform System Settings</h2>
              <p className="text-xs text-[#64748B]">
                Central configuration for emergency dispatch, gateways, and database maintenance
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePlatformSettings} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172033]">
                    Default Emergency Broadcast Radius:
                  </span>
                  <span className="text-xs font-extrabold text-[#C1123F]">{defaultRadius} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="5"
                  value={defaultRadius}
                  onChange={(e) => setDefaultRadius(Number(e.target.value))}
                  className="w-full accent-[#C1123F] cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Radius around hospital within which donors receive immediate siren notifications.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#172033]">SMS & WhatsApp Dispatch Gateway</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Telephony provider connected (Status: Healthy)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsGatewayActive(!smsGatewayActive)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    smsGatewayActive ? 'bg-[#16A36A]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      smsGatewayActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#172033]">Auto-Verify Clinical Requisitions</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Pre-cleared partner hospital IDs broadcast instantly
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoVerifyHospitals(!autoVerifyHospitals)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    autoVerifyHospitals ? 'bg-[#16A36A]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      autoVerifyHospitals ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#172033]">Scheduled System Maintenance</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Locks non-critical edits while keeping emergency hotline open
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    maintenanceMode ? 'bg-[#C1123F]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Database & Backup Operations */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-slate-600" />
                  <span>PostgreSQL Database Snapshots</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Automated backups run daily at 02:00 UTC. Last successful dump: 4 hours ago.
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  addToast({
                    title: 'Backup Created',
                    message: 'Encrypted snapshot saved to secure cold storage.',
                    type: 'success',
                  })
                }
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors self-start sm:self-auto flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup Now</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#C1123F] text-white text-xs font-bold hover:bg-[#9E0E32] transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Platform Configuration</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // VIEW 2: Emergency Desk View
  if (isEmergenciesView) {
    const emergencyRequests = requests.filter((r) => r.urgency === 'Emergency');
    return (
      <div className="space-y-6">
        <div className="bg-red-950 text-white rounded-3xl p-6 sm:p-8 border border-red-800 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h2 className="text-xl font-black tracking-tight">Active Emergency Broadcast Desk</h2>
          </div>
          <p className="text-xs text-red-200 max-w-2xl leading-relaxed">
            Live monitor of critical surgeries, emergency transfusions, and regional hospital requisitions requiring urgent cross-matched donor response.
          </p>
        </div>

        <div className="space-y-4">
          {emergencyRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl p-6 border border-red-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#C1123F] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                    {req.bloodGroup}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">{req.trackingId}</span>
                      <StatusBadge status="Emergency" type="urgency" size="sm" />
                    </div>
                    <h4 className="font-bold text-base text-[#172033]">
                      {req.hospitalName} • {req.unitsRequired} Units
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-[#16A36A] font-bold text-xs border border-emerald-200">
                    {req.donorResponses || 2} Confirmations
                  </span>
                  <StatusBadge status={req.status} size="sm" />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
                <strong>Hospital Directive: </strong>
                {req.additionalInstructions || 'Immediate blood bank cross-match required upon donor arrival.'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // VIEW 3: Analytics & Reports Full Page View
  if (isAnalyticsView) {
    return <AdminAnalyticsView />;
  }

  // VIEW 4: Audit Logs View
  if (isAuditView) {
    const auditLogs = [
      { id: 'a1', action: 'Emergency Request Created', actor: 'Dr. Mehta (Kokilaben Hospital)', target: 'LIF-8831', time: 'Today, 16:00' },
      { id: 'a2', action: 'Donor Verified Badge Issued', actor: 'System Auto-Engine', target: 'Dr. Aryan Sharma (O+)', time: 'Today, 14:20' },
      { id: 'a3', action: 'Hospital Cross-match Verified', actor: 'Lilavati Blood Bank', target: 'LIF-9042', time: 'Yesterday, 19:30' },
      { id: 'a4', action: 'Security Login Challenge Passed', actor: 'Admin Operations', target: 'admin@lifora.org', time: 'Yesterday, 09:12' },
    ];

    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#172033]">Security Audit & Compliance Logs</h2>
          <p className="text-xs text-[#64748B]">
            Tamper-evident system activity log ensuring HIPAA compliance and data integrity
          </p>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="font-bold text-[#172033]">{log.action}</span>
                  <span className="text-slate-400 block text-[11px] mt-0.5">By {log.actor} • Ref: {log.target}</span>
                </div>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // VIEW 5: Donor Verification View
  if (isVerificationView) {
    return <DonorVerificationView />;
  }

  // VIEW 6: Hospital Network Management View
  if (isHospitalsView) {
    return <HospitalManagementView />;
  }

  // VIEW 8: Notifications & Alerts Communication Center
  if (isNotificationsView) {
    return <AdminNotificationsView />;
  }

  // VIEW 7: Feedback & Complaints View
  if (isFeedbackView) {
    const feedbackList = [
      { id: 'f1', from: 'Suresh K. (Attendant)', msg: 'Emergency blood arrived in under 20 minutes for my father surgery at Lilavati. Thank you LIFORA team!', rating: '5 Stars', status: 'Resolved' },
      { id: 'f2', from: 'Dr. Anita Joshi (Transfusion Officer)', msg: 'Donor identification QR codes scanned smoothly at counter 2.', rating: '5 Stars', status: 'Resolved' },
      { id: 'f3', from: 'Kavita Sharma (Donor)', msg: 'Suggested adding reminder notifications 1 day prior to next eligibility date.', rating: 'Feedback', status: 'Under Review' },
    ];

    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[#172033]">Patient & Donor Grievances & Feedback</h2>
          <p className="text-xs text-[#64748B]">Audited feedback submissions from hospital coordinators and community donors</p>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {feedbackList.map((f) => (
            <div key={f.id} className="py-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{f.from}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                  {f.status}
                </span>
              </div>
              <p className="text-slate-600">{f.msg}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // DEFAULT / DASHBOARD / USERS / DONORS / REQUESTS VIEW
  return (
    <div className="space-y-8">
      {/* 6 Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Users" value={totalUsers + 14800} icon={Users} colorScheme="slate" />
        <StatCard title="Total Donors" value={totalDonors + 12400} icon={Heart} colorScheme="crimson" />
        <StatCard title="Recipients" value={totalRecipients + 2400} icon={Activity} colorScheme="blue" />
        <StatCard title="Active Requests" value={activeRequests} icon={Clock} colorScheme="amber" />
        <StatCard title="Fulfilled" value={fulfilledRequests + 8940} icon={CheckCircle2} colorScheme="emerald" />
        <StatCard title="Pending Verify" value={pendingVerifications} icon={AlertTriangle} colorScheme="crimson" />
      </div>

      {/* Analytics Charts Section (Rendered on Dashboard Overview) */}
      {!isUsersView && !isDonorsView && !isRequestsView && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#172033]">
                  Monthly Blood Requests vs. Hospital Deliveries
                </h3>
                <p className="text-xs text-[#64748B]">
                  Aggregate fulfillment trajectory across major hospital networks
                </p>
              </div>
              <span className="text-xs font-bold text-[#16A36A] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                96.2% Fulfillment
              </span>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DONATION_TRENDS_DATA}>
                  <defs>
                    <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C1123F" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#C1123F" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fulGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A36A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16A36A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#172033',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#C1123F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#reqGrad)"
                    name="Requests"
                  />
                  <Area
                    type="monotone"
                    dataKey="fulfilled"
                    stroke="#16A36A"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#fulGrad)"
                    name="Fulfilled"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                Registered Donor Blood Group Share
              </h3>
              <p className="text-xs text-[#64748B]">
                Active donor availability by blood group
              </p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BLOOD_DISTRIBUTION_DATA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#172033',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="value" fill="#C1123F" radius={[0, 6, 6, 0]}>
                    {BLOOD_DISTRIBUTION_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Admin Management Workspace Tables */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/users"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isUsersView || (!isDonorsView && !isRequestsView)
                  ? 'bg-rose-50 text-[#C1123F]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              User & Donor Management ({users.length})
            </Link>

            <Link
              to="/admin/requests"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isRequestsView ? 'bg-rose-50 text-[#C1123F]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Blood Request Dispatch ({requests.length})
            </Link>

            <Link
              to="/admin/donors"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isDonorsView ? 'bg-rose-50 text-[#C1123F]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Verified Donor Network ({donors.length})
            </Link>
          </div>

          {/* Search bar inside table */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#C1123F]"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="donor">Donors</option>
              <option value="recipient">Recipients</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Request Management Table */}
        {isRequestsView ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">ID / Patient</th>
                  <th className="px-6 py-3.5">Blood Type</th>
                  <th className="px-6 py-3.5">Hospital</th>
                  <th className="px-6 py-3.5">Urgency</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#172033]">{r.patientName}</div>
                      <div className="text-[11px] text-slate-400">{r.trackingId || r.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#C1123F] font-bold text-xs border border-rose-200">
                        {r.bloodGroup} ({r.unitsRequired} Units)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="font-semibold text-[#172033]">{r.hospitalName}</div>
                      <div className="text-[11px] text-slate-400">{r.city}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.urgency} type="urgency" size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status !== 'Fulfilled' ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateRequestStatus(r.id, 'Fulfilled')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#16A36A] hover:bg-emerald-100 font-bold text-xs"
                        >
                          Mark Fulfilled
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : isDonorsView ? (
          /* Donor Network Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Donor</th>
                  <th className="px-6 py-3.5">Blood Type</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Availability</th>
                  <th className="px-6 py-3.5">Total Donations</th>
                  <th className="px-6 py-3.5 text-right">Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {donors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#172033]">{d.name}</div>
                      <div className="text-[11px] text-slate-400">{d.area}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#C1123F] font-bold text-xs border border-rose-200">
                        {d.bloodGroup}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{d.city}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={d.isAvailable ? 'Available' : 'Unavailable'} type="availability" size="sm" />
                    </td>
                    <td className="px-6 py-4 font-bold text-[#172033]">{d.totalDonations} times</td>
                    <td className="px-6 py-4 text-right">
                      <StatusBadge status={d.badge} type="badge" size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* User Management Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Blood Type</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#172033]">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize font-semibold text-slate-700">{u.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      {u.bloodGroup ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#C1123F] font-bold text-xs border border-rose-200">
                          {u.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.city || 'Mumbai'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          u.status === 'Suspended'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-[#16A36A] border border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'Suspended' ? 'bg-rose-600' : 'bg-[#16A36A]'
                          }`}
                        />
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          u.status === 'Suspended'
                            ? 'bg-emerald-50 text-[#16A36A] hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                      >
                        {u.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
