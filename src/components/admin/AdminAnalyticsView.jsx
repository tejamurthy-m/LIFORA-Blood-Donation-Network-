import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  Filter,
  Download,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Heart,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  MapPin,
  PieChart as PieIcon,
  BarChart3,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import StatCard from '../common/StatCard';
import { useToast } from '../../context/ToastContext';

// Color palette constants aligned with LIFORA brand
const COLORS = {
  primary: '#C1123F',
  secondary: '#F04462',
  emerald: '#16A36A',
  midnight: '#172033',
  blue: '#3B82F6',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  slate: '#64748B',
};

// Base Seed Datasets for different time periods
const DATA_BY_PERIOD = {
  '7d': {
    requestsVsFulfilled: [
      { name: 'Mon', requests: 14, fulfilled: 13 },
      { name: 'Tue', requests: 19, fulfilled: 18 },
      { name: 'Wed', requests: 22, fulfilled: 21 },
      { name: 'Thu', requests: 16, fulfilled: 15 },
      { name: 'Fri', requests: 25, fulfilled: 24 },
      { name: 'Sat', requests: 28, fulfilled: 27 },
      { name: 'Sun', requests: 18, fulfilled: 17 },
    ],
    donationTrends: [
      { name: 'Mon', units: 13 },
      { name: 'Tue', units: 18 },
      { name: 'Wed', units: 21 },
      { name: 'Thu', units: 15 },
      { name: 'Fri', units: 24 },
      { name: 'Sat', units: 27 },
      { name: 'Sun', units: 17 },
    ],
    kpis: {
      totalRequests: 142,
      fulfilledRequests: 135,
      pendingRequests: 5,
      cancelledRequests: 2,
      registeredDonors: 14820,
      totalDonations: 135,
      prevRequests: 130,
    },
  },
  '30d': {
    requestsVsFulfilled: [
      { name: 'Week 1', requests: 68, fulfilled: 65 },
      { name: 'Week 2', requests: 74, fulfilled: 71 },
      { name: 'Week 3', requests: 82, fulfilled: 79 },
      { name: 'Week 4', requests: 91, fulfilled: 88 },
    ],
    donationTrends: [
      { name: 'Week 1', units: 65 },
      { name: 'Week 2', units: 71 },
      { name: 'Week 3', units: 79 },
      { name: 'Week 4', units: 88 },
    ],
    kpis: {
      totalRequests: 315,
      fulfilledRequests: 303,
      pendingRequests: 8,
      cancelledRequests: 4,
      registeredDonors: 14820,
      totalDonations: 303,
      prevRequests: 280,
    },
  },
  '6m': {
    requestsVsFulfilled: [
      { name: 'Jun', requests: 120, fulfilled: 114 },
      { name: 'Jul', requests: 145, fulfilled: 139 },
      { name: 'Aug', requests: 180, fulfilled: 172 },
      { name: 'Sep', requests: 210, fulfilled: 202 },
      { name: 'Oct', requests: 250, fulfilled: 238 },
      { name: 'Nov', requests: 295, fulfilled: 284 },
    ],
    donationTrends: [
      { name: 'Jun', units: 114 },
      { name: 'Jul', units: 139 },
      { name: 'Aug', units: 172 },
      { name: 'Sep', units: 202 },
      { name: 'Oct', units: 238 },
      { name: 'Nov', units: 284 },
    ],
    kpis: {
      totalRequests: 1200,
      fulfilledRequests: 1149,
      pendingRequests: 36,
      cancelledRequests: 15,
      registeredDonors: 14820,
      totalDonations: 1149,
      prevRequests: 1040,
    },
  },
  '1y': {
    requestsVsFulfilled: [
      { name: 'Dec', requests: 95, fulfilled: 89 },
      { name: 'Jan', requests: 102, fulfilled: 96 },
      { name: 'Feb', requests: 110, fulfilled: 104 },
      { name: 'Mar', requests: 118, fulfilled: 112 },
      { name: 'Apr', requests: 125, fulfilled: 119 },
      { name: 'May', requests: 132, fulfilled: 126 },
      { name: 'Jun', requests: 140, fulfilled: 134 },
      { name: 'Jul', requests: 155, fulfilled: 148 },
      { name: 'Aug', requests: 180, fulfilled: 172 },
      { name: 'Sep', requests: 210, fulfilled: 202 },
      { name: 'Oct', requests: 250, fulfilled: 238 },
      { name: 'Nov', requests: 295, fulfilled: 284 },
    ],
    donationTrends: [
      { name: 'Dec', units: 89 },
      { name: 'Jan', units: 96 },
      { name: 'Feb', units: 104 },
      { name: 'Mar', units: 112 },
      { name: 'Apr', units: 119 },
      { name: 'May', units: 126 },
      { name: 'Jun', units: 134 },
      { name: 'Jul', units: 148 },
      { name: 'Aug', units: 172 },
      { name: 'Sep', units: 202 },
      { name: 'Oct', units: 238 },
      { name: 'Nov', units: 284 },
    ],
    kpis: {
      totalRequests: 2112,
      fulfilledRequests: 2024,
      pendingRequests: 58,
      cancelledRequests: 30,
      registeredDonors: 14820,
      totalDonations: 2024,
      prevRequests: 1780,
    },
  },
};

// Blood Group distribution across donors
const BASE_BLOOD_DISTRIBUTION = [
  { group: 'O+', donors: 5630, percentage: 38, color: '#C1123F' },
  { group: 'A+', donors: 5040, percentage: 34, color: '#F04462' },
  { group: 'B+', donors: 1330, percentage: 9, color: '#3B82F6' },
  { group: 'AB+', donors: 440, percentage: 3, color: '#8B5CF6' },
  { group: 'O-', donors: 1040, percentage: 7, color: '#16A36A' },
  { group: 'A-', donors: 890, percentage: 6, color: '#F59E0B' },
  { group: 'B-', donors: 300, percentage: 2, color: '#06B6D4' },
  { group: 'AB-', donors: 150, percentage: 1, color: '#EC4899' },
];

// City-wise demand distribution
const BASE_CITY_DATA = [
  { city: 'Mumbai', requests: 520, fulfilled: 504 },
  { city: 'Bangalore', requests: 380, fulfilled: 365 },
  { city: 'Delhi NCR', requests: 310, fulfilled: 294 },
  { city: 'Pune', requests: 240, fulfilled: 231 },
  { city: 'Chennai', requests: 190, fulfilled: 182 },
  { city: 'Hyderabad', requests: 160, fulfilled: 152 },
];

// Request status pie data
const BASE_STATUS_DATA = [
  { name: 'Fulfilled', value: 8940, color: '#16A36A' },
  { name: 'In Progress / Accepted', value: 42, color: '#3B82F6' },
  { name: 'Pending Match', value: 18, color: '#F59E0B' },
  { name: 'Cancelled by Hospital', value: 24, color: '#64748B' },
  { name: 'Rejected (Ineligible)', value: 12, color: '#C1123F' },
];

// Donor Availability distribution
const BASE_AVAILABILITY_DATA = [
  { status: 'Available Now', count: 11420, color: '#16A36A' },
  { status: 'Paused / Busy', count: 2600, color: '#F59E0B' },
  { status: 'Temporarily Inactive', count: 800, color: '#64748B' },
];

const CITIES = ['All Cities', 'Mumbai', 'Bangalore', 'Delhi', 'Pune', 'Chennai', 'Hyderabad'];
const BLOOD_GROUPS = ['All Types', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function AdminAnalyticsView() {
  const { addToast } = useToast();

  // Filters State
  const [timeRange, setTimeRange] = useState('6m'); // '7d' | '30d' | '6m' | '1y' | 'custom'
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('All Types');
  const [customStart, setCustomStart] = useState('2026-05-01');
  const [customEnd, setCustomEnd] = useState('2026-11-23');

  // Multiplier logic to realistically adjust numbers when filtering by City or Blood Group
  const filterMultiplier = useMemo(() => {
    let mult = 1.0;
    if (selectedCity !== 'All Cities') mult *= 0.35;
    if (selectedBloodGroup !== 'All Types') mult *= 0.22;
    return mult;
  }, [selectedCity, selectedBloodGroup]);

  // Active dataset derived from timeRange and filters
  const currentPeriodKey = timeRange === 'custom' ? '6m' : timeRange;
  const rawPeriodData = DATA_BY_PERIOD[currentPeriodKey] || DATA_BY_PERIOD['6m'];

  // Scaled KPIs
  const kpis = useMemo(() => {
    const raw = rawPeriodData.kpis;
    const total = Math.max(1, Math.round(raw.totalRequests * filterMultiplier));
    const fulfilled = Math.round(raw.fulfilledRequests * filterMultiplier);
    const pending = Math.round(raw.pendingRequests * filterMultiplier);
    const cancelled = Math.round(raw.cancelledRequests * filterMultiplier);
    const donors = Math.round(raw.registeredDonors * (selectedBloodGroup === 'All Types' ? (selectedCity === 'All Cities' ? 1 : 0.35) : 0.15));
    const donations = Math.round(raw.totalDonations * filterMultiplier);

    const prev = Math.round(raw.prevRequests * filterMultiplier);
    const pctChange = prev > 0 ? (((total - prev) / prev) * 100).toFixed(1) : null;

    return {
      totalRequests: total,
      fulfilledRequests: fulfilled,
      pendingRequests: pending,
      cancelledRequests: cancelled,
      registeredDonors: donors,
      totalDonations: donations,
      pctChange,
      fulfillmentRate: total > 0 ? ((fulfilled / total) * 100).toFixed(1) : '95.8',
    };
  }, [rawPeriodData, filterMultiplier, selectedBloodGroup, selectedCity]);

  // Scaled Charts Data
  const requestsVsFulfilledData = useMemo(() => {
    return rawPeriodData.requestsVsFulfilled.map((d) => ({
      ...d,
      requests: Math.max(1, Math.round(d.requests * filterMultiplier)),
      fulfilled: Math.max(1, Math.round(d.fulfilled * filterMultiplier)),
    }));
  }, [rawPeriodData, filterMultiplier]);

  const donationTrendsData = useMemo(() => {
    return rawPeriodData.donationTrends.map((d) => ({
      ...d,
      units: Math.max(1, Math.round(d.units * filterMultiplier)),
    }));
  }, [rawPeriodData, filterMultiplier]);

  const bloodDistributionData = useMemo(() => {
    if (selectedBloodGroup !== 'All Types') {
      return BASE_BLOOD_DISTRIBUTION.filter((b) => b.group === selectedBloodGroup);
    }
    return BASE_BLOOD_DISTRIBUTION;
  }, [selectedBloodGroup]);

  const cityData = useMemo(() => {
    if (selectedCity !== 'All Cities') {
      return BASE_CITY_DATA.filter((c) => c.city.toLowerCase().includes(selectedCity.toLowerCase()));
    }
    return BASE_CITY_DATA;
  }, [selectedCity]);

  const statusData = useMemo(() => {
    return BASE_STATUS_DATA.map((s) => ({
      ...s,
      value: Math.max(1, Math.round(s.value * filterMultiplier)),
    }));
  }, [filterMultiplier]);

  const availabilityData = useMemo(() => {
    return BASE_AVAILABILITY_DATA.map((a) => ({
      ...a,
      count: Math.max(1, Math.round(a.count * (selectedCity === 'All Cities' ? 1 : 0.35))),
    }));
  }, [selectedCity]);

  // Reset Filters
  const handleResetFilters = () => {
    setTimeRange('6m');
    setSelectedCity('All Cities');
    setSelectedBloodGroup('All Types');
    addToast({ title: 'Filters Reset', message: 'Report parameters restored to 6-month national view.', type: 'info' });
  };

  // Export CSV functionality
  const handleExportCSV = () => {
    const headers = 'Category,Metric / Label,Value,Notes\n';
    const summaryRows = [
      `Summary,Time Range,${timeRange.toUpperCase()},Filter applied`,
      `Summary,Geographic Scope,${selectedCity},Regional boundary`,
      `Summary,Blood Group Scope,${selectedBloodGroup},Component type`,
      `Summary,Total Requests,${kpis.totalRequests},Cumulative count`,
      `Summary,Fulfilled Requests,${kpis.fulfilledRequests},Fulfillment: ${kpis.fulfillmentRate}%`,
      `Summary,Pending Requests,${kpis.pendingRequests},Active in dispatch queue`,
      `Summary,Cancelled Requests,${kpis.cancelledRequests},Hospital cancellation rate: 2.1%`,
      `Summary,Active Donors,${kpis.registeredDonors},Verified voluntary registry`,
      `Summary,Total Units Donated,${kpis.totalDonations},Component deliveries`,
    ].join('\n');

    const monthlyRows = requestsVsFulfilledData
      .map((d) => `Monthly Trajectory,${d.name},${d.requests} Requests,${d.fulfilled} Fulfilled`)
      .join('\n');

    const bloodRows = bloodDistributionData
      .map((b) => `Blood Type Distribution,${b.group},${b.donors} Donors,${b.percentage}% Share`)
      .join('\n');

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        `# LIFORA BLOOD NETWORK - EXECUTIVE CLINICAL REPORT\n# Generated: ${new Date().toISOString()}\n\n` +
          headers +
          summaryRows +
          '\n' +
          monthlyRows +
          '\n' +
          bloodRows
      );

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `LIFORA_Analytics_Report_${timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: 'Report Exported Successfully',
      message: 'Comprehensive analytics dataset downloaded as CSV.',
      type: 'success',
    });
  };

  // Download PDF / Print Report functionality
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:p-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#C1123F] text-xs font-bold border border-rose-200 mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Healthcare Telemetry & Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#172033] tracking-tight">
            Reports & Analytics Dashboard
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Real-time fulfillment metrics, spatial demand patterns, and blood bank supply trends.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto print:hidden">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-[#16A36A] hover:bg-emerald-50/50 text-[#172033] text-xs font-bold shadow-xs transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#16A36A]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-4 py-2.5 rounded-2xl bg-[#172033] hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Download PDF / Print</span>
          </button>
        </div>
      </div>

      {/* C. Interactive Report Filters Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#C1123F]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">
              Report Parameters & Scope
            </h3>
          </div>

          {(timeRange !== '6m' || selectedCity !== 'All Cities' || selectedBloodGroup !== 'All Types') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#C1123F] hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Parameters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Time Range Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Time Horizon
            </label>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '6m', label: '6M' },
                { id: '1y', label: '1Y' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeRange(t.id)}
                  className={`py-1.5 rounded-lg transition-all ${
                    timeRange === t.id
                      ? 'bg-white text-[#C1123F] shadow-xs'
                      : 'text-slate-600 hover:text-[#172033]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* City Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Geographic Region
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Blood Group Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Blood Group Segment
            </label>
            <select
              value={selectedBloodGroup}
              onChange={(e) => setSelectedBloodGroup(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Custom Range
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setTimeRange('custom');
                }}
                className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-200 text-[11px] font-medium"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  setTimeRange('custom');
                }}
                className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-200 text-[11px] font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* A. 6 Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Blood Requests"
          value={kpis.totalRequests.toLocaleString()}
          subtitle="In selected period"
          trend={kpis.pctChange ? `+${kpis.pctChange}%` : null}
          icon={FileText}
          colorScheme="slate"
        />
        <StatCard
          title="Fulfilled Requests"
          value={kpis.fulfilledRequests.toLocaleString()}
          subtitle={`${kpis.fulfillmentRate}% success rate`}
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <StatCard
          title="Pending Requests"
          value={kpis.pendingRequests.toLocaleString()}
          subtitle="Active in dispatch"
          icon={Clock}
          colorScheme="amber"
        />
        <StatCard
          title="Cancelled Requests"
          value={kpis.cancelledRequests.toLocaleString()}
          subtitle="Cancelled by hospital"
          icon={XCircle}
          colorScheme="crimson"
        />
        <StatCard
          title="Registered Donors"
          value={kpis.registeredDonors.toLocaleString()}
          subtitle="Verified network pool"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Total Units Donated"
          value={`${kpis.totalDonations.toLocaleString()} U`}
          subtitle="Units safely infused"
          icon={Heart}
          colorScheme="crimson"
        />
      </div>

      {/* B. 6 Analytics Charts arranged in Responsive 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Monthly Blood Requests vs. Fulfilled Requests (Line / Area Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                1. Blood Requests vs. Fulfilled Deliveries
              </h3>
              <p className="text-xs text-[#64748B]">
                Comparison between hospital requisitions received and verified donations
              </p>
            </div>
            <span className="text-xs font-extrabold text-[#16A36A] bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              {kpis.fulfillmentRate}% Fulfilled
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={requestsVsFulfilledData}>
                <defs>
                  <linearGradient id="areaReqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="areaFulGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172033',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke={COLORS.primary}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaReqGrad)"
                  name="Requests Received"
                />
                <Area
                  type="monotone"
                  dataKey="fulfilled"
                  stroke={COLORS.emerald}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaFulGrad)"
                  name="Fulfilled Deliveries"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Blood Group Distribution (Bar Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                2. Blood Group Distribution Across Donors
              </h3>
              <p className="text-xs text-[#64748B]">
                Active verified donors categorized by ABO and Rh factor
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
              Universal O-: 7%
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bloodDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="group" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172033',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  formatter={(val) => [`${val.toLocaleString()} Donors`, 'Count']}
                />
                <Bar dataKey="donors" radius={[6, 6, 0, 0]}>
                  {bloodDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Request Status Distribution (Donut / Pie Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                3. Request Status Breakdown
              </h3>
              <p className="text-xs text-[#64748B]">
                Lifecycle resolution of all clinical blood requisitions
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              Low Cancellation (2%)
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172033',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Monthly Donation Trends (Bar Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                4. Completed Blood Donation Trends
              </h3>
              <p className="text-xs text-[#64748B]">
                Total volume of blood components collected and cleared
              </p>
            </div>
            <span className="text-xs font-bold text-[#C1123F] bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
              +14% Growth
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172033',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  formatter={(val) => [`${val} Units`, 'Donations Cleared']}
                />
                <Bar dataKey="units" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 5: City-wise Blood Requests (Horizontal Bar Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                5. City-Wise Blood Request Demand
              </h3>
              <p className="text-xs text-[#64748B]">
                Hospital requisition volume across major regional hubs
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
              Top: Mumbai & BLR
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="city" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172033',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="requests" fill={COLORS.blue} name="Total Requests" radius={[0, 4, 4, 0]} />
                <Bar dataKey="fulfilled" fill={COLORS.emerald} name="Fulfilled" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 6: Donor Availability Distribution (Donut / Bar Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                6. Donor Availability & Engagement Share
              </h3>
              <p className="text-xs text-[#64748B]">
                Status of registered donors ready for instant emergency alerts
              </p>
            </div>
            <span className="text-xs font-bold text-[#16A36A] bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              77% Ready
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={availabilityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {availabilityData.map((entry, index) => (
                    <Cell key={`avail-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172033',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  formatter={(val) => [`${val.toLocaleString()} Donors`, 'Status']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
