import { Router } from 'express';
import { hospitalController } from '../controllers/hospital.controller.js';
import { authenticate, requireRole, requireStaffRole, requireVerifiedHospital } from '../middleware/auth.js';

const router = Router();

// Public hospital directory routes
router.get('/', hospitalController.listPublicHospitals);
router.get('/public/:id', hospitalController.getHospitalPublic);

// Authenticated Hospital Portal Routes
const hospitalAuth = [authenticate, requireRole('HOSPITAL')];
const hospitalOpsAuth = [authenticate, requireRole('HOSPITAL'), requireVerifiedHospital];

// Profile (accessible to view status even if pending)
router.get('/portal/profile', ...hospitalAuth, hospitalController.getProfile);
router.get('/me/profile', ...hospitalAuth, hospitalController.getProfile);
router.put('/portal/profile', ...hospitalOpsAuth, requireStaffRole('HOSPITAL_ADMIN'), hospitalController.updateProfile);

// Overview metrics
router.get('/portal/overview', ...hospitalAuth, hospitalController.getOverview);
router.get('/me/overview', ...hospitalAuth, hospitalController.getOverview);

// Staff management (requires verified hospital)
router.get('/portal/staff', ...hospitalAuth, hospitalController.getStaff);
router.get('/me/staff', ...hospitalAuth, hospitalController.getStaff);
router.post('/portal/staff', ...hospitalOpsAuth, requireStaffRole('HOSPITAL_ADMIN'), hospitalController.addStaff);
router.post('/me/staff', ...hospitalOpsAuth, requireStaffRole('HOSPITAL_ADMIN'), hospitalController.addStaff);
router.delete('/portal/staff/:staffId', ...hospitalOpsAuth, requireStaffRole('HOSPITAL_ADMIN'), hospitalController.removeStaff);
router.delete('/me/staff/:staffId', ...hospitalOpsAuth, requireStaffRole('HOSPITAL_ADMIN'), hospitalController.removeStaff);

// Donor Arrivals board
router.get('/portal/arrivals', ...hospitalAuth, hospitalController.getArrivals);
router.get('/me/arrivals', ...hospitalAuth, hospitalController.getArrivals);
router.patch('/portal/arrivals/:arrivalId', ...hospitalOpsAuth, hospitalController.updateArrivalStatus);

// Phlebotomy / Clinical Donations (requires verified hospital & clinical role)
router.get('/portal/donations', ...hospitalAuth, hospitalController.getDonationRecords);
router.get('/me/donations', ...hospitalAuth, hospitalController.getDonationRecords);
router.post(
  '/portal/donations',
  ...hospitalOpsAuth,
  requireStaffRole('MEDICAL_STAFF', 'HOSPITAL_ADMIN'),
  hospitalController.recordDonation
);

// Blood Inventory / Requirements
router.get('/portal/requirements', ...hospitalAuth, hospitalController.getRequirements);
router.get('/me/requirements', ...hospitalAuth, hospitalController.getRequirements);
router.get('/me/inventory', ...hospitalAuth, hospitalController.getRequirements);
router.put('/portal/requirements', ...hospitalOpsAuth, requireStaffRole('HOSPITAL_ADMIN', 'REQUEST_MANAGER'), hospitalController.updateRequirements);
router.put('/me/inventory', ...hospitalOpsAuth, requireStaffRole('HOSPITAL_ADMIN', 'REQUEST_MANAGER'), hospitalController.updateRequirements);

// Platform Admin Routes (Protected by SUPER_ADMIN role)
router.get('/platform/pending', authenticate, requireRole('SUPER_ADMIN'), hospitalController.getPendingHospitals);
router.patch('/platform/:hospitalId/verify', authenticate, requireRole('SUPER_ADMIN'), hospitalController.verifyHospital);

export default router;
