import api, { simulatedDelay } from './api';

const NOTIFICATIONS_STORAGE_KEY = 'lifora_user_notifications_cache';

const formatTimeAgo = (dateInput) => {
  if (!dateInput) return 'Just now';
  const now = new Date();
  const past = new Date(dateInput);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const mapBackendType = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('emergency')) return 'emergency';
  if (t.includes('match') || t.includes('request') || t.includes('response')) return 'response';
  if (t.includes('verification')) return 'verified';
  return 'system';
};

export const notificationService = {
  // Query notifications for current user from backend with local fallback
  async getNotifications(options = {}) {
    try {
      const res = await api.get('/notifications', { params: options });
      if (res.data?.success && Array.isArray(res.data.data)) {
        const formatted = res.data.data.map((n) => ({
          id: n.id,
          type: mapBackendType(n.type),
          rawType: n.type,
          title: n.title,
          message: n.message,
          time: formatTimeAgo(n.createdAt),
          read: Boolean(n.isRead),
          createdAt: n.createdAt,
          metadata: n.metadata,
          hospital: n.metadata?.hospitalName || n.metadata?.hospital || 'Hospital Care Desk',
        }));

        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(formatted));
        return {
          unreadCount: res.data.unreadCount ?? formatted.filter((n) => !n.read).length,
          notifications: formatted,
        };
      }
    } catch (e) {
      console.warn('Backend /notifications query failed, using cached store:', e.message);
    }

    await simulatedDelay(200);
    const cached = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list = cached ? JSON.parse(cached) : [];
    return {
      unreadCount: list.filter((n) => !n.read).length,
      notifications: list,
    };
  },

  // Mark single notification as read
  async markAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (e) {
      console.warn(`Backend markAsRead for ${id} failed:`, e.message);
    }

    const cached = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (cached) {
      const list = JSON.parse(cached).map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    }
    return true;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      await api.patch('/notifications/read-all');
    } catch (e) {
      console.warn('Backend markAllAsRead failed:', e.message);
    }

    const cached = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (cached) {
      const list = JSON.parse(cached).map((n) => ({ ...n, read: true }));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    }
    return true;
  },

  // Delete notification
  async deleteNotification(id) {
    const cached = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (cached) {
      const list = JSON.parse(cached).filter((n) => n.id !== id);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    }
    return true;
  },
};
