import api, { simulatedDelay } from './api';

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('lifora_current_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getCurrentUserId = () => {
  const user = getCurrentUser();
  return user?.id || user?.email || 'guest';
};

const getCacheKey = () => `lifora_notifications_${getCurrentUserId()}`;

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

const getDefaultSeedNotifications = (role = 'donor') => {
  const now = Date.now();
  if (role === 'recipient') {
    return [
      {
        id: `notif_seed_${role}_1`,
        type: 'response',
        rawType: 'DONOR_RESPONSE',
        title: 'Lifesaver Donor Pledged',
        message: 'A verified donor has responded to your emergency blood requisition.',
        time: '15 mins ago',
        read: false,
        createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
      },
      {
        id: `notif_seed_${role}_2`,
        type: 'emergency',
        rawType: 'REQUEST_BROADCAST',
        title: 'Active Requisition Broadcast',
        message: 'Your emergency blood request is broadcasting across 15 km network radius.',
        time: '2 hours ago',
        read: true,
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  if (role === 'hospital') {
    return [
      {
        id: `notif_seed_${role}_1`,
        type: 'response',
        rawType: 'DONOR_ARRIVAL',
        title: 'Donor Arrival Alert',
        message: 'Scheduled donor arrival at Blood Bank Counter A for whole blood screening.',
        time: '10 mins ago',
        read: false,
        createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
      },
      {
        id: `notif_seed_${role}_2`,
        type: 'emergency',
        rawType: 'INVENTORY_ALERT',
        title: 'Critical Reserve Threshold',
        message: 'Packed red cell reserves are below recommended emergency minimum (3 units).',
        time: '1 hour ago',
        read: false,
        createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  // Default: Donor
  return [
    {
      id: `notif_seed_${role}_1`,
      type: 'emergency',
      rawType: 'EMERGENCY_REQUEST',
      title: 'Emergency Blood Alert',
      message: 'Lilavati Hospital & Research Centre urgently needs 2 Units of O+ Packed Red Cells.',
      time: '20 mins ago',
      read: false,
      createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
    },
    {
      id: `notif_seed_${role}_2`,
      type: 'verified',
      rawType: 'VERIFICATION_UPDATE',
      title: 'Blood Group Report Status',
      message: 'Your verification submission has been reviewed by the clinical pathology desk.',
      time: '3 hours ago',
      read: false,
      createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `notif_seed_${role}_3`,
      type: 'system',
      rawType: 'WELCOME',
      title: 'Welcome to LIFORA Network',
      message: 'Your voluntary profile is active. You will receive alerts when nearby hospitals need assistance.',
      time: '1 day ago',
      read: true,
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
};

export const notificationService = {
  // Query notifications for current user from backend with local fallback
  async getNotifications(options = {}) {
    const cacheKey = getCacheKey();
    const user = getCurrentUser();
    const role = user?.role || 'donor';

    // Load existing cached notifications so client-dispatched notifications are never lost
    let cachedList = [];
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw !== null) {
        const parsed = JSON.parse(cachedRaw);
        if (Array.isArray(parsed)) cachedList = parsed;
      }
    } catch {
      cachedList = [];
    }

    try {
      const res = await api.get('/notifications', { params: options });
      if (res.data?.success && Array.isArray(res.data.data)) {
        const backendFormatted = res.data.data.map((n) => ({
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

        // Merge: prioritize backend records, but preserve any local notifications not in backend
        const itemMap = new Map();
        backendFormatted.forEach((item) => itemMap.set(item.id, item));
        cachedList.forEach((item) => {
          if (!itemMap.has(item.id)) {
            itemMap.set(item.id, item);
          }
        });

        let merged = Array.from(itemMap.values());
        merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        const clearedKey = `${cacheKey}_cleared`;
        const wasCleared = localStorage.getItem(clearedKey) === 'true';
        if (merged.length === 0 && !wasCleared) {
          merged = getDefaultSeedNotifications(role);
        }

        localStorage.setItem(cacheKey, JSON.stringify(merged));
        return {
          unreadCount: merged.filter((n) => !n.read).length,
          notifications: merged,
        };
      }
    } catch (e) {
      console.warn('Backend /notifications query failed, using cached store:', e.message);
    }

    await simulatedDelay(150);
    const clearedKey = `${cacheKey}_cleared`;
    const wasCleared = localStorage.getItem(clearedKey) === 'true';
    let list = cachedList;
    if (list.length === 0 && !wasCleared) {
      list = getDefaultSeedNotifications(role);
      localStorage.setItem(cacheKey, JSON.stringify(list));
    }

    return {
      unreadCount: list.filter((n) => !n.read).length,
      notifications: list,
    };
  },

  // Mark single notification as read/unread
  async markAsRead(id, isRead = true) {
    const cacheKey = getCacheKey();
    try {
      await api.patch(`/notifications/${id}/read`, { isRead });
    } catch (e) {
      console.warn(`Backend markAsRead for ${id} failed:`, e.message);
    }

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const list = JSON.parse(cached).map((n) => (n.id === id ? { ...n, read: isRead } : n));
        localStorage.setItem(cacheKey, JSON.stringify(list));
      } catch {}
    }
    window.dispatchEvent(new CustomEvent('lifora:new_notification'));
    return true;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const cacheKey = getCacheKey();
    try {
      await api.patch('/notifications/read-all');
    } catch (e) {
      console.warn('Backend markAllAsRead failed:', e.message);
    }

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const list = JSON.parse(cached).map((n) => ({ ...n, read: true }));
        localStorage.setItem(cacheKey, JSON.stringify(list));
      } catch {}
    }
    window.dispatchEvent(new CustomEvent('lifora:new_notification'));
    return true;
  },

  // Delete notification
  async deleteNotification(id) {
    const cacheKey = getCacheKey();
    try {
      await api.delete(`/notifications/${id}`);
    } catch (e) {
      console.warn(`Backend deleteNotification for ${id} failed:`, e.message);
    }

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const list = JSON.parse(cached).filter((n) => n.id !== id);
        localStorage.setItem(cacheKey, JSON.stringify(list));
      } catch {}
    }
    window.dispatchEvent(new CustomEvent('lifora:new_notification'));
    return true;
  },

  // Clear all notifications
  async clearAll() {
    const cacheKey = getCacheKey();
    try {
      await api.delete('/notifications');
    } catch (e) {
      console.warn('Backend clearAll notifications failed:', e.message);
    }

    localStorage.setItem(cacheKey, JSON.stringify([]));
    localStorage.setItem(`${cacheKey}_cleared`, 'true');
    window.dispatchEvent(new CustomEvent('lifora:new_notification'));
    return true;
  },

  // Add a new notification directly into local and cache store
  async addNotification(notifData) {
    const user = getCurrentUser();
    const userId = notifData.userId || user?.id || user?.email || 'guest';
    const cacheKey = `lifora_notifications_${userId}`;

    // Clear the explicit 'cleared' flag because user just received/created a fresh notification
    localStorage.removeItem(`${cacheKey}_cleared`);

    const newNotif = {
      id: notifData.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: notifData.type || 'response',
      rawType: notifData.rawType || 'DONOR_MATCH',
      title: notifData.title || 'Notification',
      message: notifData.message || '',
      time: 'Just now',
      read: false,
      createdAt: notifData.createdAt || new Date().toISOString(),
      metadata: notifData.metadata || {},
      hospital: notifData.metadata?.hospitalName || notifData.metadata?.hospital || 'Hospital Care Desk',
    };

    try {
      let list = [];
      const cached = localStorage.getItem(cacheKey);
      if (cached !== null) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) list = parsed;
        } catch {
          list = [];
        }
      } else {
        list = getDefaultSeedNotifications(user?.role || 'recipient');
      }

      list.unshift(newNotif);
      localStorage.setItem(cacheKey, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('lifora:new_notification'));
    } catch (e) {
      console.warn('Error saving local notification:', e.message);
    }

    return newNotif;
  },
};
