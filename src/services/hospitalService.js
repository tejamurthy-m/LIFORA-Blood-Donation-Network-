import { simulatedDelay } from './api';
import { INITIAL_HOSPITALS } from './mockData';

const HOSPITALS_STORAGE_KEY = 'lifora_hospitals_data';

export const getStoredHospitals = () => {
  const stored = localStorage.getItem(HOSPITALS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(HOSPITALS_STORAGE_KEY, JSON.stringify(INITIAL_HOSPITALS));
    return INITIAL_HOSPITALS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_HOSPITALS;
  }
};

export const saveStoredHospitals = (hospitals) => {
  localStorage.setItem(HOSPITALS_STORAGE_KEY, JSON.stringify(hospitals));
};

export const hospitalService = {
  // Query hospitals with search and status filters
  async getHospitals(filters = {}) {
    await simulatedDelay(250);
    let list = [...getStoredHospitals()];

    // Status filter: All, Verified, Pending, Rejected, Inactive
    if (filters.status && filters.status !== 'All') {
      list = list.filter(
        (h) => h.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // City filter
    if (filters.city && filters.city !== 'All') {
      list = list.filter(
        (h) => h.city.toLowerCase() === filters.city.toLowerCase()
      );
    }

    // Search query: name, city, license number
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q) ||
          h.licenseNumber.toLowerCase().includes(q) ||
          (h.bloodBankHead?.name && h.bloodBankHead.name.toLowerCase().includes(q))
      );
    }

    return list;
  },

  // Get hospital by ID
  async getHospitalById(id) {
    await simulatedDelay(150);
    const list = getStoredHospitals();
    return list.find((h) => h.id === id) || null;
  },

  // Add new hospital registration
  async addHospital(hospitalData) {
    await simulatedDelay(350);
    const list = getStoredHospitals();
    const newHospital = {
      id: `hosp-${Date.now()}`,
      name: hospitalData.name.trim(),
      licenseNumber: hospitalData.licenseNumber.trim().toUpperCase(),
      address: hospitalData.address.trim(),
      city: hospitalData.city.trim(),
      state: hospitalData.state?.trim() || 'Maharashtra',
      contactPhone: hospitalData.contactPhone.trim(),
      contactEmail: hospitalData.contactEmail.trim().toLowerCase(),
      bedCapacity: Number(hospitalData.bedCapacity) || 100,
      bloodBankHead: {
        name: hospitalData.headName?.trim() || 'Head Coordinator',
        phone: hospitalData.headPhone?.trim() || hospitalData.contactPhone,
        email: hospitalData.headEmail?.trim() || hospitalData.contactEmail,
        qualification: hospitalData.headQualification?.trim() || 'MD (Transfusion Medicine)',
        experienceYears: Number(hospitalData.headExperience) || 5,
      },
      facilities: Array.isArray(hospitalData.facilities)
        ? hospitalData.facilities
        : ['Whole Blood', 'Packed Red Cells'],
      status: hospitalData.status || 'Pending',
      emergencyTieUp: !!hospitalData.emergencyTieUp,
      registeredAt: new Date().toISOString().split('T')[0],
      notes: hospitalData.notes?.trim() || 'Registered via platform admin portal.',
    };

    list.unshift(newHospital);
    saveStoredHospitals(list);
    return newHospital;
  },

  // Update existing hospital
  async updateHospital(id, updates) {
    await simulatedDelay(300);
    const list = getStoredHospitals();
    const index = list.findIndex((h) => h.id === id);
    if (index === -1) {
      throw new Error('Hospital record not found.');
    }

    const current = list[index];
    const updated = {
      ...current,
      ...updates,
      bloodBankHead: {
        ...current.bloodBankHead,
        ...(updates.bloodBankHead || {}),
      },
    };

    list[index] = updated;
    saveStoredHospitals(list);
    return updated;
  },

  // Approve a pending hospital registration
  async approveHospital(id) {
    await simulatedDelay(250);
    const list = getStoredHospitals();
    const index = list.findIndex((h) => h.id === id);
    if (index === -1) throw new Error('Hospital record not found.');

    list[index].status = 'Verified';
    list[index].approvedAt = new Date().toISOString().split('T')[0];
    list[index].notes = (list[index].notes ? list[index].notes + ' • ' : '') + 'Approved by Platform Administrator.';
    saveStoredHospitals(list);
    return list[index];
  },

  // Reject a hospital registration
  async rejectHospital(id, reason = 'Documentation incomplete or license unverified') {
    await simulatedDelay(250);
    const list = getStoredHospitals();
    const index = list.findIndex((h) => h.id === id);
    if (index === -1) throw new Error('Hospital record not found.');

    list[index].status = 'Rejected';
    list[index].rejectionReason = reason;
    list[index].rejectedAt = new Date().toISOString().split('T')[0];
    saveStoredHospitals(list);
    return list[index];
  },

  // Activate or deactivate hospital listing
  async toggleHospitalStatus(id) {
    await simulatedDelay(200);
    const list = getStoredHospitals();
    const index = list.findIndex((h) => h.id === id);
    if (index === -1) throw new Error('Hospital record not found.');

    const current = list[index];
    const nextStatus = current.status === 'Inactive' ? 'Verified' : 'Inactive';
    list[index].status = nextStatus;
    saveStoredHospitals(list);
    return list[index];
  },

  // Delete hospital listing (if admin chooses to remove)
  async deleteHospital(id) {
    await simulatedDelay(200);
    let list = getStoredHospitals();
    list = list.filter((h) => h.id !== id);
    saveStoredHospitals(list);
    return true;
  },
};
