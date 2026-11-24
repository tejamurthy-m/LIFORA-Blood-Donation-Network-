import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

const app = createApp();

describe('LIFORA Phase 7: Hospital Portal & Staff Operations API Tests', () => {
  let hospitalAdminToken = '';
  let medicalStaffToken = '';
  let donorToken = '';
  let addedStaffId = '';
  let hospitalId = '';

  before(async () => {
    await prisma.$connect();

    // 1. Login as seeded Hospital Admin (Dr. Anita Joshi)
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hospital@lifora.org', password: 'hospital123' });
    hospitalAdminToken = adminRes.body.data.token;

    // Retrieve hospital ID
    const hosp = await prisma.hospital.findFirst({
      where: { officialEmail: 'bloodbank@lilavatihospital.com' },
    });
    hospitalId = hosp?.id;

    // 2. Login as seeded Medical Staff (Dr. Vikram Malhotra)
    const medRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'medical@lilavati.org', password: 'hospital123' });
    medicalStaffToken = medRes.body.data.token;

    // 3. Login as seeded Donor
    const donorRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'donor@lifora.org', password: 'donor123' });
    donorToken = donorRes.body.data.token;
  });

  describe('Public Hospital Directory', () => {
    it('GET /api/v1/hospitals - should list verified hospitals without authentication', async () => {
      const res = await request(app).get('/api/v1/hospitals');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length > 0);
      assert.ok(res.body.data[0].licenseNumber);
      assert.ok(res.body.data[0].bloodBankHead);
    });

    it('GET /api/v1/hospitals?city=Mumbai - should filter hospitals by city', async () => {
      const res = await request(app).get('/api/v1/hospitals?city=Mumbai');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.every((h) => h.city.toLowerCase().includes('mumbai')));
    });

    it('GET /api/v1/hospitals/public/:id - should fetch single hospital public profile by id', async () => {
      const res = await request(app).get(`/api/v1/hospitals/public/${hospitalId}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.name.includes('Lilavati'));
    });
  });

  describe('Portal Access Controls & RBAC', () => {
    it('GET /api/v1/hospitals/portal/overview - should reject unauthenticated portal access with 401', async () => {
      const res = await request(app).get('/api/v1/hospitals/portal/overview');
      assert.equal(res.status, 401);
    });

    it('GET /api/v1/hospitals/portal/overview - should reject donor access to hospital portal with 403', async () => {
      const res = await request(app)
        .get('/api/v1/hospitals/portal/overview')
        .set('Authorization', `Bearer ${donorToken}`);
      assert.equal(res.status, 403);
      assert.equal(res.body.error.code, 'INSUFFICIENT_ROLE_PERMISSIONS');
    });
  });

  describe('Hospital Portal Operations', () => {
    it('GET /api/v1/hospitals/portal/profile - should get hospital profile for logged in staff', async () => {
      const res = await request(app)
        .get('/api/v1/hospitals/portal/profile')
        .set('Authorization', `Bearer ${hospitalAdminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.licenseNumber);
      assert.ok(res.body.data.name.includes('Lilavati'));
    });

    it('GET /api/v1/hospitals/portal/overview - should return metrics including requests, arrivals, and requirements', async () => {
      const res = await request(app)
        .get('/api/v1/hospitals/portal/overview')
        .set('Authorization', `Bearer ${hospitalAdminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok('activeRequests' in res.body.data);
      assert.ok('bloodRequirements' in res.body.data);
      assert.ok('recentArrivals' in res.body.data);
    });

    it('GET /api/v1/hospitals/portal/staff - should return hospital staff roster with role labels', async () => {
      const res = await request(app)
        .get('/api/v1/hospitals/portal/staff')
        .set('Authorization', `Bearer ${hospitalAdminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length > 0);
      assert.ok(res.body.data[0].roleLabel);
    });

    it('POST /api/v1/hospitals/portal/staff - Hospital Admin can add a new staff member', async () => {
      const uniqueEmail = `nurse.${Date.now()}@lilavati.org`;
      const res = await request(app)
        .post('/api/v1/hospitals/portal/staff')
        .set('Authorization', `Bearer ${hospitalAdminToken}`)
        .send({
          name: 'Staff Nurse Priya Patil',
          email: uniqueEmail,
          phone: '+91 98200 99881',
          role: 'medical_staff',
          department: 'Phlebotomy Station',
          password: 'hospitalStaff123',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, 'Staff Nurse Priya Patil');
      assert.equal(res.body.data.roleLabel, 'Medical Staff');

      addedStaffId = res.body.data.id;
    });

    it('POST /api/v1/hospitals/portal/staff - Medical Staff should be denied with 403 when trying to add staff', async () => {
      const res = await request(app)
        .post('/api/v1/hospitals/portal/staff')
        .set('Authorization', `Bearer ${medicalStaffToken}`)
        .send({
          name: 'Unauthorized Member',
          email: 'unauth@lilavati.org',
          phone: '+91 98200 00000',
          role: 'medical_staff',
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.error.code, 'INSUFFICIENT_STAFF_PERMISSIONS');
    });

    it('GET /api/v1/hospitals/portal/requirements - should get hospital blood requirements', async () => {
      const res = await request(app)
        .get('/api/v1/hospitals/portal/requirements')
        .set('Authorization', `Bearer ${hospitalAdminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });

    it('GET /api/v1/hospitals/portal/arrivals - should get hospital donor arrivals list', async () => {
      const res = await request(app)
        .get('/api/v1/hospitals/portal/arrivals')
        .set('Authorization', `Bearer ${hospitalAdminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });

    it('DELETE /api/v1/hospitals/portal/staff/:staffId - Hospital Admin can remove a staff member', async () => {
      assert.ok(addedStaffId);

      const res = await request(app)
        .delete(`/api/v1/hospitals/portal/staff/${addedStaffId}`)
        .set('Authorization', `Bearer ${hospitalAdminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });
});
