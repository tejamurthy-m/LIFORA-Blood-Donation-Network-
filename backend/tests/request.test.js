import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

const app = createApp();

describe('LIFORA Phase 6 Blood Requests & Matching Engine Tests', () => {
  let donorToken = '';
  let donorUser = null;
  let recipientToken = '';
  let createdRequestId = '';
  let createdTrackingCode = '';

  before(async () => {
    await prisma.$connect();

    // Login as donor
    const donorLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'donor@lifora.org', password: 'donor123' });
    donorToken = donorLogin.body.data.token;
    donorUser = donorLogin.body.data.user;

    // Login as recipient
    const recLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recipient@lifora.org', password: 'recipient123' });
    recipientToken = recLogin.body.data.token;
  });

  after(async () => {
    if (createdRequestId) {
      await prisma.donorResponse.deleteMany({ where: { requestId: createdRequestId } });
      await prisma.donorArrival.deleteMany({ where: { requestId: createdRequestId } });
      await prisma.bloodRequest.deleteMany({ where: { id: createdRequestId } });
    }
    await prisma.$disconnect();
  });

  it('GET /api/v1/requests - should return list of active requests with timeline', async () => {
    const res = await request(app).get('/api/v1/requests');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 2, 'Should find at least 2 seeded blood requests');

    const req1 = res.body.data[0];
    assert.ok(req1.trackingCode);
    assert.ok(req1.bloodGroup);
    assert.ok(req1.timeline.length === 4, 'Timeline must have 4 standard coordination steps');
  });

  it('GET /api/v1/requests?urgency=Emergency - should filter by emergency urgency', async () => {
    const res = await request(app).get('/api/v1/requests?urgency=Emergency');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.every((r) => r.urgency === 'Emergency'));
  });

  it('GET /api/v1/requests/track/:code - public tracking of requisition LIF-8831', async () => {
    const res = await request(app).get('/api/v1/requests/track/LIF-8831');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.trackingCode, 'LIF-8831');
    assert.equal(res.body.data.bloodGroup, 'O+');
    assert.equal(res.body.data.hospitalName, 'Lilavati Hospital & Research Centre');
  });

  it('POST /api/v1/requests - recipient creates new blood request', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({
        patientName: 'Aarav Mehta',
        bloodGroup: 'B+',
        unitsRequired: 3,
        hospitalName: 'Tata Memorial Hospital',
        hospitalLocation: 'Parel, Mumbai',
        city: 'Mumbai',
        urgency: 'Urgent',
        requiredDate: '2026-11-26',
        contactPerson: 'Sunita Mehta',
        contactPhone: '+91 98200 77889',
        additionalInstructions: 'Platelet and whole blood requisition.',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.trackingCode.startsWith('LIF-'));
    assert.equal(res.body.data.patientName, 'Aarav Mehta');
    assert.equal(res.body.data.bloodGroup, 'B+');
    assert.equal(res.body.data.unitsRequired, 3);

    createdRequestId = res.body.data.id;
    createdTrackingCode = res.body.data.trackingCode;
  });

  it('POST /api/v1/requests/:id/accept - donor accepts request and records response', async () => {
    const res = await request(app)
      .post(`/api/v1/requests/${createdRequestId}/accept`)
      .set('Authorization', `Bearer ${donorToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.requestId, createdRequestId);
    assert.ok(res.body.data.eta);

    // Verify response was recorded
    const updatedReq = await request(app).get(`/api/v1/requests/${createdRequestId}`);
    assert.equal(updatedReq.body.data.donorResponses, 1);
    assert.equal(updatedReq.body.data.acceptedDonors[0].name, 'Dr. Aryan S.');
  });

  it('POST /api/v1/requests/:id/accept - duplicate acceptance is rejected with 400', async () => {
    const res = await request(app)
      .post(`/api/v1/requests/${createdRequestId}/accept`)
      .set('Authorization', `Bearer ${donorToken}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'ALREADY_ACCEPTED');
  });

  it('PATCH /api/v1/requests/:id/status - update request status to Fulfilled', async () => {
    const res = await request(app)
      .patch(`/api/v1/requests/${createdRequestId}/status`)
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({ status: 'Fulfilled' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'Fulfilled');
    assert.equal(res.body.data.timeline[3].done, true);
  });
});
