import { simulatedDelay } from './api';
import { INITIAL_DONORS } from './mockData';

const DONORS_STORAGE_KEY = 'lifora_donors_data';

export const getStoredDonors = () => {
  const stored = localStorage.getItem(DONORS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(DONORS_STORAGE_KEY, JSON.stringify(INITIAL_DONORS));
    return INITIAL_DONORS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_DONORS;
  }
};

export const saveStoredDonors = (donors) => {
  localStorage.setItem(DONORS_STORAGE_KEY, JSON.stringify(donors));
};

export const donorService = {
  // Query donors with rich filtering
  async getDonors(filters = {}) {
    await simulatedDelay(400);

    let list = [...getStoredDonors()];

    // Blood group filter (exact match or universal compatibility)
    if (filters.bloodGroup && filters.bloodGroup !== 'ALL') {
      list = list.filter((d) => {
        if (d.bloodGroup === filters.bloodGroup) return true;
        // O- can give to anyone
        if (d.bloodGroup === 'O-') return true;
        return false;
      });
    }

    // City filter
    if (filters.city && filters.city !== 'ALL') {
      list = list.filter((d) => d.city.toLowerCase() === filters.city.toLowerCase());
    }

    // Availability filter
    if (filters.onlyAvailable) {
      list = list.filter((d) => d.isAvailable);
    }

    // Max distance radius filter
    if (filters.maxDistance) {
      const maxDist = parseFloat(filters.maxDistance);
      list = list.filter((d) => d.distanceKm <= maxDist);
    }

    // Search query (name, area, city)
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.area.toLowerCase().includes(q) ||
          d.bloodGroup.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (filters.sortBy === 'distance') {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (filters.sortBy === 'donations') {
      list.sort((a, b) => b.totalDonations - a.totalDonations);
    } else if (filters.sortBy === 'response') {
      list.sort((a, b) => a.avgResponseMinutes - b.avgResponseMinutes);
    }

    return list;
  },

  // Get single donor
  async getDonorById(id) {
    await simulatedDelay(250);
    const donors = getStoredDonors();
    return donors.find((d) => d.id === id) || null;
  },

  // Toggle donor availability status
  async updateAvailability(donorId, isAvailable) {
    await simulatedDelay(300);
    const donors = getStoredDonors();
    const updated = donors.map((d) => {
      if (d.id === donorId) {
        return { ...d, isAvailable };
      }
      return d;
    });
    saveStoredDonors(updated);
    return isAvailable;
  },

  // Send request directly to a donor
  async sendDirectRequest(donorId, requestData) {
    await simulatedDelay(400);
    // Record mock response
    return {
      success: true,
      message: 'Direct request dispatched. The donor has been notified via verified SMS and push notification.',
      donorId,
      dispatchedAt: new Date().toISOString(),
    };
  },
};
