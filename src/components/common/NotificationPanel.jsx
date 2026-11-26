import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, AlertTriangle, CheckCircle, Clock, X, ShieldCheck } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

export default function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadNotifs = () => {
      notificationService.getNotifications().then((res) => {
        if (res && Array.isArray(res.notifications)) {
          setNotifications(res.notifications);
        }
      });
    };

    if (isOpen) {
      loadNotifs();
    }

    window.addEventListener('lifora:new_notification', loadNotifs);
    window.addEventListener('storage', loadNotifs);
    return () => {
      window.removeEventListener('lifora:new_notification', loadNotifs);
      window.removeEventListener('storage', loadNotifs);
    };
  }, [isOpen, user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await notificationService.markAllAsRead();
  };

  const clearAll = async () => {
    setNotifications([]);
    await notificationService.clearAll();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#C1123F]" />
                <h3 className="font-bold text-sm text-[#172033]">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C1123F] text-white">
                    {unreadCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-slate-500 hover:text-[#C1123F] font-medium"
                  >
                    Mark read
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No notifications right now.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                      !item.read ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {item.type === 'emergency' && (
                        <div className="w-7 h-7 rounded-lg bg-red-100 text-[#C1123F] flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.type === 'response' && (
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#16A36A] flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.type === 'verified' && (
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.type !== 'emergency' && item.type !== 'response' && item.type !== 'verified' && (
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#172033] truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[11px] text-slate-500 hover:text-slate-700 font-medium inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all notifications
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
