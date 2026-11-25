import api from './api';

export const verificationService = {
  // Donor: get currently uploaded medical document & status
  async getMyDocument() {
    try {
      const response = await api.get('/verifications/my-document');
      return response.data?.data || null;
    } catch (error) {
      console.warn('Error fetching my verification document:', error);
      return null;
    }
  },

  // Donor: upload medical document (PDF, PNG, JPG <= 5MB)
  async uploadMedicalReport(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.docType) formData.append('docType', metadata.docType);
    if (metadata.docNumber) formData.append('docNumber', metadata.docNumber);
    if (metadata.notes) formData.append('notes', metadata.notes);

    const response = await api.post('/verifications/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data?.data;
  },

  // Hospital Medical Reviewer / Admin: get queue of pending verifications
  async getVerificationQueue(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.bloodGroup && filters.bloodGroup !== 'ALL') params.append('bloodGroup', filters.bloodGroup);
    if (filters.city && filters.city !== 'ALL') params.append('city', filters.city);
    if (filters.search) params.append('search', filters.search);

    const url = `/verifications/queue${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data?.data || [];
  },

  // Hospital Medical Reviewer / Admin: review document (Approve / Clarify / Reject)
  async reviewDocument(documentId, reviewData) {
    const response = await api.patch(`/verifications/${documentId}/review`, {
      action: reviewData.action, // 'approve' | 'request_clarification' | 'reject'
      notes: reviewData.notes,
      clarificationMessage: reviewData.clarificationMessage,
    });

    return response.data?.data;
  },
};
