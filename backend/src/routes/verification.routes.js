import { Router } from 'express';
import multer from 'multer';
import { verificationController } from '../controllers/verification.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

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

// Clinical / Platform Review Queue (Authorized Medical Staff, Hospital Admin, Super Admin)
router.get(
  '/queue',
  authenticate,
  requireRole('HOSPITAL', 'SUPER_ADMIN'),
  verificationController.getVerificationQueue
);

router.patch(
  '/:id/review',
  authenticate,
  requireRole('HOSPITAL', 'SUPER_ADMIN'),
  verificationController.reviewDocument
);

export default router;
