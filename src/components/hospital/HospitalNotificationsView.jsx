import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Check,
  AlertTriangle,
  Radio,
  FileText,
  Users,
  Eye,
  CheckCheck,
} from 'lucide-react';
import StatCard from '../common/StatCard';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function HospitalNotificationsView({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
}) {
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Summary counts
  const summary = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    const urgent = notifications.filter((n) => n.priority === 'Urgent').length;
    const requestsCount = notifications.filter((n) => n.category === 'Requests').length;
    return { total, unread, urgent, requestsCount };
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (categoryFilter !== 'ALL' && n.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchMsg = n.message.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg) return false;
      }
      return true;
    });
  }, [notifications, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
            Hospital Notifications Centre
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time requisition broadcasts, donor responses, arrival alerts, and hemovigilance updates
          </p>
        </div>

        {summary.unread > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Alerts"
          value={summary.total}
          icon={Bell}
          colorScheme="slate"
          subtitle="Hospital inbox logs"
        />
        <StatCard
          title="Unread Messages"
          value={summary.unread}
          icon={Clock}
          colorScheme="crimson"
          subtitle="Requires attention"
        />
        <StatCard
          title="Urgent Broadcasts"
          value={summary.urgent}
          icon={AlertTriangle}
          colorScheme="amber"
          subtitle="Priority surgery notices"
        />
        <StatCard
          title="Request Alerts"
          value={summary.requestsCount}
          icon={FileText}
          colorScheme="blue"
          subtitle="Requisition dispatches"
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications by title or message text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          {['ALL', 'Requests', 'Arrivals', 'Donations', 'System'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-[#172033] text-white shadow-sm'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Alerts' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#172033]">Operational Alerts Feed</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {filteredNotifications.length} Alerts
            </span>
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#172033]">Inbox is Clear</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hospital notifications found matching your search.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-5 sm:p-6 transition-colors flex items-start justify-between gap-4 ${
                  !notif.read ? 'bg-rose-50/20' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${
                      !notif.read ? 'bg-[#C1123F]' : 'bg-slate-300'
                    }`}
                  />

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-bold text-sm ${!notif.read ? 'text-[#172033]' : 'text-slate-700'}`}>
                        {notif.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {notif.category}
                      </span>
                      {notif.priority === 'Urgent' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-[#C1123F]">
                          Urgent
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>

                    <p className="text-[11px] text-slate-400 pt-0.5">
                      {notif.timestamp} • {notif.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(notif.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteNotification(notif.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
