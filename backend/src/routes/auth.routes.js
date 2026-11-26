import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import {
  validate,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  sendOtpSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public routes (rate-limited)
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);

// Primary SMS OTP routes (Android SIM Gateway)
router.post('/send-otp', otpLimiter, validate(sendOtpSchema), optionalAuthenticate, authController.sendPhoneOtp);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), optionalAuthenticate, authController.verifyPhoneOtp);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), optionalAuthenticate, authController.sendPhoneOtp);

// Backwards-compatible Phone OTP routes
router.post('/phone/send-otp', otpLimiter, validate(sendOtpSchema), optionalAuthenticate, authController.sendPhoneOtp);
router.post('/phone/verify-otp', otpLimiter, validate(verifyOtpSchema), optionalAuthenticate, authController.verifyPhoneOtp);

// Email Verification routes
router.post('/email/send-verification', authLimiter, optionalAuthenticate, authController.sendEmailVerification);
router.post('/email/verify', authLimiter, optionalAuthenticate, authController.verifyEmail);

// Password Reset routes
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Protected routes (requires valid JWT Access Token)
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
