import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  validate,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public routes (rate-limited)
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);

// Phone OTP routes
router.post('/phone/send-otp', authLimiter, optionalAuthenticate, authController.sendPhoneOtp);
router.post('/phone/verify-otp', authLimiter, optionalAuthenticate, authController.verifyPhoneOtp);

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
