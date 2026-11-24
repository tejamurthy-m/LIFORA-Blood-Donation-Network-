import { Router } from 'express';
import { requestController } from '../controllers/request.controller.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Public viewing and tracking endpoints
router.get('/', requestController.getRequests);
router.get('/track/:code', requestController.trackRequest);
router.get('/:id', requestController.getRequestById);

// Authenticated creation and updates
router.post('/', optionalAuthenticate, requestController.createRequest);
router.post('/:id/accept', authenticate, requireRole('DONOR'), requestController.acceptRequest);
router.patch('/:id/status', authenticate, requestController.updateStatus);

export default router;
