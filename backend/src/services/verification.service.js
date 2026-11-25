import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { uploadMedicalDocument, createSignedReportUrl } from '../config/storage.js';
import { REVERSE_BLOOD_GROUP_MAP } from '../validators/auth.validator.js';
import { emitToUser } from '../config/socket.js';
import { emailService } from './email.service.js';

// Status mapper between DB enums and frontend states
export const DB_TO_FRONTEND_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'approved',
  CLARIFICATION_REQUESTED: 'clarification_requested',
  REJECTED: 'rejected',
  SUSPENDED: 'rejected',
};

export const FRONTEND_TO_DB_STATUS = {
  pending: 'PENDING',
  approved: 'VERIFIED',
  verified: 'VERIFIED',
  clarification_requested: 'CLARIFICATION_REQUESTED',
  rejected: 'REJECTED',
};

export const formatVerificationItem = async (doc) => {
  const user = doc.user || {};
  const donorProfile = user.donorProfile || {};
  const bloodGroup =
    REVERSE_BLOOD_GROUP_MAP[donorProfile.bloodGroup] || donorProfile.bloodGroup || 'O+';

  const signedUrl = await createSignedReportUrl(doc.fileUrl);

  return {
    id: doc.id,
    donorId: donorProfile.id || doc.userId,
    userId: doc.userId,
    name: user.fullName || 'Anonymous Donor',
    email: user.email || '',
    phone: user.phone || '',
    bloodGroup,
    city: user.city || 'Mumbai',
    area: user.area || '',
    docType: doc.docType || 'Govt Photo ID & Pathology Report',
    docNumber: doc.docNumber || 'DOC-PENDING',
    submittedAt: doc.createdAt.toISOString(),
    submittedDate: doc.createdAt.toISOString().replace('T', ' ').substring(0, 16),
    status: DB_TO_FRONTEND_STATUS[doc.status] || 'pending',
    notes: doc.notes || '',
    clarificationMessage: doc.clarificationMessage || '',
    fileUrl: doc.fileUrl,
    signedUrl,
    verifiedAt: doc.verifiedAt ? doc.verifiedAt.toISOString() : null,
    verifiedBy: doc.verifiedBy || null,
  };
};

export const verificationService = {
  // Donor uploads document
  async uploadDocument(userId, file, body) {
    if (!file) {
      throw new ApiError(400, 'Please upload a valid document file (PDF, PNG, or JPEG).', 'FILE_REQUIRED');
    }

    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ApiError(400, 'Invalid file type. Only PDF, PNG, and JPEG documents are permitted.', 'INVALID_FILE_TYPE');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new ApiError(400, 'File size exceeds 5MB limit.', 'FILE_TOO_LARGE');
    }

    const { docType, docNumber, notes } = body;

    // Upload to Supabase Storage
    const uploadResult = await uploadMedicalDocument(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    // Create database document record
    const document = await prisma.medicalDocument.create({
      data: {
        userId,
        docType: docType || 'Blood Group Pathology Report',
        docNumber: docNumber || `DOC-${Date.now().toString().slice(-6)}`,
        fileUrl: uploadResult.filePath,
        fileMimeType: uploadResult.fileMimeType,
        fileSizeBytes: uploadResult.fileSizeBytes,
        status: 'PENDING',
        notes: notes || 'Uploaded for blood group verification clearance.',
      },
      include: {
        user: {
          include: { donorProfile: true },
        },
      },
    });

    // Update donor profile verification status
    await prisma.donorProfile.updateMany({
      where: { userId },
      data: { verificationStatus: 'PENDING' },
    });

    return formatVerificationItem(document);
  },

  // Get current donor's active verification document
  async getMyDocument(userId) {
    const doc = await prisma.medicalDocument.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: { donorProfile: true },
        },
      },
    });

    if (!doc) {
      return null;
    }

    return formatVerificationItem(doc);
  },

  // Verification queue for Medical Staff / Hospital Admin / Super Admin
  async getVerificationQueue(filters = {}) {
    const { status, bloodGroup, city, search } = filters;

    const where = {};

    if (status && status !== 'all') {
      const dbStatus = FRONTEND_TO_DB_STATUS[status.toLowerCase()];
      if (dbStatus) {
        where.status = dbStatus;
      }
    }

    const docs = await prisma.medicalDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: { donorProfile: true },
        },
      },
    });

    let items = await Promise.all(docs.map((d) => formatVerificationItem(d)));

    // Blood group filter
    if (bloodGroup && bloodGroup !== 'ALL') {
      items = items.filter((d) => d.bloodGroup === bloodGroup);
    }

    // City filter
    if (city && city !== 'ALL') {
      items = items.filter((d) => d.city.toLowerCase() === city.toLowerCase());
    }

    // Search query
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.docNumber.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q)
      );
    }

    return items;
  },

  // Review document action (Approve / Request Clarification / Reject)
  async reviewDocument(documentId, reviewData, reviewerUser) {
    const { action, clarificationMessage, notes } = reviewData;
    // action: 'approve' | 'request_clarification' | 'reject' | 'approved' | 'rejected'

    const doc = await prisma.medicalDocument.findUnique({
      where: { id: documentId },
      include: {
        user: {
          include: { donorProfile: true },
        },
      },
    });

    if (!doc) {
      throw new ApiError(404, 'Verification document not found.', 'DOCUMENT_NOT_FOUND');
    }

    let newStatus = 'PENDING';
    let notifyTitle = '';
    let notifyMessage = '';

    const rawAction = action || reviewData.status || '';
    const normalizedAction = (rawAction.toUpperCase() === 'VERIFIED' ? 'approve' : rawAction).toLowerCase();

    if (normalizedAction === 'approve' || normalizedAction === 'approved') {
      newStatus = 'VERIFIED';
      notifyTitle = 'Blood Verification Approved 🎉';
      notifyMessage = 'Your medical report has been verified by the medical team. You are now a Verified LIFORA Donor!';
    } else if (
      normalizedAction === 'request_clarification' ||
      normalizedAction === 'clarification_requested'
    ) {
      newStatus = 'CLARIFICATION_REQUESTED';
      notifyTitle = 'Verification Clarification Requested 📋';
      notifyMessage = clarificationMessage || 'Please provide additional documentation or a clearer blood test certificate.';
    } else if (normalizedAction === 'reject' || normalizedAction === 'rejected') {
      newStatus = 'REJECTED';
      notifyTitle = 'Verification Document Rejected';
      notifyMessage = notes || 'The submitted document did not meet our verification standards.';
    } else {
      throw new ApiError(400, 'Invalid review action. Allowed: approve, request_clarification, reject.', 'INVALID_ACTION');
    }

    const reviewerName = reviewerUser.fullName || reviewerUser.name || 'Medical Staff';

    // Update document in database
    const updatedDoc = await prisma.medicalDocument.update({
      where: { id: documentId },
      data: {
        status: newStatus,
        verifiedAt: newStatus === 'VERIFIED' ? new Date() : doc.verifiedAt,
        verifiedBy: reviewerName,
        clarificationMessage: clarificationMessage || doc.clarificationMessage,
        notes: notes ? `${doc.notes ? doc.notes + ' | ' : ''}${notes}` : doc.notes,
      },
      include: {
        user: {
          include: { donorProfile: true },
        },
      },
    });

    // Update donor profile verification status accordingly
    await prisma.donorProfile.updateMany({
      where: { userId: doc.userId },
      data: { verificationStatus: newStatus },
    });

    // Send in-app notification to the donor
    await prisma.notification.create({
      data: {
        userId: doc.userId,
        type: 'VERIFICATION_UPDATE',
        title: notifyTitle,
        message: notifyMessage,
        metadata: {
          documentId,
          status: newStatus,
          reviewedBy: reviewerName,
        },
      },
    });

    // Real-time Socket.IO notification to donor
    emitToUser(doc.userId, 'verification:status_changed', {
      documentId,
      status: newStatus,
      title: notifyTitle,
      message: notifyMessage,
    });

    // Email notification to donor
    if (doc.user?.email) {
      emailService.sendReportVerificationResult({
        donorEmail: doc.user.email,
        donorName: doc.user.fullName,
        status: newStatus,
        rejectionReason: notes || clarificationMessage,
      }).catch(() => {});
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: reviewerUser.id,
        action: `Donor Verification: ${newStatus}`,
        actorName: reviewerName,
        target: `${doc.user.fullName} (${doc.docNumber || doc.id})`,
        notes: notes || clarificationMessage || `Document reviewed and set to ${newStatus}`,
      },
    });

    return formatVerificationItem(updatedDoc);
  },
};
