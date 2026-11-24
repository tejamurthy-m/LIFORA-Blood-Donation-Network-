import { Router } from 'express';
import { hospitalController } from '../controllers/hospital.controller.js';
import { authenticate, requireRole, requireStaffRole } from '../middleware/auth.js';

const router = Router();

// Public hospital directory routes
router.get('/', hospitalController.listPublicHospitals);
router.get('/public/:id', hospitalController.getHospitalPublic);

// Authenticated Hospital Portal Routes
const hospitalAuth = [authenticate, requireRole('HOSPITAL')];

// Profile
router.get('/portal/profile', ...hospitalAuth, hospitalController.getProfile);
router.get('/me/profile', ...hospitalAuth, hospitalController.getProfile);
router.put('/portal/profile', ...hospitalAuth, requireStaffRole('HOSPITAL_ADMIN'), hospitalController.updateProfile);

// Overview metrics
router.get('/portal/overview', ...hospitalAuth, hospitalController.getOverview);
router.get('/me/overview', ...hospitalAuth, hospitalController.getOverview);

// Staff management
router.get('/portal/staff', ...hospitalAuth, hospitalController.getStaff);
router.get('/me/staff', ...hospitalAuth, hospitalController.getStaff);
router.post('/portal/staff', ...hospitalAuth, requireStaffRole('HOSPITAL_ADMIN'), hospitalController.addStaff);
router.post('/me/staff', ...hospitalAuth, requireStaffRole('HOSPITAL_ADMIN'), hospitalController.addStaff);
router.delete('/portal/staff/:staffId', ...hospitalAuth, requireStaffRole('HOSPITAL_ADMIN'), hospitalController.removeStaff);
router.delete('/me/staff/:staffId', ...hospitalAuth, requireStaffRole('HOSPITAL_ADMIN'), hospitalController.removeStaff);

// Donor Arrivals board
router.get('/portal/arrivals', ...hospitalAuth, hospitalController.getArrivals);
router.get('/me/arrivals', ...hospitalAuth, hospitalController.getArrivals);
router.patch('/portal/arrivals/:arrivalId', ...hospitalAuth, hospitalController.updateArrivalStatus);

// Phlebotomy / Clinical Donations
router.get('/portal/donations', ...hospitalAuth, hospitalController.getDonationRecords);
router.get('/me/donations', ...hospitalAuth, hospitalController.getDonationRecords);
router.post(
  '/portal/donations',
  ...hospitalAuth,
  requireStaffRole('MEDICAL_STAFF', 'HOSPITAL_ADMIN'),
  hospitalController.recordDonation
);

// Blood Inventory / Requirements
router.get('/portal/requirements', ...hospitalAuth, hospitalController.getRequirements);
router.get('/me/requirements', ...hospitalAuth, hospitalController.getRequirements);
router.get('/me/inventory', ...hospitalAuth, hospitalController.getRequirements);
router.put('/portal/requirements', ...hospitalAuth, requireStaffRole('HOSPITAL_ADMIN', 'REQUEST_MANAGER'), hospitalController.updateRequirements);
router.put('/me/inventory', ...hospitalAuth, requireStaffRole('HOSPITAL_ADMIN', 'REQUEST_MANAGER'), hospitalController.updateRequirements);

// Platform Admin Routes (Protected by ADMIN role)
router.get('/platform/pending', authenticate, requireRole('ADMIN'), hospitalController.getPendingHospitals);
router.patch('/platform/:hospitalId/verify', authenticate, requireRole('ADMIN'), hospitalController.verifyHospital);

export default router;
