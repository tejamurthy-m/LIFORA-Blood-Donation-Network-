import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  Trash2,
  Check,
  Search,
  Filter,
  ShieldCheck,
  Archive,
  Eye,
  PlusCircle,
  Users,
  Activity,
  Radio,
  Share2,
  FileText,
  X,
  MessageSquare,
  AlertCircle,
  History,
} from 'lucide-react';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { useToast } from '../../context/ToastContext';
import {
  adminNotificationService,
  getStoredAdminNotifications,
  getStoredAdminAnnouncements,
} from '../../services/adminNotificationService';

const CATEGORY_TABS = [
  'All Notifications',
  'Emergency Alerts',
  'User Activity',
  'System Alerts',
  'Announcements',
];

export default function AdminNotificationsView() {
  const { addToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All Notifications');
  const [activeView, setActiveView] = useState('inbox'); // 'inbox' | 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedNotif, setSelectedNotif] = useState(null);

  // Modals state
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Send Notification Form State
  const [sendTitle, setSendTitle] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendAudience, setSendAudience] = useState('All users');
  const [sendType, setSendType] = useState('Emergency Broadcast');
  const [sendPriority, setSendPriority] = useState('Critical');
  const [isSending, setIsSending] = useState(false);

  // Load notifications and announcements
  const loadData = () => {
    setNotifications(getStoredAdminNotifications());
    setAnnouncements(getStoredAdminAnnouncements());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary Metrics calculations
  const totalNotifications = notifications.length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const emergencyCount = notifications.filter(
    (n) => n.category === 'Emergency Alerts' || n.priority === 'Critical'
  ).length;
  const sentAnnouncementsCount = announcements.length;

  // Filtered Notifications list
  const filteredNotifications = notifications.filter((n) => {
    const matchesCategory =
      activeCategory === 'All Notifications' ||
      n.category.toLowerCase() === activeCategory.toLowerCase();

    const matchesPriority =
      priorityFilter === 'All' || n.priority.toLowerCase() === priorityFilter.toLowerCase();

    const matchesSearch =
      searchQuery.trim() === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.relatedUser && n.relatedUser.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.relatedRef && n.relatedRef.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesPriority && matchesSearch && !n.archived;
  });

  // Action handlers
  const handleToggleRead = async (id) => {
    try {
      const updated = await adminNotificationService.toggleRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
      addToast({
        title: updated.read ? 'Marked as Read' : 'Marked as Unread',
        message: updated.title,
        type: 'info',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not update read status.', type: 'error' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const list = await adminNotificationService.markAllRead();
      setNotifications(list);
      addToast({
        title: 'All Marked as Read',
        message: 'All notifications in the communication center have been marked read.',
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not mark all as read.', type: 'error' });
    }
  };

  const handleArchive = async (id) => {
    try {
      await adminNotificationService.archiveNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      addToast({
        title: 'Archived',
        message: 'Notification moved to communication archive.',
        type: 'info',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not archive notification.', type: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await adminNotificationService.deleteNotification(deleteConfirmId);
      setNotifications((prev) => prev.filter((n) => n.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      addToast({
        title: 'Notification Deleted',
        message: 'The alert has been permanently removed from the log.',
        type: 'info',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not delete notification.', type: 'error' });
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!sendTitle.trim() || !sendMessage.trim()) {
      addToast({
        title: 'Validation Error',
        message: 'Please provide both title and broadcast message.',
        type: 'error',
      });
      return;
    }

    setIsSending(true);
    try {
      const created = await adminNotificationService.sendAnnouncement({
        title: sendTitle,
        message: sendMessage,
        targetAudience: sendAudience,
        type: sendType,
        priority: sendPriority,
      });

      loadData();
      setIsSendModalOpen(false);
      setSendTitle('');
      setSendMessage('');
      addToast({
        title: 'Announcement Dispatched!',
        message: `Broadcasting to ${created.recipientCount.toLocaleString()} users (${sendAudience}).`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Dispatch Error', message: 'Could not send announcement.', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  // Helper for priority pill styling
  const getPriorityBadge = (priority) => {
    const p = priority?.toLowerCase();
    if (p === 'critical') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-[#C1123F] border border-red-200 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C1123F] animate-ping" />
          Critical Priority
        </span>
      );
    }
    if (p === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          High Priority
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Medium Priority
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Low Priority
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Main Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#C1123F] text-xs font-bold border border-rose-200 mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Admin Communication & Dispatch Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#172033] tracking-tight">
            Notifications & Alerts Management
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Real-time emergency broadcast monitoring, platform incident alerts, and outgoing user announcements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              unreadCount > 0
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Mark All Read</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSendModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold shadow-md shadow-[#C1123F]/20 flex items-center gap-2 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Notification</span>
          </button>
        </div>
      </div>

      {/* A. 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Notifications"
          value={totalNotifications}
          subtitle="All platform logs & pings"
          icon={Bell}
          colorScheme="slate"
        />
        <StatCard
          title="Unread Notifications"
          value={unreadCount}
          subtitle="Pending admin review"
          icon={Clock}
          colorScheme="crimson"
        />
        <StatCard
          title="Emergency Alerts"
          value={emergencyCount}
          subtitle="Critical surgical requisitions"
          icon={AlertTriangle}
          colorScheme="amber"
        />
        <StatCard
          title="Sent Announcements"
          value={sentAnnouncementsCount}
          subtitle="Broadcasts delivered"
          icon={Share2}
          colorScheme="emerald"
        />
      </div>

      {/* View Switcher: Inbox vs Outgoing History */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('inbox')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'inbox'
                ? 'bg-[#172033] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Platform Alerts Inbox ({filteredNotifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'history'
                ? 'bg-[#172033] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Outgoing Announcement History ({announcements.length})</span>
          </button>
        </div>
      </div>

      {/* B & C: INBOX VIEW */}
      {activeView === 'inbox' ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab;
              const count =
                tab === 'All Notifications'
                  ? notifications.length
                  : notifications.filter((n) => n.category.toLowerCase() === tab.toLowerCase()).length;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveCategory(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-rose-50 text-[#C1123F] ring-1 ring-[#C1123F]/30'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-[#C1123F] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Priority Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, patient, or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-700"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {(searchQuery || priorityFilter !== 'All' || activeCategory !== 'All Notifications') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPriorityFilter('All');
                    setActiveCategory('All Notifications');
                  }}
                  className="text-xs text-[#C1123F] font-bold hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Notification Items List */}
          <div className="space-y-3.5">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-3xl">
                <Bell className="w-10 h-10 mx-auto text-slate-300" />
                <h4 className="font-bold text-base text-[#172033]">No Notifications Matching Filters</h4>
                <p className="text-xs text-[#64748B]">
                  Try clearing your search query or selecting "All Notifications".
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    !notif.read
                      ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                      : 'bg-white hover:bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  {/* Left Column: Details */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="mt-1 flex-shrink-0">
                      {notif.category === 'Emergency Alerts' ? (
                        <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#C1123F] flex items-center justify-center animate-pulse">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      ) : notif.category === 'User Activity' ? (
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                      ) : notif.category === 'Announcements' ? (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#16A36A] flex items-center justify-center">
                          <Share2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                          <Activity className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#172033]">{notif.title}</span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#C1123F] animate-pulse" />
                        )}
                        {getPriorityBadge(notif.priority)}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {notif.category}
                        </span>
                      </div>

                      <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                        {notif.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {notif.timestamp}
                        </span>
                        {notif.relatedUser && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-600 font-semibold">{notif.relatedUser}</span>
                          </>
                        )}
                        {notif.relatedRef && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-[#C1123F] font-bold">{notif.relatedRef}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedNotif(notif)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleRead(notif.id)}
                      className={`p-2 rounded-xl border transition-colors ${
                        notif.read
                          ? 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                      title={notif.read ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      <Check className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleArchive(notif.id)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Archive Notification"
                    >
                      <Archive className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(notif.id)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-[#C1123F] transition-colors"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* F. NOTIFICATION HISTORY (OUTGOING ANNOUNCEMENTS) */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-[#172033]">
                Outgoing Announcements & Broadcast History
              </h3>
              <p className="text-xs text-[#64748B]">
                Audited dispatch logs sent across SMS, WhatsApp, and Mobile Push channels
              </p>
            </div>
            <div className="text-xs bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200 font-medium">
              Telecom Carrier: 100% Verified Delivery Receipts
            </div>
          </div>

          <div className="space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#172033]">{ann.title}</span>
                    {getPriorityBadge(ann.priority)}
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {ann.deliveryStatus}
                  </span>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {ann.message}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700">Target: {ann.targetAudience}</span>
                    <span className="text-slate-300">•</span>
                    <span>Channel: {ann.channel}</span>
                    <span className="text-slate-300">•</span>
                    <span>Recipients: <strong className="text-[#172033]">{ann.recipientCount?.toLocaleString()}</strong></span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{ann.sentAt}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Delivery Verification Policy:</strong> LIFORA telecom pipelines authenticate delivery via two-way operator DLR handshakes. Numbers with active DND or transient coverage errors are re-queued within 3 minutes.
            </div>
          </div>
        </div>
      )}

      {/* D. SEND NOTIFICATION MODAL */}
      <Modal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        title="Compose & Dispatch Notification"
        subtitle="Broadcast high-priority alerts to donors, recipients, or healthcare partners"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSendNotification} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Notification Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Critical O- Blood Shortage: Lilavati Emergency Surgery"
              value={sendTitle}
              onChange={(e) => setSendTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                Target Audience *
              </label>
              <select
                value={sendAudience}
                onChange={(e) => setSendAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              >
                <option value="All users">All Users (Donors & Patients)</option>
                <option value="Donors">Registered Voluntary Donors Only</option>
                <option value="Recipients">Recipients & Patients Only</option>
                <option value="Hospital Coordinators">Hospital Blood Bank Coordinators</option>
                <option value="Selected users">Selected Users in Emergency Radius</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                Notification Type *
              </label>
              <select
                value={sendType}
                onChange={(e) => setSendType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              >
                <option value="Emergency Broadcast">Emergency Broadcast</option>
                <option value="System Advisory">System Advisory</option>
                <option value="General Announcement">General Announcement</option>
                <option value="Clinical Reminder">Clinical Reminder</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Critical', 'High', 'Medium', 'Low'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSendPriority(lvl)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    sendPriority === lvl
                      ? lvl === 'Critical'
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-[#C1123F] text-white border-[#C1123F] shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Message Content *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide clear details on patient urgency, hospital location, and specific blood component needs..."
              value={sendMessage}
              onChange={(e) => setSendMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
            Emergency broadcasts immediately trigger operator SMS pushes, in-app modal banners, and audio notifications to eligible registered accounts.
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSendModalOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold shadow-sm shadow-[#C1123F]/20 flex items-center justify-center gap-1.5"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW NOTIFICATION DETAILS MODAL */}
      {selectedNotif && (
        <Modal
          isOpen={!!selectedNotif}
          onClose={() => setSelectedNotif(null)}
          title={selectedNotif.title}
          subtitle={`Dispatched ${selectedNotif.timestamp} • ${selectedNotif.category}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {getPriorityBadge(selectedNotif.priority)}
              <span className="text-xs text-slate-400">{selectedNotif.timestamp}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-[#172033] leading-relaxed">
              {selectedNotif.description}
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              {selectedNotif.relatedUser && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Related User / Actor:</span>
                  <span className="font-semibold text-[#172033]">{selectedNotif.relatedUser}</span>
                </div>
              )}
              {selectedNotif.relatedRef && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">System Reference:</span>
                  <span className="font-mono text-[#C1123F] font-bold">{selectedNotif.relatedRef}</span>
                </div>
              )}
              {selectedNotif.hospital && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Facility / Hub:</span>
                  <span className="font-medium text-[#172033]">{selectedNotif.hospital}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="px-5 py-2.5 rounded-xl bg-[#172033] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Notification"
        message="Are you sure you want to permanently delete this alert from the communication log? This action cannot be undone."
        confirmText="Delete Alert"
        type="danger"
      />
    </div>
  );
}
