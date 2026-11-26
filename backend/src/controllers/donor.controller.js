import { donorService } from '../services/donor.service.js';

export const donorController = {
  // GET /api/v1/donors
  async getDonors(req, res, next) {
    try {
      const donors = await donorService.getDonors(req.query);
      res.status(200).json({
        success: true,
        count: donors.length,
        data: donors,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/donors/:id
  async getDonorById(req, res, next) {
    try {
      const { id } = req.params;
      const { userLat, userLng } = req.query;
      const donor = await donorService.getDonorById(id, userLat, userLng);
      res.status(200).json({
        success: true,
        data: donor,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/donors/me
  async getMyProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const donor = await donorService.getDonorById(userId);
      res.status(200).json({
        success: true,
        data: donor,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/v1/donors/me
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updated = await donorService.updateProfile(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Donor profile updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/v1/donors/:id/availability
  async updateAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;
      const updated = await donorService.updateAvailability(id, isAvailable, req.user);
      res.status(200).json({
        success: true,
        message: `Availability updated to ${isAvailable ? 'Available' : 'Unavailable'}.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/v1/donors/:id/direct-request
  async sendDirectRequest(req, res, next) {
    try {
      const { id } = req.params;
      const result = await donorService.sendDirectRequest(id, req.body, req.user);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/donors/me/donations
  async getMyDonations(req, res, next) {
    try {
      const records = await donorService.getMyDonations(req.user.id);
      res.status(200).json({
        success: true,
        count: records.length,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  },
};
