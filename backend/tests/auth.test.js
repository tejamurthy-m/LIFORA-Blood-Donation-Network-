import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

const app = createApp();

describe('LIFORA Phase 3 Authentication & Authorization Tests', () => {
  let donorToken = '';
  let donorRefreshToken = '';
  let hospitalToken = '';

  before(async () => {
    await prisma.$connect();
  });

  after(async () => {
    // Clean up test users created during test runs
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { startsWith: 'test.donor' } },
          { email: { startsWith: 'hospital.' } },
          { fullName: { contains: 'Test Voluntary Donor', mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    const ids = testUsers.map((u) => u.id);
    if (ids.length > 0) {
      await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
      await prisma.donorProfile.deleteMany({ where: { userId: { in: ids } } });
      await prisma.hospitalStaff.deleteMany({ where: { userId: { in: ids } } });
      await prisma.hospital.deleteMany({ where: { officialEmail: { contains: 'testhealthcare.org' } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  it('POST /api/v1/auth/login - should authenticate seeded donor and return JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'donor@lifora.org', password: 'donor123' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token, 'Access token should be returned');
    assert.ok(res.body.data.refreshToken, 'Refresh token should be returned');
    assert.equal(res.body.data.user.role, 'donor');
    assert.equal(res.body.data.user.bloodGroup, 'O+');

    donorToken = res.body.data.token;
    donorRefreshToken = res.body.data.refreshToken;
  });

  it('POST /api/v1/auth/login - should authenticate seeded hospital admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hospital@lifora.org', password: 'hospital123' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'hospital');
    assert.equal(res.body.data.user.staffRole, 'hospital_admin');
    assert.equal(res.body.data.user.hospitalName, 'Lilavati Hospital & Research Centre');

    hospitalToken = res.body.data.token;
  });

  it('POST /api/v1/auth/login - should reject invalid password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'donor@lifora.org', password: 'wrongpassword' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
  });

  it('GET /api/v1/auth/me - should return user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${donorToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, 'donor@lifora.org');
    assert.equal(res.body.data.user.name, 'Dr. Aryan Sharma');
  });

  it('GET /api/v1/auth/me - should reject request without token with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('POST /api/v1/auth/register - should register a new donor account', async () => {
    const uniqueEmail = `test.donor.${Date.now()}@lifora.org`;
    const uniquePhone = `+91 91000 ${Math.floor(10000 + Math.random() * 90000)}`;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Test Voluntary Donor',
        email: uniqueEmail,
        phone: uniquePhone,
        password: 'password123',
        role: 'donor',
        bloodGroup: 'B+',
        city: 'Mumbai',
        area: 'Juhu',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'donor');
    assert.equal(res.body.data.user.bloodGroup, 'B+');
    assert.ok(res.body.data.token);
  });

  it('POST /api/v1/auth/register - should register a new hospital with PENDING status', async () => {
    const uniqueEmail = `hospital.${Date.now()}@testhealthcare.org`;
    const uniquePhone = `+91 92000 ${Math.floor(10000 + Math.random() * 90000)}`;
    const uniqueLicense = `LIC-TEST-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Fortis Healthcare Centre',
        email: uniqueEmail,
        phone: uniquePhone,
        password: 'password123',
        role: 'hospital',
        licenseNumber: uniqueLicense,
        bedCapacity: 250,
        headName: 'Dr. Ramesh Patel',
        headQualification: 'MD (Pathology)',
        city: 'Mumbai',
        area: 'Mulund West',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'hospital');
    assert.equal(res.body.data.user.staffRole, 'hospital_admin');
    assert.equal(res.body.data.user.hospitalVerificationStatus, 'PENDING');
  });

  it('POST /api/v1/auth/refresh-token - should rotate refresh token and issue new access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: donorRefreshToken });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token, 'New access token should be generated');
    assert.ok(res.body.data.refreshToken, 'Rotated refresh token should be generated');
    assert.notEqual(res.body.data.refreshToken, donorRefreshToken, 'Refresh token should be rotated');
  });

  it('POST /api/v1/auth/logout - should invalidate refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: donorRefreshToken });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
