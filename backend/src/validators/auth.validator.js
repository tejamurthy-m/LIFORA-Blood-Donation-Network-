import { z } from 'zod';
import { ApiError } from '../middleware/errorHandler.js';

const BloodGroupEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

// Map blood group strings to Prisma enum keys
export const BLOOD_GROUP_MAP = {
  'A+': 'A_POSITIVE',
  'A ': 'A_POSITIVE',
  'A-': 'A_NEGATIVE',
  'B+': 'B_POSITIVE',
  'B ': 'B_POSITIVE',
  'B-': 'B_NEGATIVE',
  'AB+': 'AB_POSITIVE',
  'AB ': 'AB_POSITIVE',
  'AB-': 'AB_NEGATIVE',
  'O+': 'O_POSITIVE',
  'O ': 'O_POSITIVE',
  'O-': 'O_NEGATIVE',
};

export const REVERSE_BLOOD_GROUP_MAP = {
  'A_POSITIVE': 'A+',
  'A_NEGATIVE': 'A-',
  'B_POSITIVE': 'B+',
  'B_NEGATIVE': 'B-',
  'AB_POSITIVE': 'AB+',
  'AB_NEGATIVE': 'AB-',
  'O_POSITIVE': 'O+',
  'O_NEGATIVE': 'O-',
};

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please provide a valid email address.'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['donor', 'recipient', 'hospital']),
  city: z.string().min(2, 'City is required.'),
  area: z.string().optional(),
  isPhoneVerified: z.boolean().optional(),

  // Role-specific fields
  bloodGroup: BloodGroupEnum.optional(),
  licenseNumber: z.string().optional(),
  bedCapacity: z.union([z.string(), z.number()]).optional(),
  headName: z.string().optional(),
  headQualification: z.string().optional(),
  emergencyPhone: z.string().optional(),
  hospitalName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  city: z.string().min(2).optional(),
  area: z.string().optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new ApiError(400, 'Validation failed for request payload.', 'VALIDATION_ERROR', details));
    }
    next(error);
  }
};
