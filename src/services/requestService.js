import api, { simulatedDelay } from './api';
import { INITIAL_REQUESTS } from './mockData';

const REQUESTS_STORAGE_KEY = 'lifora_blood_requests_data';

export const getStoredRequests = () => {
  const stored = localStorage.getItem(REQUESTS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_REQUESTS));
    return INITIAL_REQUESTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_REQUESTS;
  }
};

export const saveStoredRequests = (requests) => {
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
};

export const requestService = {
  // Query blood requests
  async getRequests(filters = {}) {
    try {
      const res = await api.get('/requests', { params: filters });
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch (e) {
      console.warn('Backend /requests query failed, using local store:', e.message);
    }

    await simulatedDelay(250);
    let list = [...getStoredRequests()];

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((r) => r.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.urgency && filters.urgency !== 'ALL') {
      list = list.filter((r) => r.urgency.toLowerCase() === filters.urgency.toLowerCase());
    }

    if (filters.bloodGroup && filters.bloodGroup !== 'ALL') {
      list = list.filter((r) => r.bloodGroup === filters.bloodGroup);
    }

    if (filters.city && filters.city !== 'ALL') {
      list = list.filter((r) => r.city.toLowerCase() === filters.city.toLowerCase());
    }

    if (filters.requesterId) {
      list = list.filter((r) => r.requesterId === filters.requesterId);
    }

    return list;
  },

  // Get request by ID or Tracking ID
  async getRequestById(id) {
    try {
      const res = await api.get(`/requests/${id}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (e) {
      console.warn(`Backend /requests/${id} query failed, using local store:`, e.message);
    }

    await simulatedDelay(200);
    const list = getStoredRequests();
    return (
      list.find((r) => r.id === id || r.trackingId?.toUpperCase() === id.toUpperCase()) || null
    );
  },

  // Create blood request
  async createRequest(payload) {
    try {
      const res = await api.post('/requests', {
        patientName: payload.patientName || 'Confidential Patient',
        bloodGroup: payload.bloodGroup,
        unitsRequired: parseInt(payload.unitsRequired, 10) || 1,
        hospitalName: payload.hospitalName || 'City Hospital',
        hospitalLocation: payload.hospitalLocation || payload.hospitalName || 'City Center',
        city: payload.city || 'Mumbai',
        urgency: payload.urgency || 'Normal',
        requiredDate: payload.requiredDate || 'Immediate',
        contactPerson: payload.contactPerson || 'Attending Coordinator',
        contactPhone: payload.contactPhone || '+91 98200 00000',
        additionalInstructions: payload.additionalInstructions || 'Standard cross-match requested.',
        hospitalId: payload.hospitalId,
      });

      if (res.data?.success && res.data.data) {
        const created = res.data.data;
        // Keep in local storage as well for instant UI updates
        const list = getStoredRequests();
        list.unshift(created);
        saveStoredRequests(list);
        return created;
      }
    } catch (e) {
      console.warn('Backend /requests creation failed, saving to local store:', e.response?.data?.error?.message || e.message);
    }

    await simulatedDelay(350);
    const list = getStoredRequests();
    const trackingCode = `LIF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest = {
      id: trackingCode,
      trackingId: trackingCode,
      patientName: payload.patientName || 'Confidential Patient',
      bloodGroup: payload.bloodGroup,
      unitsRequired: parseInt(payload.unitsRequired, 10) || 1,
      hospitalName: payload.hospitalName,
      hospitalLocation: payload.hospitalLocation || payload.hospitalName,
      city: payload.city || 'Mumbai',
      distanceKm: (1 + Math.random() * 6).toFixed(1),
      urgency: payload.urgency || 'Normal',
      requiredDate: payload.requiredDate || 'Immediate',
      contactPerson: payload.contactPerson || 'Attending Coordinator',
      contactPhone: payload.contactPhone,
      additionalInstructions: payload.additionalInstructions || 'Standard cross-match requested.',
      status: payload.urgency === 'Emergency' ? 'In Progress' : 'Pending',
      donorResponses: payload.urgency === 'Emergency' ? 2 : 0,
      acceptedDonors: [],
      createdAt: new Date().toISOString(),
      requesterId: payload.requesterId || 'user_guest',
      timeline: [
        { step: 1, title: 'Request Submitted', time: 'Just now', done: true },
        {
          step: 2,
          title: 'Donors Notified',
          time: 'Active',
          done: true,
          detail: 'Broadcasting to nearby verified donors',
        },
        {
          step: 3,
          title: 'Donor Responses Received',
          time: 'Awaiting',
          done: false,
          detail: 'Collecting confirmations',
        },
        {
          step: 4,
          title: 'Hospital Coordination',
          time: 'Pending',
          done: false,
          detail: 'Clinical blood bank cross-matching',
        },
      ],
    };

    list.unshift(newRequest);
    saveStoredRequests(list);
    return newRequest;
  },

  // Accept a blood request (by a donor)
  async acceptRequest(requestId, donorName = 'Dr. Aryan S.') {
    try {
      const res = await api.post(`/requests/${requestId}/accept`);
      if (res.data?.success) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend /requests accept failed, using local store:', e.response?.data?.error?.message || e.message);
      if (e.response?.data?.error?.message) {
        throw new Error(e.response.data.error.message);
      }
    }

    await simulatedDelay(250);
    const list = getStoredRequests();
    let target = null;

    const updated = list.map((r) => {
      if (r.id === requestId || r.trackingId === requestId) {
        const donors = r.acceptedDonors || [];
        if (!donors.includes(donorName)) {
          donors.push(donorName);
        }
        target = {
          ...r,
          status: 'In Progress',
          donorResponses: donors.length,
          acceptedDonors: donors,
        };
        return target;
      }
      return r;
    });

    saveStoredRequests(updated);
    return target;
  },

  // Update request status
  async updateStatus(requestId, newStatus) {
    try {
      const res = await api.patch(`/requests/${requestId}/status`, { status: newStatus });
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (e) {
      console.warn('Backend /requests status update failed, using local store:', e.message);
    }

    await simulatedDelay(200);
    const list = getStoredRequests();
    const updated = list.map((r) => {
      if (r.id === requestId || r.trackingId === requestId) {
        return { ...r, status: newStatus };
      }
      return r;
    });
    saveStoredRequests(updated);
    return true;
  },
};
