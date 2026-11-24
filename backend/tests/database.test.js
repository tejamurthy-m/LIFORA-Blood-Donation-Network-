import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma.js';

describe('LIFORA Supabase Database & Prisma Tests', () => {
  before(async () => {
    await prisma.$connect();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('should find seeded demo users in Supabase PostgreSQL', async () => {
    const donorUser = await prisma.user.findUnique({
      where: { email: 'donor@lifora.org' },
      include: { donorProfile: true },
    });

    assert.ok(donorUser, 'Donor user should exist');
    assert.equal(donorUser.role, 'DONOR');
    assert.ok(donorUser.donorProfile, 'Donor profile should exist');
    assert.equal(donorUser.donorProfile.bloodGroup, 'O_POSITIVE');

    // Verify password hash matches 'donor123'
    const isPasswordValid = await bcrypt.compare('donor123', donorUser.passwordHash);
    assert.equal(isPasswordValid, true, 'Password verification should succeed');
  });

  it('should find hospital with staff roster in Supabase', async () => {
    const hospital = await prisma.hospital.findFirst({
      where: { licenseNumber: 'BB-LIC-MH-401' },
      include: {
        staff: {
          include: { user: true },
        },
        requirements: true,
      },
    });

    assert.ok(hospital, 'Lilavati Hospital should exist');
    assert.equal(hospital.verificationStatus, 'VERIFIED');
    assert.ok(hospital.staff.length >= 4, 'Hospital should have at least 4 staff accounts');
    assert.ok(hospital.requirements.length >= 8, 'Hospital should have blood requirements configured');
  });

  it('should find active blood requests and donor arrivals', async () => {
    const emergencyRequest = await prisma.bloodRequest.findUnique({
      where: { trackingCode: 'LIF-8831' },
      include: { arrivals: true },
    });

    assert.ok(emergencyRequest, 'Emergency request LIF-8831 should exist');
    assert.equal(emergencyRequest.bloodGroup, 'O_POSITIVE');
    assert.equal(emergencyRequest.urgency, 'EMERGENCY');
    assert.ok(emergencyRequest.arrivals.length > 0, 'Should have tracked arrival attached');
  });
});
