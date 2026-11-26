import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { resolveCoordinates } from '../utils/geo.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/token.js';
import {
  BLOOD_GROUP_MAP,
  REVERSE_BLOOD_GROUP_MAP,
} from '../validators/auth.validator.js';

// Format user object to maintain complete backwards compatibility with existing frontend UI
export const formatUserResponse = (user) => {
  const roleLower = user.role.toLowerCase();

  const formatted = {
    id: user.id,
    name: user.fullName,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: roleLower,
    city: user.city,
    area: user.area || '',
    avatar: user.avatarUrl || '',
    isActive: user.isActive,
    isPhoneVerified: Boolean(user.isPhoneVerified),
    isEmailVerified: Boolean(user.isEmailVerified),
    createdAt: user.createdAt,
  };

  if (user.role === 'DONOR' && user.donorProfile) {
    formatted.bloodGroup = REVERSE_BLOOD_GROUP_MAP[user.donorProfile.bloodGroup] || user.donorProfile.bloodGroup;
    formatted.isAvailable = user.donorProfile.isAvailable;
    formatted.emergencyReady = user.donorProfile.emergencyReady;
    formatted.badge = user.donorProfile.badge;
    formatted.totalDonations = user.donorProfile.totalDonations;
    formatted.lastDonationDate = user.donorProfile.lastDonationDate;
    formatted.profileCompletion = user.donorProfile.profileCompletion;
    formatted.bio = user.donorProfile.bio;
    formatted.verificationStatus = user.donorProfile.verificationStatus;
    formatted.donorId = user.donorProfile.id;
  }

  if (user.role === 'RECIPIENT' && user.recipientProfile) {
    formatted.emergencyPhone = user.recipientProfile.emergencyPhone;
    formatted.hospitalName = user.recipientProfile.hospitalName;
  }

  if (user.role === 'HOSPITAL' && user.staffProfile) {
    formatted.staffRole = user.staffProfile.role.toLowerCase();
    formatted.department = user.staffProfile.department;
    formatted.hospitalId = user.staffProfile.hospitalId;
    if (user.staffProfile.hospital) {
      formatted.hospitalName = user.staffProfile.hospital.name;
      formatted.hospitalLicense = user.staffProfile.hospital.licenseNumber;
      formatted.hospitalVerificationStatus = user.staffProfile.hospital.verificationStatus;
    }
  }

  return formatted;
};

export const authService = {
  // Register user with polymorphic profile
  async register(payload) {
    const {
      fullName,
      email,
      phone,
      password,
      role,
      city,
      area,
      bloodGroup,
      licenseNumber,
      bedCapacity,
      headName,
      headQualification,
      emergencyPhone,
      hospitalName,
    } = payload;

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      throw new ApiError(400, 'An account with this email address already exists.', 'EMAIL_EXISTS');
    }

    // Check duplicate phone
    const existingPhone = await prisma.user.findUnique({
      where: { phone: phone.trim() },
    });
    if (existingPhone) {
      throw new ApiError(400, 'An account with this phone number already exists.', 'PHONE_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const roleUpper = role.toUpperCase();

    // Interactive Transaction for atomicity
    const createdUser = await prisma.$transaction(async (tx) => {
      let hospitalId = null;

      // Hospital specific registration
      if (roleUpper === 'HOSPITAL') {
        if (!licenseNumber) {
          throw new ApiError(400, 'Hospital license number is required.', 'LICENSE_REQUIRED');
        }

        const existingLicense = await tx.hospital.findUnique({
          where: { licenseNumber: licenseNumber.trim().toUpperCase() },
        });
        if (existingLicense) {
          throw new ApiError(400, 'A hospital with this license number is already registered.', 'LICENSE_EXISTS');
        }

        const coords = resolveCoordinates(city, area);
        const newHospital = await tx.hospital.create({
          data: {
            name: fullName.trim(),
            licenseNumber: licenseNumber.trim().toUpperCase(),
            registrationNumber: `REG-${Date.now().toString().slice(-6)}`,
            address: area ? `${area}, ${city}` : city,
            city,
            latitude: coords.lat,
            longitude: coords.lng,
            contactPhone: phone,
            officialEmail: normalizedEmail,
            verificationStatus: 'PENDING',
            bedCapacity: parseInt(bedCapacity, 10) || 200,
            headDoctorName: headName || '',
            headDoctorQual: headQualification || 'MD (Transfusion Medicine)',
            headDoctorPhone: phone,
            headDoctorEmail: normalizedEmail,
          },
        });
        hospitalId = newHospital.id;

        // Record initial registration audit log
        await tx.auditLog.create({
          data: {
            hospitalId: newHospital.id,
            action: 'Hospital Registration Application Submitted',
            actorName: `${fullName} (Applicant)`,
            target: licenseNumber.trim().toUpperCase(),
            notes: 'Initial registration application submitted via portal. Status set to Pending review.',
          },
        });
      }

      // Create base user
      const user = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          passwordHash,
          role: roleUpper,
          city: city.trim(),
          area: area ? area.trim() : null,
          isPhoneVerified: Boolean(payload.isPhoneVerified),
        },
      });

      // Create attached profile
      if (roleUpper === 'DONOR') {
        const mappedBloodGroup = BLOOD_GROUP_MAP[bloodGroup] || 'O_POSITIVE';
        const coords = resolveCoordinates(city, area);
        await tx.donorProfile.create({
          data: {
            userId: user.id,
            bloodGroup: mappedBloodGroup,
            latitude: coords.lat,
            longitude: coords.lng,
            isAvailable: true,
            emergencyReady: true,
            profileCompletion: 80,
            verificationStatus: 'PENDING',
          },
        });
      } else if (roleUpper === 'RECIPIENT') {
        await tx.recipientProfile.create({
          data: {
            userId: user.id,
            emergencyPhone: emergencyPhone || phone,
            hospitalName: hospitalName || null,
          },
        });
      } else if (roleUpper === 'HOSPITAL') {
        await tx.hospitalStaff.create({
          data: {
            hospitalId,
            userId: user.id,
            role: 'HOSPITAL_ADMIN',
            department: 'Transfusion Medicine & Blood Centre',
            status: 'active',
          },
        });
      }

      return user;
    });

    // Re-fetch complete user with associations
    const completeUser = await prisma.user.findUnique({
      where: { id: createdUser.id },
      include: {
        donorProfile: true,
        recipientProfile: true,
        staffProfile: {
          include: { hospital: true },
        },
      },
    });

    // Generate Tokens
    const tokenPayload = {
      userId: completeUser.id,
      email: completeUser.email,
      role: completeUser.role,
      staffRole: completeUser.staffProfile?.role || null,
      hospitalId: completeUser.staffProfile?.hospitalId || null,
    };

    const token = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: completeUser.id });

    // Store hashed refresh token
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: completeUser.id,
        expiresAt,
      },
    });

    return {
      user: formatUserResponse(completeUser),
      token,
      refreshToken,
    };
  },

  // Login user with credentials verification
  async login(email, password) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        donorProfile: true,
        recipientProfile: true,
        staffProfile: {
          include: { hospital: true },
        },
      },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account has been deactivated. Please contact support.', 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    // Update lastActive timestamp if hospital staff
    if (user.staffProfile) {
      await prisma.hospitalStaff.update({
        where: { id: user.staffProfile.id },
        data: { lastActive: new Date() },
      });
    }

    // Generate JWT access & refresh tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      staffRole: user.staffProfile?.role || null,
      hospitalId: user.staffProfile?.hospitalId || null,
    };

    const token = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Store hashed refresh token
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: formatUserResponse(user),
      token,
      refreshToken,
    };
  },

  // Refresh token rotation
  async refreshAccessToken(rawRefreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token. Please sign in again.', 'INVALID_REFRESH_TOKEN');
    }

    const tokenHash = hashToken(rawRefreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            donorProfile: true,
            recipientProfile: true,
            staffProfile: { include: { hospital: true } },
          },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      throw new ApiError(401, 'Refresh token has expired. Please sign in again.', 'EXPIRED_REFRESH_TOKEN');
    }

    // Rotate: Delete old token and issue a fresh pair
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const user = storedToken.user;
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      staffRole: user.staffProfile?.role || null,
      hospitalId: user.staffProfile?.hospitalId || null,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(newRefreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: formatUserResponse(user),
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  // Logout by deleting the refresh token
  async logout(rawRefreshToken) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await prisma.refreshToken.deleteMany({
        where: { tokenHash },
      });
    }
    return { success: true, message: 'Logged out successfully.' };
  },

  // Change password
  async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(400, 'Existing password is incorrect.', 'INVALID_OLD_PASSWORD');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({ where: { userId } });

    return { success: true, message: 'Password changed successfully. Please log in with your new credentials.' };
  },

  // Update profile
  async updateProfile(userId, updates) {
    const { fullName, name, phone, city, area, bio, avatarUrl, bloodGroup, age, isAvailable } = updates;
    const targetName = (fullName || name || '').trim();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(targetName && { fullName: targetName }),
        ...(phone && { phone: phone.trim() }),
        ...(city && { city: city.trim() }),
        ...(area !== undefined && { area: area.trim() }),
        ...(avatarUrl && { avatarUrl }),
      },
      include: {
        donorProfile: true,
        recipientProfile: true,
        staffProfile: { include: { hospital: true } },
      },
    });

    if (updatedUser.donorProfile) {
      const targetCity = city ? city.trim() : updatedUser.city;
      const targetArea = area ? area.trim() : updatedUser.area;
      const coords = resolveCoordinates(targetCity, targetArea);
      const mappedBg = bloodGroup ? BLOOD_GROUP_MAP[bloodGroup] || bloodGroup : undefined;

      await prisma.donorProfile.update({
        where: { id: updatedUser.donorProfile.id },
        data: {
          ...(bio !== undefined && { bio: bio.trim() }),
          ...(age !== undefined && { age: parseInt(age, 10) }),
          ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
          ...(mappedBg && { bloodGroup: mappedBg }),
          latitude: coords.lat,
          longitude: coords.lng,
        },
      });
    }

    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        donorProfile: true,
        recipientProfile: true,
        staffProfile: { include: { hospital: true } },
      },
    });

    return formatUserResponse(refreshedUser || updatedUser);
  },
};
