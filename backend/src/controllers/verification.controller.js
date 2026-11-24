import { verificationService } from '../services/verification.service.js';

export const verificationController = {
  // POST /api/v1/verifications/upload
  async uploadDocument(req, res, next) {
    try {
      const result = await verificationService.uploadDocument(
        req.user.id,
        req.file,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Medical report uploaded successfully. Awaiting medical review.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/verifications/my-document
  async getMyDocument(req, res, next) {
    try {
      const doc = await verificationService.getMyDocument(req.user.id);
      res.status(200).json({
        success: true,
        data: doc,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/verifications/queue
  async getVerificationQueue(req, res, next) {
    try {
      const items = await verificationService.getVerificationQueue(req.query);
      res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/v1/verifications/:id/review
  async reviewDocument(req, res, next) {
    try {
      const { id } = req.params;
      const result = await verificationService.reviewDocument(id, req.body, req.user);
      res.status(200).json({
        success: true,
        message: `Document status updated to ${result.status}.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
