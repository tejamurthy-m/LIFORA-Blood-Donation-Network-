import { Router } from 'express';
import authRouter from './auth.routes.js';
import donorRouter from './donor.routes.js';
import verificationRouter from './verification.routes.js';
import requestRouter from './request.routes.js';

const router = Router();

// Root API v1 welcome & status
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to LIFORA Blood Donation Network REST API v1',
    endpoints: {
      health: '/api/health',
      auth: '/api/v1/auth',
      donors: '/api/v1/donors',
      requests: '/api/v1/requests',
      hospitals: '/api/v1/hospitals',
      verifications: '/api/v1/verifications',
      notifications: '/api/v1/notifications',
      platformAdmin: '/api/v1/platform-admin',
    },
    documentation: 'Refer to docs/BACKEND_IMPLEMENTATION_PLAN.md for full endpoint contracts',
  });
});

// Mount Authentication module
router.use('/auth', authRouter);

// Mount Donors module
router.use('/donors', donorRouter);

// Mount Medical Verification module
router.use('/verifications', verificationRouter);

// Mount Blood Requests module
router.use('/requests', requestRouter);

export default router;
