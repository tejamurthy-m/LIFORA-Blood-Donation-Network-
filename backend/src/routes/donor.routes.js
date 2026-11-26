import { Router } from 'express';
import { donorController } from '../controllers/donor.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

// Protected donor management endpoints
router.get('/me', authenticate, donorController.getMyProfile);
router.get('/me/donations', authenticate, donorController.getMyDonations);
router.put('/me', authenticate, donorController.updateProfile);
router.patch('/me/availability', authenticate, (req, res, next) => {
  req.params.id = req.user.id;
  return donorController.updateAvailability(req, res, next);
});

// Public donor search & view endpoints
router.get('/', donorController.getDonors);
router.get('/:id', donorController.getDonorById);
router.patch('/:id/availability', authenticate, donorController.updateAvailability);
router.post('/:id/direct-request', optionalAuthenticate, donorController.sendDirectRequest);

export default router;
