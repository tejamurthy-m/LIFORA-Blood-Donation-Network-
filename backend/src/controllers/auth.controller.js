import { authService, formatUserResponse } from '../services/auth.service.js';

export const authController = {
  // POST /api/v1/auth/register
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Registration successful.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/v1/auth/login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/v1/auth/refresh-token
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(refreshToken);
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/v1/auth/logout
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(refreshToken);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/auth/me
  async getMe(req, res, next) {
    try {
      const user = formatUserResponse(req.user);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/v1/auth/profile
  async updateProfile(req, res, next) {
    try {
      const updatedUser = await authService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/v1/auth/change-password
  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
};
