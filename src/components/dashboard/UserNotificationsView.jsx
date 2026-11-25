import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Check,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

export default function UserNotificationsView() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'emergency'
  const { addToast } = useToast();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res && Array.isArray(res.notifications)) {
        setItems(res.notifications);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    setItems([]);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const filtered = items.filter((item) => {
    if (filter === 'unread') return !item.read;
    if (filter === 'emergency') return item.type === 'emergency';
    return true;
  });

  const markAllRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    await notificationService.markAllAsRead();
    addToast({ title: 'Marked All as Read', message: 'All notifications cleared.', type: 'info' });
  };

  const clearAll = () => {
    setItems([]);
    addToast({ title: 'Cleared', message: 'Notification queue cleared.', type: 'info' });
  };

  const toggleItemRead = async (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: !item.read } : item))
    );
    await notificationService.markAsRead(id);
  };

  const deleteItem = async (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await notificationService.deleteNotification(id);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C1123F] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#172033]">Notifications Center</h2>
            <p className="text-xs text-[#64748B]">
              Real-time emergency sirens, hospital pings, and milestone rewards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {items.some((i) => !i.read) && (
            <button
              type="button"
              onClick={markAllRead}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-[#172033] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-[#172033] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Unread ({items.filter((i) => !i.read).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('emergency')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'emergency'
              ? 'bg-[#C1123F] text-white'
              : 'bg-rose-50 text-[#C1123F] hover:bg-rose-100'
          }`}
        >
          Emergency ({items.filter((i) => i.type === 'emergency').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Bell className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="font-bold text-base text-[#172033]">All Caught Up!</h4>
            <p className="text-xs text-[#64748B]">No notifications matching this filter.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`py-4 px-3 rounded-2xl flex items-start justify-between gap-4 transition-colors ${
                !item.read ? 'bg-rose-50/40' : 'hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="mt-1 flex-shrink-0">
                  {item.type === 'emergency' && (
                    <div className="w-9 h-9 rounded-xl bg-red-100 text-[#C1123F] flex items-center justify-center animate-pulse">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}
                  {item.type === 'response' && (
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#16A36A] flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                  {item.type === 'verified' && (
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  )}
                  {item.type !== 'emergency' && item.type !== 'response' && item.type !== 'verified' && (
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[#172033]">{item.title}</h4>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[#C1123F] animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                    {item.message}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {item.time}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => toggleItemRead(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  title={item.read ? 'Mark as Unread' : 'Mark as Read'}
                >
                  <Check className={`w-4 h-4 ${item.read ? 'text-slate-400' : 'text-[#C1123F]'}`} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
