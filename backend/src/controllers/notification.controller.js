import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';

export const notificationController = {
  // Get notifications for current authenticated user
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const { unreadOnly } = req.query;

      const where = { userId };
      if (unreadOnly === 'true') {
        where.isRead = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      res.status(200).json({
        success: true,
        unreadCount,
        count: notifications.length,
        data: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          metadata: n.metadata,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark single notification as read
  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification || notification.userId !== userId) {
        throw new ApiError(404, 'Notification not found.', 'NOTIFICATION_NOT_FOUND');
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
      });
    } catch (error) {
      next(error);
    }
  },
};
