import { Router } from 'express';
import { hospitalController } from '../controllers/hospital.controller.js';
import { authenticate, requireRole, requireStaffRole } from '../middleware/auth.js';

const router = Router();

// Public hospital directory routes
router.get('/', hospitalController.listPublicHospitals);
router.get('/public/:id', hospitalController.getHospitalPublic);

// Authenticated Hospital Portal Routes
router.use('/portal', authenticate, requireRole('HOSPITAL'));

// Profile
router.get('/portal/profile', hospitalController.getProfile);
router.put('/portal/profile', requireStaffRole('HOSPITAL_ADMIN'), hospitalController.updateProfile);

// Overview metrics
router.get('/portal/overview', hospitalController.getOverview);

// Staff management
router.get('/portal/staff', hospitalController.getStaff);
router.post('/portal/staff', requireStaffRole('HOSPITAL_ADMIN'), hospitalController.addStaff);
router.delete('/portal/staff/:staffId', requireStaffRole('HOSPITAL_ADMIN'), hospitalController.removeStaff);

// Donor Arrivals board
router.get('/portal/arrivals', hospitalController.getArrivals);
router.patch('/portal/arrivals/:arrivalId', hospitalController.updateArrivalStatus);

// Phlebotomy / Clinical Donations
router.get('/portal/donations', hospitalController.getDonationRecords);
router.post(
  '/portal/donations',
  requireStaffRole('MEDICAL_STAFF', 'HOSPITAL_ADMIN'),
  hospitalController.recordDonation
);

// Blood Inventory / Requirements
router.get('/portal/requirements', hospitalController.getRequirements);
router.put('/portal/requirements', requireStaffRole('HOSPITAL_ADMIN', 'REQUEST_MANAGER'), hospitalController.updateRequirements);

// Platform Admin Routes (Protected by ADMIN role)
router.get('/platform/pending', authenticate, requireRole('ADMIN'), hospitalController.getPendingHospitals);
router.patch('/platform/:hospitalId/verify', authenticate, requireRole('ADMIN'), hospitalController.verifyHospital);

export default router;
