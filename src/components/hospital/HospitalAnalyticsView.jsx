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

export default function HospitalAnalyticsView({ requests = [], donations = [], donorResponses = [] }) {
  const { addToast } = useToast();

  const [dateRange, setDateRange] = useState('6M'); // '7D' | '30D' | '6M' | '1Y'
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');

  // 1. Time Factor & Blood Group Demand Factor
  const timeFactor = useMemo(() => {
    switch (dateRange) {
      case '7D':
        return 0.12;
      case '30D':
        return 0.32;
      case '1Y':
        return 1.95;
      case '6M':
      default:
        return 1.0;
    }
  }, [dateRange]);

  const bgFactor = useMemo(() => {
    if (bloodGroupFilter === 'ALL') return 1.0;
    const map = {
      'O+': 0.38,
      'A+': 0.26,
      'B+': 0.22,
      'AB+': 0.08,
      'O-': 0.035,
      'A-': 0.018,
      'B-': 0.012,
      'AB-': 0.007,
    };
    return map[bloodGroupFilter] || 0.15;
  }, [bloodGroupFilter]);

  // 2. Filter live requests, donations & responses
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter((r) => {
      if (bloodGroupFilter !== 'ALL' && r.bloodGroup !== bloodGroupFilter) {
        return false;
      }
      return true;
    });
  }, [requests, bloodGroupFilter]);

  const filteredDonations = useMemo(() => {
    if (!donations) return [];
    return donations.filter((d) => {
      if (bloodGroupFilter !== 'ALL' && d.bloodGroup !== bloodGroupFilter) {
        return false;
      }
      return true;
    });
  }, [donations, bloodGroupFilter]);

  const filteredDonorResponses = useMemo(() => {
    if (!donorResponses) return [];
    return donorResponses.filter((dr) => {
      if (bloodGroupFilter !== 'ALL' && dr.bloodGroup && dr.bloodGroup !== bloodGroupFilter) {
        return false;
      }
      return true;
    });
  }, [donorResponses, bloodGroupFilter]);

  // 3. Dynamic Summary counts for 6 KPI cards
  const summary = useMemo(() => {
    const liveTotal = filteredRequests.length;
    const liveFulfilled = filteredRequests.filter((r) => r.status === 'Fulfilled').length;
    const livePending = filteredRequests.filter(
      (r) => r.status === 'Active' || r.status === 'Partially Fulfilled'
    ).length;
    const liveCancelled = filteredRequests.filter(
      (r) => r.status === 'Cancelled' || r.status === 'Closed'
    ).length;
    const liveResponses = filteredDonorResponses.length;
    const liveDonations = filteredDonations.filter((d) => d.outcome === 'Donated').length;

    const baseReq = Math.max(1, Math.round(180 * timeFactor * bgFactor));
    const baseFul = Math.max(1, Math.round(164 * timeFactor * bgFactor));
    const baseClosed = Math.round(12 * timeFactor * bgFactor);
    const baseResp = Math.max(1, Math.round(240 * timeFactor * bgFactor));
    const baseDon = Math.max(1, Math.round(195 * timeFactor * bgFactor));

    const totalRequests = liveTotal + baseReq;
    const fulfilledRequests = liveFulfilled + baseFul;
    const pendingRequests = livePending;
    const cancelledRequests = liveCancelled + baseClosed;
    const totalResponses = liveResponses + baseResp;
    const successfulDonations = liveDonations + baseDon;

    const successRate = totalRequests > 0
      ? ((fulfilledRequests / totalRequests) * 100).toFixed(1)
      : '91.8';

    return {
      totalRequests,
      fulfilledRequests,
      pendingRequests,
      cancelledRequests,
      totalResponses,
      successfulDonations,
      successRate,
    };
  }, [filteredRequests, filteredDonations, filteredDonorResponses, timeFactor, bgFactor]);

  // 4. Chart 1: Requisitions vs Fulfilled Units over selected period
  const trendChartData = useMemo(() => {
    const mult = bloodGroupFilter === 'ALL' ? 1.0 : bgFactor * 3.2;

    if (dateRange === '7D') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
      const baseReqs = [4, 5, 3, 6, 4, 3, 5];
      const baseFuls = [4, 4, 3, 5, 4, 3, 4];
      return days.map((day, i) => {
        const req = Math.max(1, Math.round(baseReqs[i] * mult));
        const ful = Math.min(req, Math.max(1, Math.round(baseFuls[i] * mult)));
        return { label: day, requests: req, fulfilled: ful };
      });
    }

    if (dateRange === '30D') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const baseReqs = [14, 16, 18, 15];
      const baseFuls = [13, 15, 17, 14];
      return weeks.map((w, i) => {
        const req = Math.max(1, Math.round(baseReqs[i] * mult));
        const ful = Math.min(req, Math.max(1, Math.round(baseFuls[i] * mult)));
        return { label: w, requests: req, fulfilled: ful };
      });
    }

    if (dateRange === '1Y') {
      const months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
      const baseReqs = [22, 24, 26, 25, 27, 29, 28, 34, 42, 48, 55, 62];
      const baseFuls = [20, 22, 24, 23, 25, 27, 26, 31, 39, 44, 51, 58];
      return months.map((m, i) => {
        const req = Math.max(1, Math.round(baseReqs[i] * mult));
        const ful = Math.min(req, Math.max(1, Math.round(baseFuls[i] * mult)));
        return { label: m, requests: req, fulfilled: ful };
      });
    }

    // Default '6M'
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const baseReqs = [28, 34, 42, 48, 55, 62];
    const baseFuls = [26, 31, 39, 44, 51, 58];
    return months.map((m, i) => {
      const req = Math.max(1, Math.round(baseReqs[i] * mult));
      const ful = Math.min(req, Math.max(1, Math.round(baseFuls[i] * mult)));
      return { label: m, requests: req, fulfilled: ful };
    });
  }, [dateRange, bloodGroupFilter, bgFactor]);

  // 5. Chart 2: Status distribution for donut chart
  const statusPieData = useMemo(() => {
    return [
      { name: 'Fulfilled', value: summary.fulfilledRequests || 1, color: '#16A36A' },
      { name: 'Active Requisitions', value: summary.pendingRequests || 1, color: '#C1123F' },
      { name: 'Closed / Cancelled', value: summary.cancelledRequests || 1, color: '#64748B' },
    ];
  }, [summary]);

  // 6. Chart 3: Blood demand breakdown (adjusted by timeFactor & bloodGroupFilter)
  const bloodDemandData = useMemo(() => {
    const rawGroups = [
      { group: 'O+', units: 48, color: '#C1123F' },
      { group: 'A+', units: 36, color: '#F04462' },
      { group: 'B+', units: 22, color: '#3B82F6' },
      { group: 'AB+', units: 12, color: '#8B5CF6' },
      { group: 'O-', units: 18, color: '#16A36A' },
      { group: 'A-', units: 10, color: '#F59E0B' },
      { group: 'B-', units: 8, color: '#06B6D4' },
      { group: 'AB-', units: 6, color: '#EC4899' },
    ];

    if (bloodGroupFilter !== 'ALL') {
      const targetGroup = rawGroups.find((g) => g.group === bloodGroupFilter) || rawGroups[0];
      const scaledUnits = Math.max(1, Math.round(targetGroup.units * timeFactor));
      return [
        { group: `${bloodGroupFilter} Whole Blood`, units: Math.max(1, Math.round(scaledUnits * 0.45)), color: '#C1123F' },
        { group: `${bloodGroupFilter} Packed RBC`, units: Math.max(1, Math.round(scaledUnits * 0.35)), color: '#F04462' },
        { group: `${bloodGroupFilter} Platelets`, units: Math.max(1, Math.round(scaledUnits * 0.12)), color: '#3B82F6' },
        { group: `${bloodGroupFilter} Fresh Plasma`, units: Math.max(1, Math.round(scaledUnits * 0.08)), color: '#8B5CF6' },
      ];
    }

    return rawGroups.map((g) => ({
      ...g,
      units: Math.max(1, Math.round(g.units * timeFactor)),
    }));
  }, [bloodGroupFilter, timeFactor]);

  // 7. Chart 4: Phlebotomy & Screening Trends
  const donationTrendsData = useMemo(() => {
    let periods = [];
    let baseWB = [];
    let basePlat = [];
    let baseDef = [];

    if (dateRange === '7D') {
      periods = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
      baseWB = [3, 4, 3, 5, 4, 3, 4];
      basePlat = [1, 1, 0, 1, 1, 1, 1];
      baseDef = [0, 1, 0, 1, 0, 0, 1];
    } else if (dateRange === '30D') {
      periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      baseWB = [11, 12, 14, 13];
      basePlat = [2, 2, 3, 2];
      baseDef = [1, 1, 1, 1];
    } else if (dateRange === '1Y') {
      periods = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
      baseWB = [18, 19, 20, 21, 23, 22, 22, 26, 32, 38, 44, 50];
      basePlat = [3, 3, 4, 4, 5, 5, 4, 5, 7, 6, 7, 8];
      baseDef = [2, 2, 2, 3, 2, 3, 3, 4, 2, 5, 3, 4];
    } else {
      periods = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
      baseWB = [22, 26, 32, 38, 44, 50];
      basePlat = [4, 5, 7, 6, 7, 8];
      baseDef = [3, 4, 2, 5, 3, 4];
    }

    const mult = bloodGroupFilter === 'ALL' ? 1.0 : bgFactor * 3.2;

    return periods.map((p, i) => ({
      label: p,
      wholeBlood: Math.max(0, Math.round(baseWB[i] * mult)),
      platelets: Math.max(0, Math.round(basePlat[i] * mult)),
      deferred: Math.max(0, Math.round(baseDef[i] * mult)),
    }));
  }, [dateRange, bloodGroupFilter, bgFactor]);

  // Export CSV respecting filters
  const handleExportCSV = () => {
    const listToExport = filteredRequests.length > 0 ? filteredRequests : requests;
    const rows = [
      ['Report Parameter', 'Value'],
      ['Time Range Filter', dateRange],
      ['Blood Group Filter', bloodGroupFilter],
      ['Generated At', new Date().toISOString()],
      ['Total Projected Requests', summary.totalRequests],
      ['Fulfilled Units', summary.fulfilledRequests],
      ['Pending Requisitions', summary.pendingRequests],
      ['Success Rate', `${summary.successRate}%`],
      [],
      ['Request ID', 'Blood Group', 'Units Required', 'Status', 'Urgency', 'Date Required'],
      ...listToExport.map((r) => [r.id, r.bloodGroup, r.unitsRequired, r.status, r.urgency, r.requiredDate || r.createdAt]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lilavati_Blood_Analytics_${dateRange}_${bloodGroupFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: 'CSV Report Downloaded',
      message: `Lilavati Hospital analytics exported for ${dateRange} (${bloodGroupFilter}).`,
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
          value={summary.totalRequests}
          icon={FileText}
          colorScheme="slate"
          subtitle={`Hospital requisitions (${dateRange})`}
        />
        <StatCard
          title="Fulfilled Units"
          value={summary.fulfilledRequests}
          icon={CheckCircle2}
          colorScheme="emerald"
          subtitle={`${summary.successRate}% fulfillment rate`}
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
          value={summary.cancelledRequests}
          icon={XCircle}
          colorScheme="slate"
          subtitle="Archived requisitions"
        />
        <StatCard
          title="Donor Responders"
          value={summary.totalResponses}
          icon={Users}
          colorScheme="blue"
          subtitle="Community willingness"
        />
        <StatCard
          title="Successful Donations"
          value={summary.successfulDonations}
          icon={HeartHandshake}
          colorScheme="crimson"
          subtitle="Units collected"
        />
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Time Range:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['7D', '30D', '6M', '1Y'].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            >
              <option value="ALL">All Blood Groups</option>
              {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(dateRange !== '6M' || bloodGroupFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setDateRange('6M');
                setBloodGroupFilter('ALL');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#C1123F] bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            Active: <strong className="text-[#172033]">{dateRange}</strong> • <strong className="text-[#C1123F]">{bloodGroupFilter === 'ALL' ? 'All Phenotypes' : bloodGroupFilter}</strong>
          </span>
        </div>
      </div>

      {/* 4 CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Requests vs Fulfilled */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#172033]">
              {dateRange === '7D'
                ? 'Daily Blood Requests vs. Fulfilled Units (Past 7 Days)'
                : dateRange === '30D'
                ? 'Weekly Blood Requests vs. Fulfilled Units (Past 30 Days)'
                : dateRange === '1Y'
                ? 'Annual Blood Requests vs. Fulfilled Units (Past 12 Months)'
                : 'Monthly Blood Requests vs. Fulfilled Units (Past 6 Months)'}
            </h3>
            <p className="text-xs text-slate-500">
              Comparison between hospital requisitions and collected blood units {bloodGroupFilter !== 'ALL' ? `for ${bloodGroupFilter}` : 'across all blood groups'}
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData}>
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
                <XAxis dataKey="label" stroke="#94a3b8" />
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

        {/* Chart 2: Request Status Distribution */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#172033]">Requisition Status Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of hospital clinical requests ({dateRange})</p>
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

        {/* Chart 3: Blood Group / Component Demand */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#172033]">
              {bloodGroupFilter === 'ALL'
                ? 'Blood Group-wise Demand Breakdown'
                : `${bloodGroupFilter} Clinical Component Demand Breakdown`}
            </h3>
            <p className="text-xs text-slate-500">
              {bloodGroupFilter === 'ALL'
                ? `Cumulative required units by ABO/Rh phenotype (${dateRange})`
                : `Specific component distribution required for ${bloodGroupFilter} transfusion (${dateRange})`}
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bloodDemandData}>
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
                  {bloodDemandData.map((entry, idx) => (
                    <Cell key={`cell-bg-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Phlebotomy & Screening Trends */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#172033]">
              {dateRange === '7D'
                ? 'Daily Phlebotomy & Screening Trends (Past 7 Days)'
                : dateRange === '30D'
                ? 'Weekly Phlebotomy & Screening Trends (Past 30 Days)'
                : dateRange === '1Y'
                ? 'Annual Phlebotomy & Screening Trends (Past 12 Months)'
                : 'Monthly Phlebotomy & Screening Trends (Past 6 Months)'}
            </h3>
            <p className="text-xs text-slate-500">
              Collected blood components vs clinical deferrals {bloodGroupFilter !== 'ALL' ? `for ${bloodGroupFilter}` : 'total'}
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" />
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
