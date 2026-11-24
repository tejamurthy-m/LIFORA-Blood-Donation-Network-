import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { emailService } from '../src/services/email.service.js';
import {
  emitToUser,
  emitToHospital,
  emitToRequest,
  broadcastBloodAlert,
} from '../src/config/socket.js';

const app = createApp();

describe('LIFORA Phase 8: Real-time Socket.IO & Notification Tests', () => {
  let donorToken = '';
  let donorUserId = '';
  let createdNotificationId = '';

  before(async () => {
    await prisma.$connect();

    // Login as donor
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'donor@lifora.org', password: 'donor123' });
    donorToken = loginRes.body.data.token;
    donorUserId = loginRes.body.data.user.id;

    // Seed a test notification for this donor
    const notif = await prisma.notification.create({
      data: {
        userId: donorUserId,
        type: 'EMERGENCY_REQUEST',
        title: 'Emergency Blood Requisition: O+ Needed',
        message: 'A patient in Mumbai urgently requires 2 units of O+ blood.',
        metadata: { bloodGroup: 'O+', urgency: 'EMERGENCY' },
        isRead: false,
      },
    });
    createdNotificationId = notif.id;
  });

  after(async () => {
    if (createdNotificationId) {
      await prisma.notification.deleteMany({
        where: { id: createdNotificationId },
      }).catch(() => {});
    }
  });

  describe('Notifications API', () => {
    it('GET /api/v1/notifications - should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/notifications');
      assert.equal(res.status, 401);
    });

    it('GET /api/v1/notifications - should fetch notifications for logged in user', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${donorToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok('unreadCount' in res.body);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.some((n) => n.id === createdNotificationId));
    });

    it('PATCH /api/v1/notifications/:id/read - should mark a notification as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${createdNotificationId}/read`)
        .set('Authorization', `Bearer ${donorToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.isRead, true);
    });

    it('PATCH /api/v1/notifications/read-all - should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${donorToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  describe('Email Notification Service', () => {
    it('should generate emergency blood alert email without throwing', async () => {
      const result = await emailService.sendEmergencyBloodAlert({
        donorEmail: 'test.donor@lifora.org',
        donorName: 'Dr. Aryan Sharma',
        bloodGroup: 'O+',
        unitsRequired: 2,
        urgency: 'EMERGENCY',
        location: 'Lilavati Hospital, Mumbai',
        trackingCode: 'LIF-9911',
      });

      assert.equal(result.success, true);
    });

    it('should generate verification outcome email without throwing', async () => {
      const result = await emailService.sendReportVerificationResult({
        donorEmail: 'test.donor@lifora.org',
        donorName: 'Dr. Aryan Sharma',
        status: 'APPROVED',
        rejectionReason: null,
      });

      assert.equal(result.success, true);
    });

    it('should generate request fulfilled email without throwing', async () => {
      const result = await emailService.sendRequestFulfilledEmail({
        recipientEmail: 'recipient@lifora.org',
        recipientName: 'Priya Nair',
        trackingCode: 'LIF-8831',
        unitsFulfilled: 3,
      });

      assert.equal(result.success, true);
    });
  });

  describe('Socket.IO Broadcast Dispatchers', () => {
    it('should execute broadcasters safely in standalone / mock modes', () => {
      assert.doesNotThrow(() => {
        emitToUser(donorUserId, 'test:event', { hello: 'world' });
        emitToHospital('hosp-1', 'test:event', { hello: 'hospital' });
        emitToRequest('LIF-8831', 'test:event', { hello: 'tracking' });
        broadcastBloodAlert({ bloodGroup: 'O+', trackingCode: 'LIF-8831' });
      });
    });
  });
});
