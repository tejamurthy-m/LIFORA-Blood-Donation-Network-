import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { emailService } from './email.service.js';
import { logger } from '../config/logger.js';

// In-memory store with automatic TTL cleanup
// Key: phone or email, Value: { code, expiresAt, attempts, verified }
const otpStore = new Map();
const resetTokenStore = new Map();

// Helper to generate secure 6-digit numeric OTP
const generateNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getPhoneKey = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export const otpService = {
  // 1. Phone OTP: Generate and dispatch
  async sendPhoneOtp(phone) {
    if (!phone || phone.trim().length < 8) {
      throw new ApiError(400, 'A valid mobile phone number is required.');
    }

    const cleanPhone = phone.trim();
    const phoneKey = getPhoneKey(cleanPhone);
    const code = generateNumericOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    const entry = {
      code,
      expiresAt,
      attempts: 0,
      verified: false,
    };

    otpStore.set(`phone:${cleanPhone}`, entry);
    if (phoneKey) {
      otpStore.set(`phone:${phoneKey}`, entry);
    }

    logger.info(`[PHONE_OTP] Generated OTP for ${cleanPhone} (key: ${phoneKey}): ${code} (expires in 10m)`);

    return {
      success: true,
      message: `OTP sent to ${cleanPhone}. Valid for 10 minutes.`,
      // Expose OTP in development for immediate testability without SMS gateway charges
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: code } : {}),
    };
  },

  // 2. Phone OTP: Verify code and mark user verified if authenticated
  async verifyPhoneOtp(phone, inputOtp, currentUser = null) {
    if (!phone || !inputOtp) {
      throw new ApiError(400, 'Phone number and 6-digit OTP code are required.');
    }

    const cleanPhone = phone.trim();
    const phoneKey = getPhoneKey(cleanPhone);
    const entry = otpStore.get(`phone:${cleanPhone}`) || (phoneKey ? otpStore.get(`phone:${phoneKey}`) : null);

    if (!entry) {
      throw new ApiError(400, 'No active OTP found for this phone number. Please request a new code.', 'OTP_NOT_FOUND');
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(`phone:${cleanPhone}`);
      if (phoneKey) otpStore.delete(`phone:${phoneKey}`);
      throw new ApiError(400, 'This OTP has expired. Please request a fresh code.', 'OTP_EXPIRED');
    }

    if (entry.attempts >= 5) {
      otpStore.delete(`phone:${cleanPhone}`);
      if (phoneKey) otpStore.delete(`phone:${phoneKey}`);
      throw new ApiError(429, 'Too many invalid attempts. Please request a new OTP.', 'OTP_LOCKED');
    }

    if (entry.code !== inputOtp.trim()) {
      entry.attempts += 1;
      throw new ApiError(400, `Invalid OTP code. ${5 - entry.attempts} attempt(s) remaining.`, 'INVALID_OTP');
    }

    // OTP successfully verified
    otpStore.delete(`phone:${cleanPhone}`);
    if (phoneKey) otpStore.delete(`phone:${phoneKey}`);

    // If a user account matches or user is logged in, mark phone verified
    const userToUpdate = currentUser?.id
      ? await prisma.user.findUnique({ where: { id: currentUser.id } })
      : await prisma.user.findFirst({
          where: {
            OR: [
              { phone: cleanPhone },
              ...(phoneKey ? [{ phone: { contains: phoneKey } }] : []),
            ],
          },
        });

    if (userToUpdate) {
      await prisma.user.update({
        where: { id: userToUpdate.id },
        data: { isPhoneVerified: true },
      });
      logger.info(`User ${userToUpdate.id} phone (${cleanPhone}) marked VERIFIED.`);
    }

    return {
      success: true,
      message: 'Phone number verified successfully.',
      verified: true,
      phone: cleanPhone,
    };
  },

  // 3. Email Verification: Generate code and send email
  async sendEmailVerification(email) {
    if (!email || !email.includes('@')) {
      throw new ApiError(400, 'A valid email address is required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const code = generateNumericOtp();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    otpStore.set(`email:${normalizedEmail}`, {
      code,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    logger.info(`[EMAIL_OTP] Generated verification code for ${normalizedEmail}: ${code}`);

    // Send email via Nodemailer
    await emailService.sendEmailVerificationOtp({
      email: normalizedEmail,
      otpCode: code,
    });

    return {
      success: true,
      message: `Verification code dispatched to ${normalizedEmail}.`,
      ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
    };
  },

  // 4. Email Verification: Verify code
  async verifyEmailCode(email, inputCode, currentUser = null) {
    if (!email || !inputCode) {
      throw new ApiError(400, 'Email and verification code are required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const key = `email:${normalizedEmail}`;
    const entry = otpStore.get(key);

    if (!entry) {
      throw new ApiError(400, 'No active verification code for this email. Please request a new one.', 'CODE_NOT_FOUND');
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(key);
      throw new ApiError(400, 'Verification code has expired. Please request a new code.', 'CODE_EXPIRED');
    }

    if (entry.attempts >= 5) {
      otpStore.delete(key);
      throw new ApiError(429, 'Too many invalid attempts. Please request a new verification code.', 'CODE_LOCKED');
    }

    if (entry.code !== inputCode.trim()) {
      entry.attempts += 1;
      throw new ApiError(400, `Invalid verification code. ${5 - entry.attempts} attempt(s) remaining.`, 'INVALID_CODE');
    }

    // Code matches
    otpStore.delete(key);

    const userToUpdate = currentUser?.id
      ? await prisma.user.findUnique({ where: { id: currentUser.id } })
      : await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (userToUpdate) {
      await prisma.user.update({
        where: { id: userToUpdate.id },
        data: { isEmailVerified: true },
      });
      logger.info(`User ${userToUpdate.id} email (${normalizedEmail}) marked VERIFIED.`);
    }

    return {
      success: true,
      message: 'Email address verified successfully.',
      verified: true,
      email: normalizedEmail,
    };
  },

  // 5. Password Reset: Request Token
  async requestPasswordReset(email) {
    if (!email || !email.includes('@')) {
      throw new ApiError(400, 'A valid email address is required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Security best practice: don't reveal if email exists, return success
      return {
        success: true,
        message: 'If an account exists with this email, a password reset token has been dispatched.',
      };
    }

    // Generate secure 32-character hexadecimal token and numeric code
    const token = crypto.randomBytes(24).toString('hex');
    const resetCode = generateNumericOtp();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour validity

    resetTokenStore.set(token, {
      userId: user.id,
      email: normalizedEmail,
      resetCode,
      expiresAt,
    });

    // Also map by email for easy lookup via reset code
    resetTokenStore.set(`code:${normalizedEmail}`, {
      token,
      userId: user.id,
      resetCode,
      expiresAt,
    });

    logger.info(`[PASSWORD_RESET] Token generated for ${normalizedEmail}. Code: ${resetCode}`);

    await emailService.sendPasswordResetToken({
      email: normalizedEmail,
      token,
      resetCode,
    });

    return {
      success: true,
      message: 'Password reset instructions have been dispatched.',
      ...(process.env.NODE_ENV !== 'production' ? { devResetCode: resetCode, devToken: token } : {}),
    };
  },

  // 6. Password Reset: Reset with Token or Code
  async resetPassword(payload) {
    const { email, token, resetCode, newPassword } = payload;

    if (!newPassword || newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters in length.');
    }

    let record = null;
    let foundKey = null;

    if (token && resetTokenStore.has(token)) {
      record = resetTokenStore.get(token);
      foundKey = token;
    } else if (email && resetCode) {
      const codeKey = `code:${email.toLowerCase().trim()}`;
      if (resetTokenStore.has(codeKey)) {
        const candidate = resetTokenStore.get(codeKey);
        if (candidate.resetCode === resetCode.trim()) {
          record = candidate;
          foundKey = codeKey;
        }
      }
    }

    if (!record) {
      throw new ApiError(400, 'Invalid or expired password reset token.', 'INVALID_RESET_TOKEN');
    }

    if (Date.now() > record.expiresAt) {
      resetTokenStore.delete(foundKey);
      throw new ApiError(400, 'Password reset token has expired. Please request a new one.', 'RESET_EXPIRED');
    }

    // Hash new password using bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password and revoke all existing refresh tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: record.userId },
      }),
    ]);

    // Invalidate reset tokens
    resetTokenStore.delete(foundKey);
    if (record.token) resetTokenStore.delete(record.token);
    resetTokenStore.delete(`code:${record.email}`);

    logger.info(`Password successfully reset for user ${record.userId} (${record.email}).`);

    return {
      success: true,
      message: 'Password has been reset successfully. Please log in with your new credentials.',
    };
  },
};
