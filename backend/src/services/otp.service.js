import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { emailService } from './email.service.js';
import { smsService, normalizePhoneNumber, maskPhoneNumber } from './sms.service.js';
import { logger } from '../config/logger.js';
import { config } from '../config/environment.js';

// In-memory fallback and request rate limiter map
// Key: `${purpose}:${phoneNumber}`, Value: record
const memoryOtpStore = new Map();
// Key: phoneNumber, Value: array of timestamps (for hourly limit)
const hourlyRequestsMap = new Map();
// Email & reset token memory store
const emailOtpStore = new Map();
const resetTokenStore = new Map();

/**
 * Generates a cryptographically secure 6-digit numeric OTP with leading zeros preserved
 * @returns {string} 6-digit numeric string
 */
export const generateSecureNumericOtp = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length);
  const num = crypto.randomInt(min, max);
  return num.toString().padStart(length, '0');
};

/**
 * Computes a cryptographic SHA-256 hash of the OTP combined with a server secret
 * @param {string} otp
 * @returns {string} Hex encoded hash
 */
export const hashOtp = (otp) => {
  const secret = config.jwt?.secret || 'lifora_otp_secret_key_salt';
  return crypto.createHash('sha256').update(`${otp}:${secret}`).digest('hex');
};

/**
 * Verifies an OTP against a stored hash using constant-time comparison
 * @param {string} candidateOtp
 * @param {string} storedHash
 * @returns {boolean}
 */
export const verifyOtpHash = (candidateOtp, storedHash) => {
  try {
    const candidateHash = hashOtp(candidateOtp);
    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    if (candidateBuffer.length !== storedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
  } catch {
    return false;
  }
};

/**
 * Helper to check and record hourly request frequency for a phone number
 * @param {string} normalizedPhone
 * @param {number} maxPerHour
 */
const checkAndRecordHourlyLimit = (normalizedPhone, maxPerHour = 5) => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const history = hourlyRequestsMap.get(normalizedPhone) || [];
  const recent = history.filter((t) => t > oneHourAgo);

  if (recent.length >= maxPerHour) {
    throw new ApiError(
      429,
      `Too many OTP requests for this phone number. Please wait before requesting again. (Limit: ${maxPerHour}/hour)`,
      'OTP_HOURLY_LIMIT_EXCEEDED'
    );
  }

  recent.push(now);
  hourlyRequestsMap.set(normalizedPhone, recent);
};

export const otpService = {
  generateSecureNumericOtp,
  hashOtp,
  verifyOtpHash,

  /**
   * 1. Send / Queue OTP to a phone number via SMS Gate
   * @param {Object} params
   * @param {string} params.phone Destination phone number
   * @param {string} [params.purpose='REGISTRATION'] Purpose of OTP
   */
  async sendPhoneOtp({ phone, purpose = 'REGISTRATION' } = {}) {
    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      throw new ApiError(400, 'A valid mobile phone number is required.', 'INVALID_PHONE');
    }

    const validPurposes = ['REGISTRATION', 'PHONE_VERIFICATION', 'LOGIN', 'PASSWORD_RESET'];
    const normalizedPurpose = String(purpose).toUpperCase().trim();
    if (!validPurposes.includes(normalizedPurpose)) {
      throw new ApiError(400, `Invalid OTP purpose. Must be one of: ${validPurposes.join(', ')}`, 'INVALID_PURPOSE');
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const masked = maskPhoneNumber(normalizedPhone);

    const expiryMinutes = config.smsGateway?.otpExpiryMinutes || 5;
    const resendCooldownSeconds = config.smsGateway?.otpResendCooldownSeconds || 60;
    const maxAttempts = config.smsGateway?.otpMaxAttempts || 5;
    const maxPerHour = config.smsGateway?.otpMaxRequestsPerHour || 5;

    // Check hourly limit (Anti-spam / Anti-abuse)
    checkAndRecordHourlyLimit(normalizedPhone, maxPerHour);

    // Check resend cooldown
    const storeKey = `${normalizedPurpose}:${normalizedPhone}`;
    const existing = memoryOtpStore.get(storeKey);
    const now = Date.now();

    if (existing && existing.createdAt && !existing.consumedAt) {
      const elapsedSeconds = Math.floor((now - existing.createdAt) / 1000);
      if (elapsedSeconds < resendCooldownSeconds) {
        const remaining = resendCooldownSeconds - elapsedSeconds;
        throw new ApiError(
          429,
          `Please wait ${remaining} seconds before requesting a new verification code.`,
          'OTP_RESEND_COOLDOWN',
          { resendAvailableIn: remaining }
        );
      }
    }

    // Invalidate previous active OTPs for this phone + purpose
    if (existing) {
      existing.consumedAt = new Date();
    }

    // Try DB invalidation if available
    try {
      if (prisma?.otpVerification) {
        await prisma.otpVerification.updateMany({
          where: {
            phoneNumber: normalizedPhone,
            purpose: normalizedPurpose,
            consumedAt: null,
          },
          data: { consumedAt: new Date() },
        });
      }
    } catch (err) {
      logger.warn(`[OTP] Database update skipped or table not initialized: ${err.message}`);
    }

    // Generate fresh OTP and Hash
    const otpCode = generateSecureNumericOtp(config.smsGateway?.otpLength || 6);
    const otpHash = hashOtp(otpCode);
    const expiresAt = new Date(now + expiryMinutes * 60 * 1000);

    const otpEntry = {
      id: crypto.randomUUID(),
      phoneNumber: normalizedPhone,
      otpHash,
      purpose: normalizedPurpose,
      expiresAt,
      attempts: 0,
      verifiedAt: null,
      consumedAt: null,
      createdAt: now,
    };

    memoryOtpStore.set(storeKey, otpEntry);

    // Save to PostgreSQL if available
    try {
      if (prisma?.otpVerification) {
        await prisma.otpVerification.create({
          data: {
            phoneNumber: normalizedPhone,
            otpHash,
            purpose: normalizedPurpose,
            expiresAt,
            attempts: 0,
          },
        });
      }
    } catch (err) {
      logger.warn(`[OTP] Could not persist to Prisma: ${err.message}. Using memory store.`);
    }

    logger.info(`[OTP] Generated OTP for ${masked} (purpose: ${normalizedPurpose}, expires in ${expiryMinutes}m)`);

    // Dispatch via SMS Gateway (Android Phone SIM Gateway)
    const smsResult = await smsService.sendPhoneOtp({
      phone: normalizedPhone,
      otpCode,
      expiryMinutes,
    });

    const isDemo = config.smsGateway?.demoMode === true || process.env.NODE_ENV === 'test';

    return {
      success: true,
      message: 'Verification code has been queued for delivery.',
      expiresIn: expiryMinutes * 60,
      resendAvailableIn: resendCooldownSeconds,
      status: smsResult.status || 'queued',
      phoneNumber: masked,
      // Provide demo/dev OTP ONLY when explicitly running in local test or demo mode, NEVER in production
      ...(isDemo ? { devOtp: otpCode } : {}),
    };
  },

  /**
   * 2. Verify an OTP code
   * @param {Object} params
   * @param {string} params.phone Phone number
   * @param {string} params.otp 6-digit entered OTP
   * @param {string} [params.purpose='REGISTRATION']
   * @param {Object} [currentUser=null] Logged-in user if available
   */
  async verifyPhoneOtp({ phone, otp, purpose = 'REGISTRATION', currentUser = null } = {}) {
    if (!phone || !otp) {
      throw new ApiError(400, 'Phone number and 6-digit OTP code are required.', 'MISSING_FIELDS');
    }

    const normalizedPurpose = String(purpose).toUpperCase().trim();
    const normalizedPhone = normalizePhoneNumber(phone);
    const masked = maskPhoneNumber(normalizedPhone);
    const storeKey = `${normalizedPurpose}:${normalizedPhone}`;
    const now = new Date();
    const maxAttempts = config.smsGateway?.otpMaxAttempts || 5;

    // Look up active record in memory or DB
    let record = memoryOtpStore.get(storeKey);

    try {
      if (prisma?.otpVerification) {
        const dbRecord = await prisma.otpVerification.findFirst({
          where: {
            phoneNumber: normalizedPhone,
            purpose: normalizedPurpose,
            consumedAt: null,
          },
          orderBy: { createdAt: 'desc' },
        });
        if (dbRecord) record = dbRecord;
      }
    } catch (err) {
      logger.warn(`[OTP] DB query error: ${err.message}. Using memory record.`);
    }

    if (!record) {
      throw new ApiError(
        400,
        'No active verification code found for this phone number. Please request a new code.',
        'OTP_NOT_FOUND'
      );
    }

    // Check if already consumed
    if (record.consumedAt) {
      throw new ApiError(
        400,
        'This verification code has already been used. Please request a fresh code.',
        'OTP_ALREADY_USED'
      );
    }

    // Check expiry
    if (new Date(record.expiresAt) < now) {
      record.consumedAt = now;
      memoryOtpStore.delete(storeKey);
      throw new ApiError(400, 'This verification code has expired. Please request a new code.', 'OTP_EXPIRED');
    }

    // Check attempt limit
    if (record.attempts >= maxAttempts) {
      record.consumedAt = now;
      memoryOtpStore.delete(storeKey);
      throw new ApiError(
        429,
        `Maximum verification attempts (${maxAttempts}) exceeded. Please request a new OTP.`,
        'OTP_MAX_ATTEMPTS_EXCEEDED'
      );
    }

    // Verify hash using constant-time comparison
    const cleanOtp = String(otp).trim();
    const isValid = verifyOtpHash(cleanOtp, record.otpHash);

    if (!isValid) {
      record.attempts += 1;
      const remainingAttempts = maxAttempts - record.attempts;

      // Update DB attempts if available
      try {
        if (record.id && prisma?.otpVerification) {
          await prisma.otpVerification.update({
            where: { id: record.id },
            data: { attempts: record.attempts },
          });
        }
      } catch {}

      if (remainingAttempts <= 0) {
        record.consumedAt = now;
        memoryOtpStore.delete(storeKey);
        throw new ApiError(
          429,
          'Too many invalid attempts. Your verification code is now locked. Please request a new one.',
          'OTP_LOCKED'
        );
      }

      throw new ApiError(
        400,
        `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`,
        'INVALID_OTP',
        { remainingAttempts }
      );
    }

    // Mark as verified
    record.verifiedAt = now;
    // Update DB record if available
    try {
      if (record.id && prisma?.otpVerification) {
        await prisma.otpVerification.update({
          where: { id: record.id },
          data: { verifiedAt: now },
        });
      }
    } catch {}

    logger.info(`[OTP] Phone ${masked} verified successfully for ${normalizedPurpose}.`);

    // If an existing user matches or user is logged in, mark user verified in DB
    const userToUpdate = currentUser?.id
      ? await prisma?.user?.findUnique({ where: { id: currentUser.id } }).catch(() => null)
      : await prisma?.user?.findFirst({
          where: {
            OR: [
              { phone: normalizedPhone },
              { phone: normalizedPhone.replace(/\D/g, '').slice(-10) },
            ],
          },
        }).catch(() => null);

    if (userToUpdate && prisma?.user) {
      await prisma.user.update({
        where: { id: userToUpdate.id },
        data: { isPhoneVerified: true },
      }).catch(() => null);
      logger.info(`User ${userToUpdate.id} phone marked VERIFIED in database.`);
    }

    return {
      success: true,
      verified: true,
      message: 'Phone number verified successfully.',
      phoneNumber: masked,
      purpose: normalizedPurpose,
    };
  },

  /**
   * 3. Checks if a phone has a verified, unconsumed registration OTP
   * @param {string} phone
   * @returns {Promise<boolean>}
   */
  async isPhoneVerifiedForRegistration(phone) {
    if (!phone) return false;
    const normalizedPhone = normalizePhoneNumber(phone);
    const storeKey = `REGISTRATION:${normalizedPhone}`;
    const memRecord = memoryOtpStore.get(storeKey);

    if (memRecord && memRecord.verifiedAt && !memRecord.consumedAt) {
      return true;
    }

    try {
      if (prisma?.otpVerification) {
        const dbRecord = await prisma.otpVerification.findFirst({
          where: {
            phoneNumber: normalizedPhone,
            purpose: 'REGISTRATION',
            verifiedAt: { not: null },
            consumedAt: null,
          },
          orderBy: { verifiedAt: 'desc' },
        });
        return Boolean(dbRecord);
      }
    } catch {}

    return false;
  },

  /**
   * 4. Consumes the registration OTP upon successful account creation
   * @param {string} phone
   */
  async consumeRegistrationOtp(phone) {
    if (!phone) return;
    const normalizedPhone = normalizePhoneNumber(phone);
    const storeKey = `REGISTRATION:${normalizedPhone}`;
    const memRecord = memoryOtpStore.get(storeKey);
    if (memRecord) {
      memRecord.consumedAt = new Date();
      memoryOtpStore.delete(storeKey);
    }

    try {
      if (prisma?.otpVerification) {
        await prisma.otpVerification.updateMany({
          where: {
            phoneNumber: normalizedPhone,
            purpose: 'REGISTRATION',
            consumedAt: null,
          },
          data: { consumedAt: new Date() },
        });
      }
    } catch {}
  },

  // -------------------------------------------------------------
  // EMAIL VERIFICATION (Preserved from existing codebase)
  // -------------------------------------------------------------
  async sendEmailVerification(email) {
    if (!email || !email.includes('@')) {
      throw new ApiError(400, 'A valid email address is required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const code = generateSecureNumericOtp(6);
    const expiresAt = Date.now() + 15 * 60 * 1000;

    emailOtpStore.set(`email:${normalizedEmail}`, {
      code,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    logger.info(`[EMAIL_OTP] Generated verification code for ${normalizedEmail}: ${code}`);

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

  async verifyEmailCode(email, inputCode, currentUser = null) {
    if (!email || !inputCode) {
      throw new ApiError(400, 'Email and verification code are required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const key = `email:${normalizedEmail}`;
    const entry = emailOtpStore.get(key);

    if (!entry) {
      throw new ApiError(400, 'No active verification code for this email. Please request a new one.', 'CODE_NOT_FOUND');
    }

    if (Date.now() > entry.expiresAt) {
      emailOtpStore.delete(key);
      throw new ApiError(400, 'Verification code has expired. Please request a new code.', 'CODE_EXPIRED');
    }

    if (entry.attempts >= 5) {
      emailOtpStore.delete(key);
      throw new ApiError(429, 'Too many invalid attempts. Please request a new verification code.', 'CODE_LOCKED');
    }

    if (entry.code !== inputCode.trim()) {
      entry.attempts += 1;
      throw new ApiError(400, `Invalid verification code. ${5 - entry.attempts} attempt(s) remaining.`, 'INVALID_CODE');
    }

    emailOtpStore.delete(key);

    const userToUpdate = currentUser?.id
      ? await prisma?.user?.findUnique({ where: { id: currentUser.id } }).catch(() => null)
      : await prisma?.user?.findUnique({ where: { email: normalizedEmail } }).catch(() => null);

    if (userToUpdate && prisma?.user) {
      await prisma.user.update({
        where: { id: userToUpdate.id },
        data: { isEmailVerified: true },
      }).catch(() => null);
      logger.info(`User ${userToUpdate.id} email marked VERIFIED.`);
    }

    return {
      success: true,
      message: 'Email address verified successfully.',
      verified: true,
      email: normalizedEmail,
    };
  },

  // -------------------------------------------------------------
  // PASSWORD RESET (Preserved from existing codebase)
  // -------------------------------------------------------------
  async requestPasswordReset(email) {
    if (!email || !email.includes('@')) {
      throw new ApiError(400, 'A valid email address is required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma?.user?.findUnique({
      where: { email: normalizedEmail },
    }).catch(() => null);

    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email, a password reset token has been dispatched.',
      };
    }

    const token = crypto.randomBytes(24).toString('hex');
    const resetCode = generateSecureNumericOtp(6);
    const expiresAt = Date.now() + 60 * 60 * 1000;

    resetTokenStore.set(token, {
      userId: user.id,
      email: normalizedEmail,
      resetCode,
      expiresAt,
    });

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

    const passwordHash = await bcrypt.hash(newPassword, 12);

    if (prisma?.user) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { passwordHash },
        }),
        prisma.refreshToken.deleteMany({
          where: { userId: record.userId },
        }),
      ]);
    }

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
