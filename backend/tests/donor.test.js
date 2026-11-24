import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

const app = createApp();

describe('LIFORA Phase 4 Donor Management & Search API Tests', () => {
  let donorToken = '';
  let donorUser = null;
  let recipientToken = '';
  let otherDonorToken = '';

  before(async () => {
    await prisma.$connect();

    // Login as seeded donor (Dr. Aryan Sharma)
    const donorLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'donor@lifora.org', password: 'donor123' });
    donorToken = donorLogin.body.data.token;
    donorUser = donorLogin.body.data.user;

    // Login as recipient (Priya Nair)
    const recipientLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recipient@lifora.org', password: 'recipient123' });
    recipientToken = recipientLogin.body.data.token;

    // Register a second donor for testing unauthorized availability updates
    const secondDonorRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Second Test Donor',
        email: `second.donor.${Date.now()}@lifora.org`,
        phone: `+91 93000 ${Math.floor(10000 + Math.random() * 90000)}`,
        password: 'password123',
        role: 'donor',
        bloodGroup: 'A+',
        city: 'Mumbai',
        area: 'Worli',
      });
    otherDonorToken = secondDonorRes.body.data.token;
  });

  after(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { startsWith: 'second.donor.' },
      },
    });
    await prisma.$disconnect();
  });

  it('GET /api/v1/donors - should return list of active donors with distance calculations', async () => {
    const res = await request(app).get('/api/v1/donors');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 4, 'Should return at least 4 seeded donors');

    const firstDonor = res.body.data[0];
    assert.ok(firstDonor.id);
    assert.ok(firstDonor.bloodGroup);
    assert.ok(firstDonor.compatibility);
    assert.ok(typeof firstDonor.distanceKm === 'number');
  });

  it('GET /api/v1/donors?bloodGroup=O+ - should return compatible donors (O+ and universal O-)', async () => {
    const res = await request(app).get('/api/v1/donors?bloodGroup=O+');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const bloodGroups = res.body.data.map((d) => d.bloodGroup);
    // Transfusion rule: Recipient with O+ can receive from O+ and O-
    assert.ok(bloodGroups.every((bg) => bg === 'O+' || bg === 'O-'));
  });

  it('GET /api/v1/donors?city=Mumbai - should filter donors by city', async () => {
    const res = await request(app).get('/api/v1/donors?city=Mumbai');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.every((d) => d.city.toLowerCase() === 'mumbai'));
  });

  it('GET /api/v1/donors?onlyAvailable=true - should only return available donors', async () => {
    const res = await request(app).get('/api/v1/donors?onlyAvailable=true');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.every((d) => d.isAvailable === true));
  });

  it('GET /api/v1/donors?sortBy=donations - should sort donors by donation count descending', async () => {
    const res = await request(app).get('/api/v1/donors?sortBy=donations');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const counts = res.body.data.map((d) => d.totalDonations);
    for (let i = 0; i < counts.length - 1; i++) {
      assert.ok(counts[i] >= counts[i + 1], 'Should be in descending order of donations');
    }
  });

  it('GET /api/v1/donors/:id - should return single donor details', async () => {
    const res = await request(app).get(`/api/v1/donors/${donorUser.donorId}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.fullName, 'Dr. Aryan Sharma');
    assert.equal(res.body.data.bloodGroup, 'O+');
    assert.ok(res.body.data.compatibility.includes('O+'));
  });

  it('GET /api/v1/donors/:id - should return 404 for non-existent donor', async () => {
    const res = await request(app).get('/api/v1/donors/non-existent-uuid-999');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'DONOR_NOT_FOUND');
  });

  it('PATCH /api/v1/donors/:id/availability - donor can toggle their own availability', async () => {
    const res = await request(app)
      .patch(`/api/v1/donors/${donorUser.donorId}/availability`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ isAvailable: false });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isAvailable, false);

    // Toggle back to true
    await request(app)
      .patch(`/api/v1/donors/${donorUser.donorId}/availability`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ isAvailable: true });
  });

  it('PATCH /api/v1/donors/:id/availability - should reject unauthorized user attempt with 403', async () => {
    const res = await request(app)
      .patch(`/api/v1/donors/${donorUser.donorId}/availability`)
      .set('Authorization', `Bearer ${otherDonorToken}`)
      .send({ isAvailable: false });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN_AVAILABILITY_UPDATE');
  });

  it('POST /api/v1/donors/:id/direct-request - should dispatch direct request to donor', async () => {
    const res = await request(app)
      .post(`/api/v1/donors/${donorUser.donorId}/direct-request`)
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({
        unitsNeeded: 2,
        urgency: 'Emergency',
        hospital: 'Lilavati Hospital',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.dispatchedAt);
  });
});
