import { simulatedDelay } from './api';
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
    await simulatedDelay(350);
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
    await simulatedDelay(250);
    const list = getStoredRequests();
    return (
      list.find((r) => r.id === id || r.trackingId?.toUpperCase() === id.toUpperCase()) || null
    );
  },

  // Create blood request
  async createRequest(payload) {
    await simulatedDelay(600);
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
    await simulatedDelay(350);
    const list = getStoredRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx !== -1) {
      const req = list[idx];
      const accepted = req.acceptedDonors || [];
      if (!accepted.includes(donorName)) {
        accepted.push(donorName);
      }
      req.acceptedDonors = accepted;
      req.donorResponses = (req.donorResponses || 0) + 1;
      req.status = 'In Progress';
      // Mark timeline step 3 as done
      if (req.timeline && req.timeline[2]) {
        req.timeline[2].done = true;
        req.timeline[2].time = 'Just now';
        req.timeline[2].detail = `${donorName} responded and is coordinating`;
      }
      list[idx] = req;
      saveStoredRequests(list);
      return req;
    }
    throw new Error('Request not found');
  },

  // Reject/Decline a blood request
  async rejectRequest(requestId) {
    await simulatedDelay(250);
    // Mark as declined for current donor view
    return { success: true, message: 'Request declined.' };
  },

  // Update status (e.g. for Admin / Recipient fulfillment)
  async updateStatus(requestId, status) {
    await simulatedDelay(300);
    const list = getStoredRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx !== -1) {
      list[idx].status = status;
      if (status === 'Fulfilled' && list[idx].timeline) {
        list[idx].timeline.forEach((step) => {
          step.done = true;
        });
      }
      saveStoredRequests(list);
      return list[idx];
    }
    throw new Error('Request not found');
  },
};
