import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  BLOOD_GROUP_MAP,
  REVERSE_BLOOD_GROUP_MAP,
} from '../validators/auth.validator.js';
import { calculateDistanceKm, CITY_COORDINATES } from '../utils/geo.js';
import { broadcastBloodAlert, emitToRequest, emitToUser, emitToHospital } from '../config/socket.js';
import { emailService } from './email.service.js';

// Status mappings between DB and frontend
export const DB_REQUEST_STATUS_MAP = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  PARTIALLY_FULFILLED: 'Partially Fulfilled',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
  CLOSED: 'Closed',
};

export const FRONTEND_REQUEST_STATUS_MAP = {
  pending: 'PENDING',
  'in progress': 'IN_PROGRESS',
  'partially fulfilled': 'PARTIALLY_FULFILLED',
  fulfilled: 'FULFILLED',
  cancelled: 'CANCELLED',
  closed: 'CLOSED',
};

export const DB_URGENCY_MAP = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
  EMERGENCY: 'Emergency',
};

export const FRONTEND_URGENCY_MAP = {
  normal: 'NORMAL',
  urgent: 'URGENT',
  emergency: 'EMERGENCY',
};

// Generate 4-step standard timeline based on request progress
export const buildTimeline = (request) => {
  const isEmergency = request.urgency === 'EMERGENCY';
  const responsesCount = request.responses?.length || 0;
  const isFulfilled =
    request.status === 'FULFILLED' || request.unitsFulfilled >= request.unitsRequired;
  const isInProgress =
    request.status === 'IN_PROGRESS' ||
    request.status === 'PARTIALLY_FULFILLED' ||
    responsesCount > 0;

  return [
    {
      step: 1,
      title: 'Request Submitted',
      time: request.createdAt.toISOString().replace('T', ' ').substring(0, 16),
      done: true,
      detail: `Requisition registered under tracking code ${request.trackingCode}`,
    },
    {
      step: 2,
      title: 'Donors Notified',
      time: 'Active',
      done: true,
      detail: isEmergency
        ? 'High-priority regional broadcast sent to matching verified donors'
        : 'Broadcasting to nearby verified donors',
    },
    {
      step: 3,
      title: 'Donor Responses Received',
      time: responsesCount > 0 ? `${responsesCount} Donors Responded` : 'Awaiting',
      done: isInProgress,
      detail:
        responsesCount > 0
          ? `${responsesCount} donor(s) accepted and dispatched to donation center`
          : 'Awaiting initial donor confirmations',
    },
    {
      step: 4,
      title: 'Fulfillment & Transfusion Clearance',
      time: isFulfilled ? 'Completed' : 'Pending',
      done: isFulfilled,
      detail: isFulfilled
        ? `${request.unitsFulfilled || request.unitsRequired} of ${request.unitsRequired} units delivered`
        : `Target: ${request.unitsRequired} units. Fulfilled: ${request.unitsFulfilled || 0}`,
    },
  ];
};

export const formatRequestResponse = (req, refLat = null, refLng = null) => {
  const bloodGroupStr =
    REVERSE_BLOOD_GROUP_MAP[req.bloodGroup] || req.bloodGroup;
  const urgencyStr = DB_URGENCY_MAP[req.urgency] || 'Normal';
  const statusStr = DB_REQUEST_STATUS_MAP[req.status] || 'Pending';

  let distanceKm = null;
  const reqLat = req.latitude != null ? req.latitude : CITY_COORDINATES[req.city?.toLowerCase()]?.lat;
  const reqLng = req.longitude != null ? req.longitude : CITY_COORDINATES[req.city?.toLowerCase()]?.lng;

  if (refLat != null && refLng != null && reqLat != null && reqLng != null) {
    distanceKm = calculateDistanceKm(refLat, refLng, reqLat, reqLng);
  }

  const acceptedDonors = (req.responses || []).map((resp) => {
    const fullName = resp.donor?.fullName || 'Anonymous Donor';
    const parts = fullName.split(' ');
    const name =
      parts.length > 2 && parts[0].includes('.')
        ? `${parts[0]} ${parts[1]} ${parts[parts.length - 1][0]}.`
        : parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1][0]}.`
        : fullName;

    return {
      id: resp.donorId,
      name,
      fullName,
      bloodGroup: resp.donor?.donorProfile?.bloodGroup
        ? REVERSE_BLOOD_GROUP_MAP[resp.donor.donorProfile.bloodGroup] ||
          resp.donor.donorProfile.bloodGroup
        : bloodGroupStr,
      phone: resp.donor?.phone || '+91 98200 00000',
      respondedAt: resp.respondedAt.toISOString(),
      eta: resp.etaMinutes ? `${resp.etaMinutes} mins` : '20 mins',
    };
  });

  return {
    id: req.id,
    trackingId: req.trackingCode,
    trackingCode: req.trackingCode,
    patientName: req.patientName,
    bloodGroup: bloodGroupStr,
    unitsRequired: req.unitsRequired,
    unitsFulfilled: req.unitsFulfilled,
    hospitalName: req.hospital?.name || req.locationDescription || 'Medical Centre',
    hospitalLocation: req.locationDescription,
    city: req.city,
    distanceKm: distanceKm != null ? distanceKm : 3.0,
    urgency: urgencyStr,
    requiredDate: req.requiredDate ? req.requiredDate.toISOString().split('T')[0] : 'Immediate',
    contactPerson: req.contactPerson,
    contactPhone: req.contactPhone,
    additionalInstructions: req.additionalInstructions || 'Standard cross-match requested.',
    status: statusStr,
    donorResponses: acceptedDonors.length,
    acceptedDonors,
    createdAt: req.createdAt.toISOString(),
    requesterId: req.requesterId || 'guest',
    hospitalId: req.hospitalId,
    timeline: buildTimeline(req),
  };
};

const isUuid = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export const requestService = {
  // Query blood requests with filters
  async getRequests(filters = {}) {
    const {
      status,
      urgency,
      bloodGroup,
      city,
      requesterId,
      hospitalId,
      userLat,
      userLng,
    } = filters;

    let refLat = userLat ? parseFloat(userLat) : null;
    let refLng = userLng ? parseFloat(userLng) : null;
    if (refLat == null && city) {
      const cityKey = city.toLowerCase().trim();
      if (CITY_COORDINATES[cityKey]) {
        refLat = CITY_COORDINATES[cityKey].lat;
        refLng = CITY_COORDINATES[cityKey].lng;
      }
    }

    const where = {};

    if (status && status !== 'ALL') {
      const mappedStatus = FRONTEND_REQUEST_STATUS_MAP[status.toLowerCase()];
      if (mappedStatus) {
        where.status = mappedStatus;
      }
    }

    if (urgency && urgency !== 'ALL') {
      const mappedUrgency = FRONTEND_URGENCY_MAP[urgency.toLowerCase()];
      if (mappedUrgency) {
        where.urgency = mappedUrgency;
      }
    }

    if (bloodGroup && bloodGroup !== 'ALL') {
      const mappedBg = BLOOD_GROUP_MAP[bloodGroup];
      if (mappedBg) {
        where.bloodGroup = mappedBg;
      }
    }

    if (city && city !== 'ALL' && city.trim() !== '') {
      where.city = {
        equals: city.trim(),
        mode: 'insensitive',
      };
    }

    if (requesterId) {
      where.requesterId = requesterId;
    }

    if (hospitalId) {
      where.hospitalId = hospitalId;
    }

    const requests = await prisma.bloodRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        hospital: true,
        responses: {
          include: {
            donor: {
              include: { donorProfile: true },
            },
          },
        },
      },
    });

    return requests.map((r) => formatRequestResponse(r, refLat, refLng));
  },

  // Get request by UUID or Tracking Code (e.g. LIF-8831)
  async getRequestById(idOrCode, refLat = null, refLng = null) {
    const where = isUuid(idOrCode)
      ? { OR: [{ id: idOrCode }, { trackingCode: idOrCode.toUpperCase() }] }
      : { trackingCode: idOrCode.toUpperCase() };

    const req = await prisma.bloodRequest.findFirst({
      where,
      include: {
        hospital: true,
        responses: {
          include: {
            donor: {
              include: { donorProfile: true },
            },
          },
        },
      },
    });

    if (!req) {
      throw new ApiError(404, `Blood request '${idOrCode}' not found.`, 'REQUEST_NOT_FOUND');
    }

    return formatRequestResponse(req, refLat, refLng);
  },

  // Create blood request
  async createRequest(payload, user = null) {
    const {
      patientName,
      bloodGroup,
      unitsRequired,
      hospitalName,
      hospitalLocation,
      city,
      urgency,
      requiredDate,
      contactPerson,
      contactPhone,
      additionalInstructions,
      hospitalId,
    } = payload;

    if (!bloodGroup) {
      throw new ApiError(400, 'Blood group is required.', 'BLOOD_GROUP_REQUIRED');
    }

    const mappedBloodGroup = BLOOD_GROUP_MAP[bloodGroup] || 'O_POSITIVE';
    const mappedUrgency = FRONTEND_URGENCY_MAP[(urgency || 'Normal').toLowerCase()] || 'NORMAL';
    const trackingCode = `LIF-${Math.floor(1000 + Math.random() * 9000)}`;

    let parsedDate = new Date();
    if (requiredDate && requiredDate !== 'Immediate') {
      const parsed = new Date(requiredDate);
      if (!isNaN(parsed.getTime())) {
        parsedDate = parsed;
      }
    }

    // Determine city coordinates
    const cityKey = (city || 'mumbai').toLowerCase().trim();
    const coords = CITY_COORDINATES[cityKey] || CITY_COORDINATES.mumbai;

    const newRequest = await prisma.bloodRequest.create({
      data: {
        trackingCode,
        patientName: patientName || 'Confidential Patient',
        bloodGroup: mappedBloodGroup,
        unitsRequired: parseInt(unitsRequired, 10) || 1,
        unitsFulfilled: 0,
        urgency: mappedUrgency,
        requiredDate: parsedDate,
        locationDescription: hospitalLocation || hospitalName || 'Medical Facility',
        city: city || 'Mumbai',
        latitude: coords.lat,
        longitude: coords.lng,
        contactPerson: contactPerson || user?.fullName || 'Attending Coordinator',
        contactPhone: contactPhone || user?.phone || '+91 98200 00000',
        additionalInstructions: additionalInstructions || 'Standard cross-match requested.',
        status: mappedUrgency === 'EMERGENCY' ? 'IN_PROGRESS' : 'PENDING',
        requesterId: user?.id || null,
        hospitalId: hospitalId || user?.staffProfile?.hospitalId || null,
      },
      include: {
        hospital: true,
        responses: true,
      },
    });

    const formatted = formatRequestResponse(newRequest);

    // Broadcast across Socket.IO network
    broadcastBloodAlert(formatted);
    if (newRequest.hospitalId) {
      emitToHospital(newRequest.hospitalId, 'blood_request:created', formatted);
    }

    // In background: notify matching available donors in the same city
    (async () => {
      try {
        const matchingDonors = await prisma.donorProfile.findMany({
          where: {
            bloodGroup: mappedBloodGroup,
            isAvailable: true,
            user: { city: { equals: newRequest.city, mode: 'insensitive' } },
          },
          include: { user: true },
          take: 10,
        });

        for (const donor of matchingDonors) {
          if (donor.userId !== user?.id) {
            await prisma.notification.create({
              data: {
                userId: donor.userId,
                type: 'EMERGENCY_REQUEST',
                title: `Urgent Requisition: ${bloodGroup} Needed`,
                message: `Patient requires ${newRequest.unitsRequired} unit(s) of ${bloodGroup} at ${newRequest.locationDescription}. Tracking: ${newRequest.trackingCode}`,
                metadata: {
                  requestId: newRequest.id,
                  trackingCode: newRequest.trackingCode,
                  bloodGroup,
                },
              },
            }).catch(() => {});

            emitToUser(donor.userId, 'notification:received', {
              title: `Urgent Requisition: ${bloodGroup} Needed`,
              message: `Patient requires ${newRequest.unitsRequired} unit(s) of ${bloodGroup}`,
              trackingCode: newRequest.trackingCode,
            });

            if (mappedUrgency === 'EMERGENCY' && donor.user.email) {
              emailService.sendEmergencyBloodAlert({
                donorEmail: donor.user.email,
                donorName: donor.user.fullName,
                bloodGroup,
                unitsRequired: newRequest.unitsRequired,
                urgency: newRequest.urgency,
                location: newRequest.locationDescription,
                trackingCode: newRequest.trackingCode,
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        // Silently capture broadcast errors
      }
    })();

    return formatted;
  },

  // Donor accepts blood request
  async acceptRequest(requestIdOrCode, donorUser) {
    const where = isUuid(requestIdOrCode)
      ? { OR: [{ id: requestIdOrCode }, { trackingCode: requestIdOrCode.toUpperCase() }] }
      : { trackingCode: requestIdOrCode.toUpperCase() };

    const req = await prisma.bloodRequest.findFirst({
      where,
      include: {
        hospital: true,
        responses: true,
      },
    });

    if (!req) {
      throw new ApiError(404, 'Blood request not found.', 'REQUEST_NOT_FOUND');
    }

    // Check if donor already accepted
    const existing = await prisma.donorResponse.findUnique({
      where: {
        requestId_donorId: {
          requestId: req.id,
          donorId: donorUser.id,
        },
      },
    });

    if (existing) {
      throw new ApiError(400, 'You have already accepted this blood request.', 'ALREADY_ACCEPTED');
    }

    // Record acceptance response
    const response = await prisma.donorResponse.create({
      data: {
        requestId: req.id,
        donorId: donorUser.id,
        status: 'ACCEPTED',
        etaMinutes: 20,
      },
    });

    // If request belongs to a hospital, register donor in DonorArrival
    if (req.hospitalId) {
      const donorProfile = await prisma.donorProfile.findUnique({
        where: { userId: donorUser.id },
      });

      if (donorProfile) {
        await prisma.donorArrival.create({
          data: {
            hospitalId: req.hospitalId,
            donorId: donorProfile.id,
            requestId: req.id,
            eta: '20 mins',
            status: 'EXPECTED',
            assignedStaff: 'Transfusion Triage Staff',
          },
        });
      }
    }

    // Update request status to IN_PROGRESS if pending
    if (req.status === 'PENDING') {
      await prisma.bloodRequest.update({
        where: { id: req.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Notify requester if exists
    if (req.requesterId) {
      await prisma.notification.create({
        data: {
          userId: req.requesterId,
          type: 'DONOR_MATCH',
          title: 'Donor En Route! 🩸',
          message: `${donorUser.fullName || 'A verified donor'} has accepted your blood request (${req.trackingCode}) and is arriving in ~20 minutes.`,
          metadata: {
            requestId: req.id,
            trackingCode: req.trackingCode,
            donorName: donorUser.fullName,
          },
        },
      });

      emitToUser(req.requesterId, 'notification:received', {
        title: 'Donor En Route! 🩸',
        message: `${donorUser.fullName || 'A verified donor'} has accepted your blood request (${req.trackingCode})`,
        trackingCode: req.trackingCode,
      });
    }

    // Real-time broadcast to all viewers of this request tracking code
    emitToRequest(req.trackingCode, 'request:donor_accepted', {
      requestId: req.id,
      trackingCode: req.trackingCode,
      donorName: donorUser.fullName,
      eta: '20 mins',
      status: 'In Progress',
    });

    if (req.hospitalId) {
      emitToHospital(req.hospitalId, 'donor:arrival_expected', {
        requestId: req.id,
        trackingCode: req.trackingCode,
        donorName: donorUser.fullName,
        eta: '20 mins',
      });
    }

    return {
      success: true,
      message: 'You have successfully accepted this request. Thank you for saving a life!',
      requestId: req.id,
      trackingCode: req.trackingCode,
      eta: '20 mins',
      acceptedAt: response.respondedAt.toISOString(),
    };
  },

  // Update request status (hospital staff or requester)
  async updateStatus(requestId, status, user) {
    const where = isUuid(requestId)
      ? { OR: [{ id: requestId }, { trackingCode: requestId.toUpperCase() }] }
      : { trackingCode: requestId.toUpperCase() };

    const req = await prisma.bloodRequest.findFirst({
      where,
    });

    if (!req) {
      throw new ApiError(404, 'Blood request not found.', 'REQUEST_NOT_FOUND');
    }

    const mappedStatus = FRONTEND_REQUEST_STATUS_MAP[status.toLowerCase()];
    if (!mappedStatus) {
      throw new ApiError(400, `Invalid status '${status}'.`, 'INVALID_STATUS');
    }

    const updated = await prisma.bloodRequest.update({
      where: { id: req.id },
      data: { status: mappedStatus },
      include: {
        hospital: true,
        responses: {
          include: {
            donor: {
              include: { donorProfile: true },
            },
          },
        },
      },
    });

    const formatted = formatRequestResponse(updated);
    emitToRequest(updated.trackingCode, 'request:status_changed', formatted);
    return formatted;
  },
};
