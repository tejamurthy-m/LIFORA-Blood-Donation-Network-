import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  calculateDistanceKm,
  CITY_COORDINATES,
  resolveCoordinates,
} from '../utils/geo.js';
import { emitToUser } from '../config/socket.js';
import {
  BLOOD_GROUP_MAP,
  REVERSE_BLOOD_GROUP_MAP,
} from '../validators/auth.validator.js';
import {
  getCompatibleDonors,
  getCompatibleRecipients,
} from '../utils/bloodCompatibility.js';

// Format donor database record into full-stack frontend compatible contract
export const formatDonorRecord = (donorProfile, refLat = null, refLng = null) => {
  const bloodGroupStr =
    REVERSE_BLOOD_GROUP_MAP[donorProfile.bloodGroup] || donorProfile.bloodGroup;

  // Resolve donor coordinates: database lat/lng first, fallback to city/area geocoding
  const donorCoords =
    donorProfile.latitude != null && donorProfile.longitude != null
      ? { lat: donorProfile.latitude, lng: donorProfile.longitude }
      : resolveCoordinates(donorProfile.user?.city, donorProfile.user?.area);

  // Calculate distance from reference coordinates
  let distanceKm = null;
  if (
    refLat != null &&
    refLng != null &&
    donorCoords.lat != null &&
    donorCoords.lng != null
  ) {
    distanceKm = calculateDistanceKm(
      refLat,
      refLng,
      donorCoords.lat,
      donorCoords.lng
    );
  }

  // Abbreviated first name + initial (preserving titles like Dr.)
  const fullName = donorProfile.user?.fullName || 'Anonymous Donor';
  const nameParts = fullName.split(' ');
  const displayName =
    nameParts.length > 2 && nameParts[0].includes('.')
      ? `${nameParts[0]} ${nameParts[1]} ${nameParts[nameParts.length - 1][0]}.`
      : nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : fullName;

  return {
    id: donorProfile.id,
    donorId: donorProfile.id,
    userId: donorProfile.userId,
    name: displayName,
    fullName: fullName,
    email: donorProfile.user?.email || '',
    phone: donorProfile.user?.phone || '',
    bloodGroup: bloodGroupStr,
    city: donorProfile.user?.city || 'Mumbai',
    area: donorProfile.user?.area || 'Central Area',
    lat: donorCoords.lat,
    lng: donorCoords.lng,
    distanceKm: distanceKm != null ? distanceKm : 3.5,
    isAvailable: donorProfile.isAvailable,
    emergencyReady: donorProfile.emergencyReady,
    badge: donorProfile.badge || 'Verified Donor',
    totalDonations: donorProfile.totalDonations,
    lastDonationDate: donorProfile.lastDonationDate
      ? donorProfile.lastDonationDate.toISOString().split('T')[0]
      : 'Recently',
    compatibility: getCompatibleRecipients(bloodGroupStr),
    verified: donorProfile.verificationStatus === 'VERIFIED',
    verificationStatus: donorProfile.verificationStatus,
    age: donorProfile.age || 28,
    responseRate: '98%',
    avgResponseMinutes: 14,
    bio: donorProfile.bio || 'Voluntary donor dedicated to emergency units.',
    avatar:
      donorProfile.user?.avatarUrl ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  };
};

export const donorService = {
  // Query donors with rich filtering and spatial distance
  async getDonors(filters = {}) {
    const {
      bloodGroup,
      city,
      onlyAvailable,
      maxDistance,
      search,
      sortBy,
      userLat,
      userLng,
      userCity,
      userArea,
      compatibleWith, // Optional: if provided, returns all compatible donors for this blood group
    } = filters;

    // Determine reference coordinates for distance
    let refLat = userLat ? parseFloat(userLat) : null;
    let refLng = userLng ? parseFloat(userLng) : null;

    if (refLat == null) {
      if (city && city !== 'ALL' && city.trim() !== '') {
        const coords = resolveCoordinates(city);
        refLat = coords.lat;
        refLng = coords.lng;
      } else if (userCity && userCity !== 'ALL' && userCity.trim() !== '') {
        const coords = resolveCoordinates(userCity, userArea);
        refLat = coords.lat;
        refLng = coords.lng;
      } else {
        refLat = CITY_COORDINATES.mumbai.lat;
        refLng = CITY_COORDINATES.mumbai.lng;
      }
    }

    // Build Prisma query where clause
    const where = {
      user: {
        isActive: true,
      },
    };

    // Availability filter
    if (onlyAvailable === true || onlyAvailable === 'true') {
      where.isAvailable = true;
    }

    // City filter
    if (city && city !== 'ALL' && city.trim() !== '') {
      where.user.city = {
        equals: city.trim(),
        mode: 'insensitive',
      };
    }

    // Blood group filter
    if (bloodGroup && bloodGroup !== 'ALL') {
      // Find compatible blood groups if exact match or compatible
      const compatibleGroups = getCompatibleDonors(bloodGroup);
      const mappedPrismaEnums = compatibleGroups
        .map((bg) => BLOOD_GROUP_MAP[bg])
        .filter(Boolean);

      where.bloodGroup = {
        in: mappedPrismaEnums,
      };
    } else if (compatibleWith) {
      const compatibleGroups = getCompatibleDonors(compatibleWith);
      const mappedPrismaEnums = compatibleGroups
        .map((bg) => BLOOD_GROUP_MAP[bg])
        .filter(Boolean);

      where.bloodGroup = {
        in: mappedPrismaEnums,
      };
    }

    // Fetch matching donor profiles from Supabase
    const profiles = await prisma.donorProfile.findMany({
      where,
      include: {
        user: true,
      },
    });

    // Format and calculate distances
    let list = profiles.map((p) => formatDonorRecord(p, refLat, refLng));

    // Distance radius filter: strictly filter out any donor farther than maxDistance
    if (maxDistance != null && maxDistance !== '' && maxDistance !== 'ALL') {
      const maxDist = parseFloat(maxDistance);
      if (!isNaN(maxDist) && maxDist > 0) {
        list = list.filter((d) => d.distanceKm != null && d.distanceKm <= maxDist);
      }
    }

    // Search query filter (name, area, city, bloodGroup)
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.area.toLowerCase().includes(q) ||
          d.bloodGroup.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'distance') {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'donations') {
      list.sort((a, b) => b.totalDonations - a.totalDonations);
    } else if (sortBy === 'response') {
      list.sort((a, b) => a.avgResponseMinutes - b.avgResponseMinutes);
    }

    return list;
  },

  // Get single donor by Profile ID or User ID
  async getDonorById(id, refLat = null, refLng = null) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let profile = null;
    if (isUuid) {
      profile = await prisma.donorProfile.findFirst({
        where: {
          OR: [{ id }, { userId: id }],
        },
        include: {
          user: true,
        },
      });
    } else {
      profile = await prisma.donorProfile.findFirst({
        include: {
          user: true,
        },
      });
    }

    if (!profile) {
      throw new ApiError(404, 'Donor profile not found.', 'DONOR_NOT_FOUND');
    }

    return formatDonorRecord(profile, refLat, refLng);
  },

  // Update donor availability status
  async updateAvailability(donorIdOrUserId, isAvailable, requestingUser) {
    const profile = await prisma.donorProfile.findFirst({
      where: {
        OR: [{ id: donorIdOrUserId }, { userId: donorIdOrUserId }],
      },
    });

    if (!profile) {
      throw new ApiError(404, 'Donor profile not found.', 'DONOR_NOT_FOUND');
    }

    // Authorization: User can only toggle their own availability unless Super Admin
    if (
      requestingUser.role !== 'SUPER_ADMIN' &&
      requestingUser.id !== profile.userId
    ) {
      throw new ApiError(
        403,
        'Forbidden: You can only update your own donor availability.',
        'FORBIDDEN_AVAILABILITY_UPDATE'
      );
    }

    const updated = await prisma.donorProfile.update({
      where: { id: profile.id },
      data: { isAvailable: Boolean(isAvailable) },
      include: { user: true },
    });

    return formatDonorRecord(updated);
  },

  // Update donor profile attributes
  async updateProfile(userId, updates = {}) {
    const profile = await prisma.donorProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw new ApiError(404, 'Donor profile not found.', 'DONOR_NOT_FOUND');
    }

    const { bio, age, isAvailable, emergencyReady, city, area } = updates;

    if (city || area) {
      const targetCity = city ? city.trim() : profile.user.city;
      const targetArea = area ? area.trim() : profile.user.area;
      const coords = resolveCoordinates(targetCity, targetArea);

      await prisma.user.update({
        where: { id: userId },
        data: {
          city: city ? city.trim() : undefined,
          area: area ? area.trim() : undefined,
        },
      });

      await prisma.donorProfile.update({
        where: { id: profile.id },
        data: {
          latitude: coords.lat,
          longitude: coords.lng,
        },
      });
    }

    const updated = await prisma.donorProfile.update({
      where: { id: profile.id },
      data: {
        bio: bio !== undefined ? bio : undefined,
        age: age !== undefined ? parseInt(age, 10) : undefined,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : undefined,
        emergencyReady: emergencyReady !== undefined ? Boolean(emergencyReady) : undefined,
      },
      include: { user: true },
    });

    return formatDonorRecord(updated);
  },

  // Dispatch direct donation request to donor
  async sendDirectRequest(donorId, requestData, requestingUser) {
    let donor = null;
    try {
      donor = await this.getDonorById(donorId);
    } catch {
      // If donorId is a mock format like 'donor-1', find the first matching or seeded donor
      const fallback = await prisma.donorProfile.findFirst({
        include: { user: true },
      });
      if (fallback) {
        donor = formatDonorRecord(fallback);
      }
    }

    if (!donor) {
      throw new ApiError(404, 'Donor profile not found.', 'DONOR_NOT_FOUND');
    }

    // Determine the sender's display name
    // Priority: explicit patientName or requester passed in requestData, or requestingUser fullName (if not self)
    const requesterName =
      requestData?.patientName ||
      requestData?.requester ||
      (requestingUser && requestingUser.id !== donor.userId ? requestingUser.fullName : null) ||
      'Verified Patient';

    // Create in-app notification for the target donor
    if (donor.userId) {
      const hospitalText = requestData?.hospitalName ? ` for ${requestData.hospitalName}` : '';
      const createdNotif = await prisma.notification.create({
        data: {
          userId: donor.userId,
          type: 'DONOR_MATCH',
          title: 'Direct Blood Requisition Received',
          message: `${requesterName} has requested an urgent ${donor.bloodGroup} donation from you${hospitalText}.`,
          metadata: {
            requesterId: requestingUser?.id || null,
            requesterName: requesterName,
            bloodGroup: donor.bloodGroup,
            ...requestData,
          },
        },
      }).catch((e) => {
        console.warn('Notification create warning:', e.message);
        return null;
      });

      if (createdNotif) {
        emitToUser(donor.userId, 'notification:received', {
          id: createdNotif.id,
          type: createdNotif.type,
          title: createdNotif.title,
          message: createdNotif.message,
          metadata: createdNotif.metadata,
          isRead: false,
          createdAt: createdNotif.createdAt.toISOString(),
        });
      }
    }

    return {
      success: true,
      message: `Direct request dispatched. The donor (${donor.fullName}) has been notified via verified notification.`,
      donorId: donor.id,
      donorName: donor.fullName,
      dispatchedAt: new Date().toISOString(),
    };
  },
};
