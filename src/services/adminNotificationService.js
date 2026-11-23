import { simulatedDelay } from './api';

const NOTIFICATIONS_STORAGE_KEY = 'lifora_admin_notifications_data';
const ANNOUNCEMENTS_STORAGE_KEY = 'lifora_admin_announcements_data';

export const INITIAL_ADMIN_NOTIFICATIONS = [
  {
    id: 'notif-101',
    title: 'Emergency O+ Blood Request Broadcast',
    description: 'Immediate demand for 2 units of O+ blood for cardiovascular surgery at Lilavati Hospital & Research Centre. 18 nearby donors pinged.',
    category: 'Emergency Alerts',
    priority: 'Critical',
    read: false,
    archived: false,
    timestamp: '8 minutes ago',
    createdAt: '2026-11-23T22:35:00Z',
    relatedUser: 'Dr. Aryan Sharma (O+ Donor Responded)',
    relatedRef: 'REQ-LIF-9042',
    hospital: 'Lilavati Hospital & Research Centre, Mumbai',
  },
  {
    id: 'notif-102',
    title: 'New Hospital Blood Bank Registration',
    description: 'Metro Multi-Specialty Heart Institute submitted full accreditation credentials and State Drug Controller license for platform verification.',
    category: 'System Alerts',
    priority: 'High',
    read: false,
    archived: false,
    timestamp: '32 minutes ago',
    createdAt: '2026-11-23T22:15:00Z',
    relatedUser: 'Dr. Harpreet Singh (Director)',
    relatedRef: 'HOSP-LIC-DL-774',
    hospital: 'Metro Heart Institute, Delhi',
  },
  {
    id: 'notif-103',
    title: 'Donor Clinical Verification Pending',
    description: 'Rajesh Verma submitted government photo ID and pathology immunohematology clearance for O-negative universal life saver badge verification.',
    category: 'User Activity',
    priority: 'Medium',
    read: false,
    archived: false,
    timestamp: '1 hour ago',
    createdAt: '2026-11-23T21:40:00Z',
    relatedUser: 'Rajesh Verma (O- Donor)',
    relatedRef: 'VERIF-DONOR-882',
    hospital: 'K.E.M. Hospital Verification Queue',
  },
  {
    id: 'notif-104',
    title: 'Blood Request Successfully Fulfilled',
    description: 'Requisition LIF-7901 for 1 unit of AB+ blood at Apollo Hospitals Chennai completed and verified by hospital blood bank head.',
    category: 'System Alerts',
    priority: 'Low',
    read: true,
    archived: false,
    timestamp: '3 hours ago',
    createdAt: '2026-11-23T19:30:00Z',
    relatedUser: 'Farida Begum (Recipient)',
    relatedRef: 'REQ-LIF-7901',
    hospital: 'Apollo Hospitals, Chennai',
  },
  {
    id: 'notif-105',
    title: 'Suspicious Account Multi-Ping Flagged',
    description: 'Automated fraud protection detected 5 simultaneous emergency requests with differing patient names from an unverified IP address in Pune.',
    category: 'System Alerts',
    priority: 'Critical',
    read: false,
    archived: false,
    timestamp: '5 hours ago',
    createdAt: '2026-11-23T17:10:00Z',
    relatedUser: 'IP 192.0.2.144 (Flagged User #902)',
    relatedRef: 'SEC-FLAG-409',
    hospital: 'Platform Security Gate',
  },
  {
    id: 'notif-106',
    title: 'Voluntary Blood Drive Scheduled',
    description: 'Rotary Blood Bank Pune coordinated a Sunday mobile collection drive targeting 150 units of rare B- and AB- components.',
    category: 'Announcements',
    priority: 'Medium',
    read: true,
    archived: false,
    timestamp: 'Yesterday at 16:20',
    createdAt: '2026-11-22T16:20:00Z',
    relatedUser: 'Pune Rotary Transfusion Team',
    relatedRef: 'CAMP-MH-312',
    hospital: 'City Care Trauma Centre, Pune',
  },
  {
    id: 'notif-107',
    title: 'Cold Storage Temperature Telemetry OK',
    description: 'Blood bank cryogenic refrigerator sensor logs reviewed for Lilavati and Kokilaben. All units stored between 2°C and 6°C.',
    category: 'System Alerts',
    priority: 'Low',
    read: true,
    archived: false,
    timestamp: 'Yesterday at 09:15',
    createdAt: '2026-11-22T09:15:00Z',
    relatedUser: 'Automated IoT Sensor Unit #4',
    relatedRef: 'IOT-TEMP-04',
    hospital: 'Central Cold Chain Monitor',
  },
];

export const INITIAL_ADMIN_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Urgent Weekend O-Negative Donor Appeal',
    message: 'Notice to all registered O- donors in Mumbai & Pune metropolitan area: Trauma centers report lower reserves. Please schedule voluntary donation.',
    targetAudience: 'O- Negative Donors (Mumbai & Pune)',
    priority: 'High',
    sentAt: '2026-11-22 10:30 AM',
    recipientCount: 1040,
    deliveryStatus: 'Delivered (Gateway Confirmed)',
    channel: 'SMS + Push Notification',
    deliveredCount: 1028,
  },
  {
    id: 'ann-2',
    title: 'World Blood Donor Day Platform Recognition',
    message: 'Thank you to our 14,800+ voluntary life-savers. Digital appreciation certificates have been credited to your donor dashboard profiles.',
    targetAudience: 'All Registered Donors',
    priority: 'Medium',
    sentAt: '2026-11-14 09:00 AM',
    recipientCount: 14820,
    deliveryStatus: 'Delivered (Gateway Confirmed)',
    channel: 'In-App + Email Digest',
    deliveredCount: 14690,
  },
  {
    id: 'ann-3',
    title: 'NABH Blood Bank Protocol Guidelines Update',
    message: 'Updated clinical cross-matching verification standards and donor privacy compliance documentation distributed to all partner hospitals.',
    targetAudience: 'Hospital Blood Bank Coordinators',
    priority: 'Low',
    sentAt: '2026-11-05 14:00 PM',
    recipientCount: 64,
    deliveryStatus: 'Delivered (Gateway Confirmed)',
    channel: 'Secure Clinical Portal',
    deliveredCount: 64,
  },
];

export const getStoredAdminNotifications = () => {
  const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_NOTIFICATIONS));
    return INITIAL_ADMIN_NOTIFICATIONS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_ADMIN_NOTIFICATIONS;
  }
};

export const saveStoredAdminNotifications = (list) => {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
};

export const getStoredAdminAnnouncements = () => {
  const stored = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_ANNOUNCEMENTS));
    return INITIAL_ADMIN_ANNOUNCEMENTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_ADMIN_ANNOUNCEMENTS;
  }
};

export const saveStoredAdminAnnouncements = (list) => {
  localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(list));
};

export const adminNotificationService = {
  async getNotifications(filters = {}) {
    await simulatedDelay(200);
    let list = [...getStoredAdminNotifications()];

    if (filters.category && filters.category !== 'All Notifications') {
      list = list.filter((n) => n.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.priority && filters.priority !== 'All') {
      list = list.filter((n) => n.priority.toLowerCase() === filters.priority.toLowerCase());
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          (n.relatedUser && n.relatedUser.toLowerCase().includes(q)) ||
          (n.relatedRef && n.relatedRef.toLowerCase().includes(q))
      );
    }

    return list;
  },

  async toggleRead(id) {
    await simulatedDelay(150);
    const list = getStoredAdminNotifications();
    const idx = list.findIndex((n) => n.id === id);
    if (idx !== -1) {
      list[idx].read = !list[idx].read;
      saveStoredAdminNotifications(list);
      return list[idx];
    }
    throw new Error('Notification not found');
  },

  async markAllRead() {
    await simulatedDelay(200);
    const list = getStoredAdminNotifications().map((n) => ({ ...n, read: true }));
    saveStoredAdminNotifications(list);
    return list;
  },

  async deleteNotification(id) {
    await simulatedDelay(150);
    let list = getStoredAdminNotifications();
    list = list.filter((n) => n.id !== id);
    saveStoredAdminNotifications(list);
    return true;
  },

  async archiveNotification(id) {
    await simulatedDelay(150);
    const list = getStoredAdminNotifications();
    const idx = list.findIndex((n) => n.id === id);
    if (idx !== -1) {
      list[idx].archived = true;
      saveStoredAdminNotifications(list);
      return list[idx];
    }
    throw new Error('Notification not found');
  },

  async sendAnnouncement(announcementData) {
    await simulatedDelay(400);
    const announcements = getStoredAdminAnnouncements();
    const notifications = getStoredAdminNotifications();

    const recipientMap = {
      'All users': 17270,
      'Donors': 14820,
      'Recipients': 2450,
      'Selected users': 180,
      'Hospital Coordinators': 64,
    };

    const target = announcementData.targetAudience || 'All users';
    const count = recipientMap[target] || 1200;

    const newAnnouncement = {
      id: `ann-${Date.now()}`,
      title: announcementData.title,
      message: announcementData.message,
      targetAudience: target,
      priority: announcementData.priority || 'High',
      sentAt: 'Just now',
      recipientCount: count,
      deliveryStatus: 'Delivered (Gateway Confirmed)',
      channel: 'SMS + Push + In-App',
      deliveredCount: count,
    };

    announcements.unshift(newAnnouncement);
    saveStoredAdminAnnouncements(announcements);

    // Also add to notifications feed as an Announcement
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: `Outgoing Announcement: ${announcementData.title}`,
      description: announcementData.message,
      category: 'Announcements',
      priority: announcementData.priority || 'High',
      read: true,
      archived: false,
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      relatedUser: `Admin Broadcast (${target})`,
      relatedRef: newAnnouncement.id,
      hospital: 'Central Dispatch Broadcast',
    };
    notifications.unshift(newNotif);
    saveStoredAdminNotifications(notifications);

    return newAnnouncement;
  },

  async getAnnouncements() {
    await simulatedDelay(150);
    return getStoredAdminAnnouncements();
  },
};
