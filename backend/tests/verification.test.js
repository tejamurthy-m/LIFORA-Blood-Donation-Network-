import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

const app = createApp();

describe('LIFORA Phase 5 Medical Report Storage & Verification Tests', () => {
  let donorToken = '';
  let donorUser = null;
  let medicalStaffToken = '';
  let recipientToken = '';
  let uploadedDocId = '';

  before(async () => {
    await prisma.$connect();

    // Login as donor
    const donorLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'donor@lifora.org', password: 'donor123' });
    donorToken = donorLogin.body.data.token;
    donorUser = donorLogin.body.data.user;

    // Login as medical staff (Dr. Vikram Malhotra)
    const medLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'medical@lilavati.org', password: 'hospital123' });
    medicalStaffToken = medLogin.body.data.token;

    // Login as recipient (Priya Nair)
    const recLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recipient@lifora.org', password: 'recipient123' });
    recipientToken = recLogin.body.data.token;
  });

  after(async () => {
    if (uploadedDocId) {
      await prisma.medicalDocument.deleteMany({
        where: { id: uploadedDocId },
      });
    }
    await prisma.$disconnect();
  });

  it('POST /api/v1/verifications/upload - donor can upload medical blood report file', async () => {
    const dummyFileBuffer = Buffer.from('%PDF-1.4 Mock Pathology Blood Group Certificate O+');

    const res = await request(app)
      .post('/api/v1/verifications/upload')
      .set('Authorization', `Bearer ${donorToken}`)
      .field('docType', 'Pathology Lab Blood Group Certificate')
      .field('docNumber', 'THYRO-2026-9042')
      .field('notes', 'Certified Thyrocare O+ Rh Positive test certificate')
      .attach('file', dummyFileBuffer, 'blood_report.pdf');

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'pending');
    assert.equal(res.body.data.docNumber, 'THYRO-2026-9042');
    assert.ok(res.body.data.signedUrl);

    uploadedDocId = res.body.data.id;
  });

  it('GET /api/v1/verifications/my-document - donor can view their uploaded document and signed URL', async () => {
    const res = await request(app)
      .get('/api/v1/verifications/my-document')
      .set('Authorization', `Bearer ${donorToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, uploadedDocId);
    assert.ok(res.body.data.signedUrl);
  });

  it('GET /api/v1/verifications/queue - medical staff can view pending verification queue', async () => {
    const res = await request(app)
      .get('/api/v1/verifications/queue')
      .set('Authorization', `Bearer ${medicalStaffToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 1, 'Should find at least 1 document in queue');
  });

  it('GET /api/v1/verifications/queue - recipient should be blocked with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/verifications/queue')
      .set('Authorization', `Bearer ${recipientToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('PATCH /api/v1/verifications/:id/review - medical staff can request clarification', async () => {
    const res = await request(app)
      .patch(`/api/v1/verifications/${uploadedDocId}/review`)
      .set('Authorization', `Bearer ${medicalStaffToken}`)
      .send({
        action: 'request_clarification',
        clarificationMessage: 'Please provide page 2 showing pathologist signature and lab stamp.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'clarification_requested');
    assert.equal(
      res.body.data.clarificationMessage,
      'Please provide page 2 showing pathologist signature and lab stamp.'
    );
  });

  it('PATCH /api/v1/verifications/:id/review - medical staff can approve verification', async () => {
    const res = await request(app)
      .patch(`/api/v1/verifications/${uploadedDocId}/review`)
      .set('Authorization', `Bearer ${medicalStaffToken}`)
      .send({
        action: 'approve',
        notes: 'Verified against Maharashtra State Transfusion Council Registry.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'approved');
    assert.ok(res.body.data.verifiedAt);
    assert.equal(res.body.data.verifiedBy, 'Dr. Vikram Malhotra');

    // Confirm donor profile is now verified
    const donorProfile = await prisma.donorProfile.findUnique({
      where: { userId: donorUser.id },
    });
    assert.equal(donorProfile.verificationStatus, 'VERIFIED');
  });
});
