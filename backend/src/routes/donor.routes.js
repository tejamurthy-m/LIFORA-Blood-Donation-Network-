import { Router } from 'express';
import { donorController } from '../controllers/donor.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

// Public donor search & view endpoints
router.get('/', donorController.getDonors);
router.get('/:id', donorController.getDonorById);

// Protected donor management endpoints
router.patch('/:id/availability', authenticate, donorController.updateAvailability);
router.post('/:id/direct-request', optionalAuthenticate, donorController.sendDirectRequest);

export default router;
