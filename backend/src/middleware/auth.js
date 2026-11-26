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

    // Support demo session tokens strictly in non-production development environments
    if (
      process.env.NODE_ENV !== 'production' &&
      (token.startsWith('jwt_demo_') || token.startsWith('jwt_mock_'))
    ) {
      // Check if token embeds a UUID
      const uuidMatch = token.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      let demoUser = null;

      if (uuidMatch) {
        demoUser = await prisma.user.findUnique({
          where: { id: uuidMatch[0] },
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
      }

      if (!demoUser) {
        const email = token.includes('donor')
          ? 'donor@lifora.org'
          : token.includes('hospital')
          ? 'hospital@lifora.org'
          : token.includes('admin') || token.includes('super')
          ? 'admin@lifora.org'
          : token.includes('recipient')
          ? 'recipient@lifora.org'
          : null;

        if (email) {
          demoUser = await prisma.user.findUnique({
            where: { email },
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
        }
      }

      if (demoUser) {
        req.user = demoUser;
        return next();
      }
    }

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

export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    return authenticate(req, res, next);
  } catch {
    return next();
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    // SUPER_ADMIN has platform-wide authorization
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Support both 'ADMIN' and 'SUPER_ADMIN' aliases
    const normalizedAllowed = allowedRoles.map((r) => (r === 'ADMIN' ? 'SUPER_ADMIN' : r));

    if (!normalizedAllowed.includes(req.user.role)) {
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

    // Platform Super Admin can perform administrative and oversight duties
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
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

// Restrict clinical document reviews to authorized medical staff or platform administrators
export const requireMedicalReviewer = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required.'));
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  if (
    req.user.role === 'HOSPITAL' &&
    req.user.staffProfile &&
    ['MEDICAL_STAFF', 'HOSPITAL_ADMIN'].includes(req.user.staffProfile.role)
  ) {
    return next();
  }

  return next(
    new ApiError(
      403,
      'Forbidden: Access to clinical medical reports is restricted to authorized medical reviewers and platform administrators.',
      'INSUFFICIENT_MEDICAL_REVIEW_PERMISSIONS'
    )
  );
};

// Ensure hospital is approved by platform operator before executing clinical operations
export const requireVerifiedHospital = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required.'));
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  const hospital = req.user.staffProfile?.hospital;
  if (!hospital) {
    return next(new ApiError(403, 'Hospital association required.', 'HOSPITAL_ASSOCIATION_REQUIRED'));
  }

  if (hospital.verificationStatus !== 'VERIFIED') {
    return next(
      new ApiError(
        403,
        `Hospital application is currently '${hospital.verificationStatus}'. Platform verification approval is required before accessing clinical operations.`,
        'HOSPITAL_NOT_VERIFIED'
      )
    );
  }

  next();
};
