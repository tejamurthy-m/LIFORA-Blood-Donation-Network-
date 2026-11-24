import { requestService } from '../services/request.service.js';

export const requestController = {
  // GET /api/v1/requests
  async getRequests(req, res, next) {
    try {
      const requests = await requestService.getRequests(req.query);
      res.status(200).json({
        success: true,
        count: requests.length,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/requests/:id
  async getRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const { userLat, userLng } = req.query;
      const request = await requestService.getRequestById(id, userLat, userLng);
      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/requests/track/:code
  async trackRequest(req, res, next) {
    try {
      const { code } = req.params;
      const request = await requestService.getRequestById(code);
      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/v1/requests
  async createRequest(req, res, next) {
    try {
      const newRequest = await requestService.createRequest(req.body, req.user);
      res.status(201).json({
        success: true,
        message: `Blood requisition created successfully under tracking code ${newRequest.trackingCode}.`,
        data: newRequest,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/v1/requests/:id/accept
  async acceptRequest(req, res, next) {
    try {
      const { id } = req.params;
      const result = await requestService.acceptRequest(id, req.user);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/v1/requests/:id/status
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await requestService.updateStatus(id, status, req.user);
      res.status(200).json({
        success: true,
        message: `Request status updated to ${updated.status}.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
};
