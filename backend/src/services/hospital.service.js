import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  BLOOD_GROUP_MAP,
  REVERSE_BLOOD_GROUP_MAP,
} from '../validators/auth.validator.js';

export const STAFF_ROLE_LABELS = {
  HOSPITAL_ADMIN: 'Hospital Admin',
  REQUEST_MANAGER: 'Request Manager',
  DONOR_COORDINATOR: 'Donor Coordinator',
  MEDICAL_STAFF: 'Medical Staff',
};

export const hospitalService = {
  // Get hospital profile for logged in staff member
  async getHospitalProfile(hospitalId) {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        staff: {
          include: { user: true },
        },
      },
    });

    if (!hospital) {
      throw new ApiError(404, 'Hospital not found.', 'HOSPITAL_NOT_FOUND');
    }

    return {
      id: hospital.id,
      name: hospital.name,
      licenseNumber: hospital.licenseNumber,
      registrationNumber: hospital.registrationNumber || 'MH-REG-10492',
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      pincode: hospital.pincode || '400050',
      contactPhone: hospital.contactPhone,
      officialEmail: hospital.officialEmail,
      verificationStatus: hospital.verificationStatus === 'VERIFIED' ? 'Verified' : hospital.verificationStatus,
      accreditation: hospital.accreditation || 'NABH Accredited Transfusion Centre',
      bedCapacity: hospital.bedCapacity,
      logo: hospital.logoUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80',
      bloodBankHead: {
        name: hospital.headDoctorName || 'Dr. Transfusion Head',
        qualification: hospital.headDoctorQual || 'MD (Transfusion Medicine)',
        phone: hospital.headDoctorPhone || hospital.contactPhone,
        email: hospital.headDoctorEmail || hospital.officialEmail,
      },
      facilities: hospital.facilities,
    };
  },

  // Update hospital profile (hospital_admin only)
  async updateHospitalProfile(hospitalId, updates) {
    const { name, address, city, contactPhone, officialEmail, bedCapacity, headName, headQualification } = updates;

    const updated = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        ...(name && { name: name.trim() }),
        ...(address && { address: address.trim() }),
        ...(city && { city: city.trim() }),
        ...(contactPhone && { contactPhone: contactPhone.trim() }),
        ...(officialEmail && { officialEmail: officialEmail.trim().toLowerCase() }),
        ...(bedCapacity && { bedCapacity: parseInt(bedCapacity, 10) }),
        ...(headName && { headDoctorName: headName.trim() }),
        ...(headQualification && { headDoctorQual: headQualification.trim() }),
      },
    });

    return this.getHospitalProfile(updated.id);
  },

  // Get hospital dashboard overview metrics
  async getOverviewMetrics(hospitalId) {
    const [requests, arrivals, donations, requirements, auditLogs] = await Promise.all([
      prisma.bloodRequest.findMany({
        where: { hospitalId },
        orderBy: { createdAt: 'desc' },
        include: { responses: true },
      }),
      prisma.donorArrival.findMany({
        where: { hospitalId },
        orderBy: { createdAt: 'desc' },
        include: {
          donor: {
            include: { user: true },
          },
        },
      }),
      prisma.donationRecord.findMany({
        where: { hospitalId },
        orderBy: { donationDate: 'desc' },
        include: {
          donor: {
            include: { user: true },
          },
        },
      }),
      prisma.bloodRequirement.findMany({
        where: { hospitalId },
      }),
      prisma.auditLog.findMany({
        where: { hospitalId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const activeRequests = requests.filter(
      (r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS' || r.status === 'PARTIALLY_FULFILLED'
    ).length;

    const totalResponses = requests.reduce((acc, r) => acc + (r.responses?.length || 0), 0);
    const expectedArrivals = arrivals.filter((a) => a.status === 'EXPECTED').length;
    const pendingArrivals = arrivals.filter(
      (a) => a.status === 'EXPECTED' || a.status === 'ARRIVED' || a.status === 'SCREENING_IN_PROGRESS'
    ).length;

    const formattedRequirements = requirements.map((req) => ({
      group: REVERSE_BLOOD_GROUP_MAP[req.bloodGroup] || req.bloodGroup,
      target: req.targetUnits,
      collected: req.collectedUnits,
      urgency: req.urgency === 'EMERGENCY' ? 'Emergency' : req.urgency === 'URGENT' ? 'Urgent' : 'Normal',
      status: req.collectedUnits < req.targetUnits * 0.5 ? 'Critical' : 'Active',
    }));

    return {
      activeRequests,
      totalResponses,
      expectedArrivals,
      successfulDonations: donations.length,
      pendingArrivals,
      requirementsNearCompletion: requirements.filter(
        (r) => r.collectedUnits >= r.targetUnits * 0.8 && r.collectedUnits < r.targetUnits
      ).length,
      bloodRequirements: formattedRequirements,
      recentArrivals: arrivals.slice(0, 5).map((a) => ({
        id: a.id,
        donorName: a.donor?.user?.fullName || 'Anonymous Donor',
        bloodGroup: REVERSE_BLOOD_GROUP_MAP[a.donor?.bloodGroup] || a.donor?.bloodGroup || 'O+',
        eta: a.eta,
        status: a.status === 'EXPECTED' ? 'Expected' : a.status === 'ARRIVED' ? 'Arrived' : 'In Screening',
        time: a.createdAt.toISOString().replace('T', ' ').substring(0, 16),
      })),
      recentDonations: donations.slice(0, 5).map((d) => ({
        id: d.id,
        donorName: d.donor?.user?.fullName || 'Anonymous Donor',
        bloodGroup: REVERSE_BLOOD_GROUP_MAP[d.bloodGroup] || d.bloodGroup,
        units: d.unitsDonated,
        time: d.donationDate.toISOString().replace('T', ' ').substring(0, 16),
        status: d.screeningPassed ? 'Passed & Stored' : 'Deferred',
      })),
      recentAuditLogs: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        actor: log.actorName,
        target: log.target,
        time: log.createdAt.toISOString().replace('T', ' ').substring(0, 16),
        notes: log.notes,
      })),
    };
  },

  // Staff Roster
  async getStaff(hospitalId) {
    const staffMembers = await prisma.hospitalStaff.findMany({
      where: { hospitalId },
      include: { user: true },
      orderBy: { joinedDate: 'asc' },
    });

    return staffMembers.map((s) => ({
      id: s.id,
      userId: s.userId,
      name: s.user.fullName,
      email: s.user.email,
      role: s.role.toLowerCase(),
      roleLabel: STAFF_ROLE_LABELS[s.role] || s.role,
      department: s.department,
      phone: s.user.phone,
      status: s.status,
      joinedDate: s.joinedDate.toISOString().split('T')[0],
      lastActive: s.lastActive ? s.lastActive.toISOString() : 'Active recently',
      avatar:
        s.user.avatarUrl ||
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
    }));
  },

  // Add staff member (hospital_admin only)
  async addStaff(hospitalId, payload, adminUser) {
    const { name, email, phone, role, department, password } = payload;

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ApiError(400, 'An account with this email already exists.', 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password || 'hospital123', 12);
    const staffRoleEnum = (role || 'medical_staff').toUpperCase();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          passwordHash,
          role: 'HOSPITAL',
          city: adminUser.city || 'Mumbai',
        },
      });

      const staff = await tx.hospitalStaff.create({
        data: {
          hospitalId,
          userId: user.id,
          role: staffRoleEnum,
          department: department || 'Transfusion Medicine',
          status: 'active',
        },
      });

      await tx.auditLog.create({
        data: {
          hospitalId,
          userId: adminUser.id,
          action: 'Staff Member Added',
          actorName: adminUser.fullName,
          target: `${name} (${STAFF_ROLE_LABELS[staffRoleEnum] || staffRoleEnum})`,
          notes: `Added to ${department || 'Transfusion Medicine'} department.`,
        },
      });

      return staff;
    });

    const completeStaff = await prisma.hospitalStaff.findUnique({
      where: { id: result.id },
      include: { user: true },
    });

    return {
      id: completeStaff.id,
      userId: completeStaff.userId,
      name: completeStaff.user.fullName,
      email: completeStaff.user.email,
      role: completeStaff.role.toLowerCase(),
      roleLabel: STAFF_ROLE_LABELS[completeStaff.role] || completeStaff.role,
      department: completeStaff.department,
      phone: completeStaff.user.phone,
      status: completeStaff.status,
      joinedDate: completeStaff.joinedDate.toISOString().split('T')[0],
      avatar: completeStaff.user.avatarUrl || '',
    };
  },

  // Remove staff member (hospital_admin only)
  async removeStaff(hospitalId, staffId, adminUser) {
    const staff = await prisma.hospitalStaff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff || staff.hospitalId !== hospitalId) {
      throw new ApiError(404, 'Staff member not found in this hospital.', 'STAFF_NOT_FOUND');
    }

    if (staff.userId === adminUser.id) {
      throw new ApiError(400, 'You cannot remove your own administrative account.', 'CANNOT_REMOVE_SELF');
    }

    await prisma.$transaction(async (tx) => {
      await tx.hospitalStaff.delete({ where: { id: staffId } });
      await tx.user.delete({ where: { id: staff.userId } });

      await tx.auditLog.create({
        data: {
          hospitalId,
          userId: adminUser.id,
          action: 'Staff Member Removed',
          actorName: adminUser.fullName,
          target: `${staff.user.fullName} (${STAFF_ROLE_LABELS[staff.role] || staff.role})`,
          notes: 'Account removed and access revoked.',
        },
      });
    });

    return { success: true, message: `Staff member ${staff.user.fullName} has been removed successfully.` };
  },

  // Donor Arrivals Board
  async getArrivals(hospitalId) {
    const arrivals = await prisma.donorArrival.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
      include: {
        donor: {
          include: { user: true },
        },
        request: true,
      },
    });

    return arrivals.map((a) => ({
      id: a.id,
      donorId: a.donorId,
      donorName: a.donor?.user?.fullName || 'Anonymous Donor',
      bloodGroup: REVERSE_BLOOD_GROUP_MAP[a.donor?.bloodGroup] || a.donor?.bloodGroup || 'O+',
      contactPhone: a.donor?.user?.phone || '+91 98200 00000',
      eta: a.eta,
      arrivedTime: a.arrivedTime ? a.arrivedTime.toISOString().substring(11, 16) : null,
      status: a.status === 'EXPECTED' ? 'Expected' : a.status === 'ARRIVED' ? 'Arrived' : a.status === 'SCREENING_IN_PROGRESS' ? 'Screening In-Progress' : a.status === 'COMPLETED' ? 'Completed' : 'No-Show',
      assignedStaff: a.assignedStaff || 'Medical Triage',
      requestTrackingCode: a.request?.trackingCode || 'Direct Visit',
    }));
  },

  // Update Arrival Status
  async updateArrivalStatus(hospitalId, arrivalId, newStatus, staffUser) {
    const arrival = await prisma.donorArrival.findUnique({
      where: { id: arrivalId },
      include: { donor: { include: { user: true } } },
    });

    if (!arrival || arrival.hospitalId !== hospitalId) {
      throw new ApiError(404, 'Arrival record not found.', 'ARRIVAL_NOT_FOUND');
    }

    const STATUS_MAP = {
      expected: 'EXPECTED',
      arrived: 'ARRIVED',
      'screening in-progress': 'SCREENING_IN_PROGRESS',
      completed: 'COMPLETED',
      'no-show': 'NO_SHOW',
      cancelled: 'CANCELLED',
    };

    const mapped = STATUS_MAP[newStatus.toLowerCase()] || 'ARRIVED';

    const updated = await prisma.donorArrival.update({
      where: { id: arrivalId },
      data: {
        status: mapped,
        arrivedTime: mapped === 'ARRIVED' ? new Date() : arrival.arrivedTime,
        assignedStaff: staffUser.fullName,
      },
    });

    return updated;
  },

  // Record Clinical Phlebotomy Donation Outcome
  async recordDonation(hospitalId, payload, staffUser) {
    const { donorId, bloodGroup, unitsDonated, donationType, screeningPassed, hemoglobinLevel, bloodPressure, pulseRate, bagBarcode, deferralReason } = payload;

    const mappedBg = BLOOD_GROUP_MAP[bloodGroup] || 'O_POSITIVE';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Record clinical donation
      const record = await tx.donationRecord.create({
        data: {
          hospitalId,
          donorId,
          bloodGroup: mappedBg,
          unitsDonated: parseInt(unitsDonated, 10) || 1,
          donationType: donationType || 'WHOLE_BLOOD',
          screeningPassed: Boolean(screeningPassed),
          hemoglobinLevel: parseFloat(hemoglobinLevel) || 13.5,
          bloodPressure: bloodPressure || '120/80',
          pulseRate: parseInt(pulseRate, 10) || 72,
          bagBarcode: bagBarcode || `BAG-${Date.now().toString().slice(-6)}`,
          deferralReason: deferralReason || null,
          verifiedBy: staffUser.fullName,
        },
      });

      // 2. Increment collected units in hospital inventory if passed
      if (screeningPassed) {
        await tx.bloodRequirement.upsert({
          where: {
            hospitalId_bloodGroup: {
              hospitalId,
              bloodGroup: mappedBg,
            },
          },
          update: {
            collectedUnits: { increment: parseInt(unitsDonated, 10) || 1 },
          },
          create: {
            hospitalId,
            bloodGroup: mappedBg,
            targetUnits: 20,
            collectedUnits: parseInt(unitsDonated, 10) || 1,
          },
        });

        // 3. Increment total donations on donor profile
        await tx.donorProfile.update({
          where: { id: donorId },
          data: {
            totalDonations: { increment: 1 },
            lastDonationDate: new Date(),
          },
        });
      }

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          hospitalId,
          userId: staffUser.id,
          action: 'Clinical Phlebotomy Recorded',
          actorName: staffUser.fullName,
          target: `${bagBarcode || record.id} (${bloodGroup})`,
          notes: screeningPassed ? 'Phlebotomy successful, units stored in blood bank.' : `Screening failed: ${deferralReason}`,
        },
      });

      return record;
    });

    return result;
  },

  // Get Donation Records
  async getDonationRecords(hospitalId) {
    const records = await prisma.donationRecord.findMany({
      where: { hospitalId },
      orderBy: { donationDate: 'desc' },
      include: {
        donor: { include: { user: true } },
      },
    });

    return records.map((r) => ({
      id: r.id,
      donationId: r.id,
      donorName: r.donor?.user?.fullName || 'Anonymous Donor',
      bloodGroup: REVERSE_BLOOD_GROUP_MAP[r.bloodGroup] || r.bloodGroup,
      unitsDonated: r.unitsDonated,
      donationType: r.donationType,
      screeningPassed: r.screeningPassed,
      hemoglobinLevel: r.hemoglobinLevel,
      bloodPressure: r.bloodPressure,
      pulseRate: r.pulseRate,
      bagBarcode: r.bagBarcode,
      deferralReason: r.deferralReason,
      verifiedBy: r.verifiedBy,
      donationDate: r.donationDate.toISOString().split('T')[0],
    }));
  },

  // Blood Requirements inventory
  async getRequirements(hospitalId) {
    const reqs = await prisma.bloodRequirement.findMany({
      where: { hospitalId },
      orderBy: { bloodGroup: 'asc' },
    });

    return reqs.map((r) => ({
      id: r.id,
      bloodGroup: REVERSE_BLOOD_GROUP_MAP[r.bloodGroup] || r.bloodGroup,
      targetUnits: r.targetUnits,
      collectedUnits: r.collectedUnits,
      urgency: r.urgency === 'EMERGENCY' ? 'Emergency' : r.urgency === 'URGENT' ? 'Urgent' : 'Normal',
      status: r.collectedUnits < r.targetUnits * 0.5 ? 'Critical' : 'Active',
    }));
  },

  // Update Blood Requirements
  async updateRequirements(hospitalId, payload) {
    const { bloodGroup, targetUnits, urgency } = payload;
    const mappedBg = BLOOD_GROUP_MAP[bloodGroup];
    if (!mappedBg) {
      throw new ApiError(400, 'Invalid blood group.', 'INVALID_BLOOD_GROUP');
    }

    const updated = await prisma.bloodRequirement.upsert({
      where: {
        hospitalId_bloodGroup: {
          hospitalId,
          bloodGroup: mappedBg,
        },
      },
      update: {
        ...(targetUnits && { targetUnits: parseInt(targetUnits, 10) }),
        ...(urgency && { urgency: (urgency || 'NORMAL').toUpperCase() }),
      },
      create: {
        hospitalId,
        bloodGroup: mappedBg,
        targetUnits: parseInt(targetUnits, 10) || 20,
        collectedUnits: 0,
        urgency: (urgency || 'NORMAL').toUpperCase(),
      },
    });

    return {
      id: updated.id,
      bloodGroup,
      targetUnits: updated.targetUnits,
      collectedUnits: updated.collectedUnits,
      urgency: updated.urgency,
      status: updated.collectedUnits < updated.targetUnits * 0.5 ? 'Critical' : 'Active',
    };
  },

  // Platform Operator: list pending hospitals
  async getPendingHospitals() {
    const hospitals = await prisma.hospital.findMany({
      where: { verificationStatus: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        staff: {
          include: { user: true },
        },
      },
    });

    return hospitals.map((h) => ({
      id: h.id,
      name: h.name,
      licenseNumber: h.licenseNumber,
      city: h.city,
      address: h.address,
      contactPhone: h.contactPhone,
      officialEmail: h.officialEmail,
      status: 'Pending',
      bedCapacity: h.bedCapacity,
      headDoctor: h.headDoctorName,
      submittedAt: h.createdAt.toISOString(),
    }));
  },

  // Platform Operator: review hospital application
  async verifyHospital(hospitalId, action, reviewerUser) {
    // action: 'approve' | 'reject'
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      throw new ApiError(404, 'Hospital application not found.', 'HOSPITAL_NOT_FOUND');
    }

    const newStatus = action.toLowerCase() === 'approve' ? 'VERIFIED' : 'REJECTED';

    const updated = await prisma.hospital.update({
      where: { id: hospitalId },
      data: { verificationStatus: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        hospitalId,
        userId: reviewerUser.id,
        action: `Hospital Registration: ${newStatus}`,
        actorName: reviewerUser.fullName,
        target: `${hospital.name} (${hospital.licenseNumber})`,
        notes: `Platform review completed. Hospital status set to ${newStatus}.`,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      licenseNumber: updated.licenseNumber,
      status: newStatus === 'VERIFIED' ? 'Verified' : 'Rejected',
    };
  },
};
