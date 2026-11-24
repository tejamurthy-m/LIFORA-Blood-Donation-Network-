import { hospitalService } from '../services/hospital.service.js';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';

export const hospitalController = {
  // Public: List verified hospitals with optional filters
  async listPublicHospitals(req, res, next) {
    try {
      const { city, search, status } = req.query;
      const where = {};

      if (status && status !== 'All') {
        const mappedStatus = status.toUpperCase();
        if (['VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED'].includes(mappedStatus)) {
          where.verificationStatus = mappedStatus;
        }
      } else {
        where.verificationStatus = 'VERIFIED';
      }

      if (city && city !== 'All') {
        where.city = { contains: city, mode: 'insensitive' };
      }

      if (search && search.trim() !== '') {
        const q = search.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { licenseNumber: { contains: q, mode: 'insensitive' } },
        ];
      }

      const hospitals = await prisma.hospital.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      res.status(200).json({
        success: true,
        count: hospitals.length,
        data: hospitals.map((h) => ({
          id: h.id,
          name: h.name,
          licenseNumber: h.licenseNumber,
          address: h.address,
          city: h.city,
          state: h.state,
          pincode: h.pincode,
          contactPhone: h.contactPhone,
          contactEmail: h.officialEmail,
          officialEmail: h.officialEmail,
          status: h.verificationStatus === 'VERIFIED' ? 'Verified' : h.verificationStatus,
          bedCapacity: h.bedCapacity,
          facilities: h.facilities,
          bloodBankHead: {
            name: h.headDoctorName || 'Dr. Transfusion Head',
            qualification: h.headDoctorQual || 'MD (Transfusion Medicine)',
            phone: h.headDoctorPhone || h.contactPhone,
            email: h.headDoctorEmail || h.officialEmail,
          },
        })),
      });
    } catch (error) {
      next(error);
    }
  },

  // Public: Get hospital by ID
  async getHospitalPublic(req, res, next) {
    try {
      const { id } = req.params;
      const hospital = await hospitalService.getHospitalProfile(id);
      res.status(200).json({
        success: true,
        data: hospital,
      });
    } catch (error) {
      next(error);
    }
  },

  // Hospital Staff: Get current hospital profile
  async getProfile(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId || req.params.hospitalId;
      if (!hospitalId) {
        throw new ApiError(400, 'Hospital identifier could not be determined.', 'MISSING_HOSPITAL_ID');
      }

      const profile = await hospitalService.getHospitalProfile(hospitalId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  },

  // Hospital Admin: Update profile
  async updateProfile(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId;
      if (!hospitalId) {
        throw new ApiError(400, 'Hospital identifier could not be determined.', 'MISSING_HOSPITAL_ID');
      }

      const updated = await hospitalService.updateHospitalProfile(hospitalId, req.body);
      res.status(200).json({
        success: true,
        message: 'Hospital profile updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // Hospital Staff: Overview metrics
  async getOverview(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId;
      if (!hospitalId) {
        throw new ApiError(400, 'Hospital identifier could not be determined.', 'MISSING_HOSPITAL_ID');
      }

      const metrics = await hospitalService.getOverviewMetrics(hospitalId);
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  },

  // Hospital Staff: Staff Roster
  async getStaff(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId;
      if (!hospitalId) {
        throw new ApiError(400, 'Hospital identifier could not be determined.', 'MISSING_HOSPITAL_ID');
      }

      const staff = await hospitalService.getStaff(hospitalId);
      res.status(200).json({
        success: true,
        count: staff.length,
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  },

  // Hospital Admin: Add staff member
  async addStaff(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId;
      if (!hospitalId) {
        throw new ApiError(400, 'Hospital identifier could not be determined.', 'MISSING_HOSPITAL_ID');
      }

      const { name, email, phone, role, department, password } = req.body;
      if (!name || !email || !phone) {
        throw new ApiError(400, 'Staff name, email, and phone number are required.');
      }

      const newStaff = await hospitalService.addStaff(hospitalId, req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Staff member added successfully.',
        data: newStaff,
      });
    } catch (error) {
      next(error);
    }
  },

  // Hospital Admin: Remove staff member
  async removeStaff(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId;
      const { staffId } = req.params;

      const result = await hospitalService.removeStaff(hospitalId, staffId, req.user);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Hospital Staff: Arrivals board
  async getArrivals(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId;
      if (!hospitalId) {
        throw new ApiError(400, 'Hospital identifier could not be determined.', 'MISSING_HOSPITAL_ID');
      }

      const arrivals = await hospitalService.getArrivals(hospitalId);
      res.status(200).json({
        success: true,
        count: arrivals.length,
        data: arrivals,
      });
    } catch (error) {
      next(error);
    }
  },

  // Hospital Staff: Update arrival status
  async updateArrivalStatus(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId;
      const { arrivalId } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new ApiError(400, 'Status is required.');
      }

      const updated = await hospitalService.updateArrivalStatus(hospitalId, arrivalId, status, req.user);
      res.status(200).json({
        success: true,
        message: 'Arrival status updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // Medical Staff / Admin: Record clinical phlebotomy donation
  async recordDonation(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId;
      if (!hospitalId) {
        throw new ApiError(400, 'Hospital identifier could not be determined.', 'MISSING_HOSPITAL_ID');
      }

      const { donorId, bloodGroup, unitsDonated } = req.body;
      if (!donorId || !bloodGroup) {
        throw new ApiError(400, 'Donor ID and blood group are required.');
      }

      const donation = await hospitalService.recordDonation(hospitalId, req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Clinical donation outcome recorded successfully.',
        data: donation,
      });
    } catch (error) {
      next(error);
    }
  },

  // Hospital Staff: Get donation records
  async getDonationRecords(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId;
      if (!hospitalId) {
        throw new ApiError(400, 'Hospital identifier could not be determined.', 'MISSING_HOSPITAL_ID');
      }

      const records = await hospitalService.getDonationRecords(hospitalId);
      res.status(200).json({
        success: true,
        count: records.length,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  },

  // Hospital Staff: Blood requirements
  async getRequirements(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId;
      if (!hospitalId) {
        throw new ApiError(400, 'Hospital identifier could not be determined.', 'MISSING_HOSPITAL_ID');
      }

      const requirements = await hospitalService.getRequirements(hospitalId);
      res.status(200).json({
        success: true,
        count: requirements.length,
        data: requirements,
      });
    } catch (error) {
      next(error);
    }
  },

  // Hospital Admin / Staff: Update blood requirements
  async updateRequirements(req, res, next) {
    try {
      const hospitalId = req.user.staffProfile?.hospitalId;
      if (!hospitalId) {
        throw new ApiError(400, 'Hospital identifier could not be determined.', 'MISSING_HOSPITAL_ID');
      }

      const updated = await hospitalService.updateRequirements(hospitalId, req.body);
      res.status(200).json({
        success: true,
        message: 'Blood requirement updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // Platform Operator: Get pending hospital registrations
  async getPendingHospitals(req, res, next) {
    try {
      const pending = await hospitalService.getPendingHospitals();
      res.status(200).json({
        success: true,
        count: pending.length,
        data: pending,
      });
    } catch (error) {
      next(error);
    }
  },

  // Platform Operator: Verify or reject hospital
  async verifyHospital(req, res, next) {
    try {
      const { hospitalId } = req.params;
      const { action } = req.body;

      if (!action || !['approve', 'reject'].includes(action.toLowerCase())) {
        throw new ApiError(400, 'Action must be either "approve" or "reject".');
      }

      const result = await hospitalService.verifyHospital(hospitalId, action, req.user);
      res.status(200).json({
        success: true,
        message: `Hospital ${result.name} has been ${result.status.toLowerCase()} successfully.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
