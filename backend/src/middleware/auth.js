import { verifyAccessToken } from '../utils/token.js';
import { prisma } from '../config/prisma.js';
import { ApiError } from './errorHandler.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token required. Please log in.');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Authentication token has expired. Please refresh your session.', 'TOKEN_EXPIRED');
      }
      throw new ApiError(401, 'Invalid authentication token.', 'INVALID_TOKEN');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        donorProfile: true,
        recipientProfile: true,
        staffProfile: {
          include: {
            hospital: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(401, 'User account associated with this token no longer exists.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'This account has been suspended or deactivated. Contact LIFORA support.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Forbidden: Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
          'INSUFFICIENT_ROLE_PERMISSIONS'
        )
      );
    }

    next();
  };
};

export const requireStaffRole = (...allowedStaffRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (req.user.role !== 'HOSPITAL' || !req.user.staffProfile) {
      return next(
        new ApiError(
          403,
          'Forbidden: Only registered hospital staff members can perform this operation.',
          'NOT_HOSPITAL_STAFF'
        )
      );
    }

    const currentStaffRole = req.user.staffProfile.role;
    if (!allowedStaffRoles.includes(currentStaffRole)) {
      return next(
        new ApiError(
          403,
          `Forbidden: Required staff role(s): ${allowedStaffRoles.join(', ')}. Your role: ${currentStaffRole}`,
          'INSUFFICIENT_STAFF_PERMISSIONS'
        )
      );
    }

    next();
  };
};
