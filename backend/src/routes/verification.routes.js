import { Router } from 'express';
import multer from 'multer';
import { verificationController } from '../controllers/verification.controller.js';
import { authenticate, requireRole, requireMedicalReviewer } from '../middleware/auth.js';

const router = Router();

// Configure multer for in-memory file buffering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Donor Document Upload & Status
router.post(
  '/upload',
  authenticate,
  requireRole('DONOR'),
  upload.single('file'),
  verificationController.uploadDocument
);

router.get('/my-document', authenticate, verificationController.getMyDocument);

// Clinical Review Queue (Restricted strictly to Authorized Medical Staff, Hospital Admin, Super Admin)
router.get(
  '/queue',
  authenticate,
  requireMedicalReviewer,
  verificationController.getVerificationQueue
);

router.patch(
  '/:id/review',
  authenticate,
  requireMedicalReviewer,
  verificationController.reviewDocument
);

export default router;
