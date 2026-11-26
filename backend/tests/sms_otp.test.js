import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import http from 'http';
import { createApp } from '../src/app.js';
import {
  normalizePhoneNumber,
  maskPhoneNumber,
  smsService,
} from '../src/services/sms.service.js';
import {
  generateSecureNumericOtp,
  hashOtp,
  verifyOtpHash,
  otpService,
} from '../src/services/otp.service.js';
import { config } from '../src/config/environment.js';

const app = createApp();

describe('LIFORA Personal SIM SMS OTP & Gateway Test Suite', () => {
  let mockServer;
  let mockPort;
  let originalConfig;

  before(async () => {
    originalConfig = { ...config.smsGateway };

    // Setup an ephemeral local HTTP mock server to simulate Android SMS Gate HTTP API
    mockServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        let parsed = {};
        try {
          parsed = JSON.parse(body || '{}');
        } catch {}

        // Verify exact payload format required by SMS Gate (no extra deviceId property, clean LIFORA: <otp> text)
        if (
          !parsed.textMessage?.text ||
          !/^LIFORA: \d{6}$/.test(parsed.textMessage.text) ||
          !Array.isArray(parsed.phoneNumbers) ||
          parsed.withDeliveryReport !== false ||
          'deviceId' in parsed
        ) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid SMS Gate payload format' }));
        }

        // Standard SMS Gate default: Pending/Queued
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ state: 'Pending', id: 'msg-123', phoneNumbers: parsed.phoneNumbers }));
      });
    });

    await new Promise((resolve) => {
      mockServer.listen(0, '127.0.0.1', () => {
        mockPort = mockServer.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    if (mockServer) {
      await new Promise((resolve) => mockServer.close(resolve));
    }
    // Restore config
    Object.assign(config.smsGateway, originalConfig);
  });

  // --------------------------------------------------------------------------
  // 1. Phone Normalization & Masking
  // --------------------------------------------------------------------------
  describe('Phone Normalization & Masking', () => {
    it('should normalize 10-digit Indian numbers to E.164 +91 format', () => {
      assert.equal(normalizePhoneNumber('9876543210'), '+919876543210');
      assert.equal(normalizePhoneNumber(' 9876543210 '), '+919876543210');
    });

    it('should normalize 11-digit numbers with leading 0 to +91', () => {
      assert.equal(normalizePhoneNumber('09876543210'), '+919876543210');
    });

    it('should preserve already formatted +91 numbers', () => {
      assert.equal(normalizePhoneNumber('+91 98765 43210'), '+919876543210');
      assert.equal(normalizePhoneNumber('+919876543210'), '+919876543210');
    });

    it('should reject invalid phone numbers with less than 8 digits', () => {
      assert.throws(() => normalizePhoneNumber('12345'), /between 8 and 15 digits/);
    });

    it('should mask phone numbers preserving only last 4 digits', () => {
      assert.equal(maskPhoneNumber('+919876543210'), '+91 ******3210');
      assert.equal(maskPhoneNumber('9876543210'), ' ******3210');
    });
  });

  // --------------------------------------------------------------------------
  // 2. OTP Generation & Cryptographic Hashing
  // --------------------------------------------------------------------------
  describe('OTP Generation & Cryptographic Hashing', () => {
    it('should generate a 6-digit numeric OTP with leading zeros preserved', () => {
      for (let i = 0; i < 20; i++) {
        const otp = generateSecureNumericOtp(6);
        assert.equal(otp.length, 6, 'OTP must be exactly 6 characters');
        assert.match(otp, /^\d{6}$/, 'OTP must contain only digits');
      }
    });

    it('should compute deterministic SHA-256 hash and verify using constant-time comparison', () => {
      const code = '012345';
      const hash1 = hashOtp(code);
      const hash2 = hashOtp(code);
      assert.equal(hash1, hash2, 'Identical code must yield identical hash');

      assert.equal(verifyOtpHash('012345', hash1), true, 'Correct OTP must match hash');
      assert.equal(verifyOtpHash('999999', hash1), false, 'Wrong OTP must not match hash');
      assert.equal(verifyOtpHash('', hash1), false, 'Empty OTP must fail verification');
    });
  });

  // --------------------------------------------------------------------------
  // 3. SMS Gateway Service & Mock Gateway Tests
  // --------------------------------------------------------------------------
  describe('SMS Gateway Integration (Android Phone SIM Gateway)', () => {
    it('should dispatch OTP and correctly interpret Queued/Pending state', async () => {
      config.smsGateway.url = `http://127.0.0.1:${mockPort}`;
      config.smsGateway.username = 'lifora_test_user';
      config.smsGateway.password = 'lifora_test_pass';
      config.smsGateway.demoMode = false;

      const result = await smsService.sendPhoneOtp({
        phone: '9876543210',
        otpCode: '123456',
        expiryMinutes: 5,
      });

      assert.equal(result.success, true);
      assert.equal(result.status, 'queued');
      assert.equal(result.message, 'Verification code has been queued for delivery.');
    });

    it('should interpret Sent status from gateway when delivered', async () => {
      config.smsGateway.url = `http://127.0.0.1:${mockPort}`;
      config.smsGateway.username = 'lifora_test_user';
      config.smsGateway.password = 'lifora_test_pass';
      config.smsGateway.demoMode = false;

      // Mock specific endpoint returning Sent
      const sentServer = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ state: 'Sent', id: 'msg-sent-01' }));
      });

      const sentPort = await new Promise((r) => sentServer.listen(0, '127.0.0.1', () => r(sentServer.address().port)));
      config.smsGateway.url = `http://127.0.0.1:${sentPort}`;

      const result = await smsService.sendPhoneOtp({
        phone: '9876543210',
        otpCode: '654321',
      });

      assert.equal(result.success, true);
      assert.equal(result.status, 'sent');
      await new Promise((r) => sentServer.close(r));
    });

    it('should throw error when gateway reports Failed state', async () => {
      const failStateServer = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ state: 'Failed', id: 'msg-fail-01' }));
      });
      const failStatePort = await new Promise((r) =>
        failStateServer.listen(0, '127.0.0.1', () => r(failStateServer.address().port))
      );

      config.smsGateway.url = `http://127.0.0.1:${failStatePort}`;
      config.smsGateway.username = 'lifora_test_user';
      config.smsGateway.password = 'lifora_test_pass';
      config.smsGateway.demoMode = false;

      await assert.rejects(
        async () => {
          await smsService.sendPhoneOtp({ phone: '9876543210', otpCode: '654321' });
        },
        /SMS Gateway failed to send the message/
      );

      await new Promise((r) => failStateServer.close(r));
    });

    it('should handle HTTP 401 Unauthorized from Android Gateway', async () => {
      const authFailServer = http.createServer((req, res) => {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad credentials' }));
      });
      const failPort = await new Promise((r) => authFailServer.listen(0, '127.0.0.1', () => r(authFailServer.address().port)));

      config.smsGateway.url = `http://127.0.0.1:${failPort}`;
      config.smsGateway.username = 'wrong_user';
      config.smsGateway.password = 'wrong_pass';
      config.smsGateway.demoMode = false;

      await assert.rejects(
        async () => {
          await smsService.sendPhoneOtp({ phone: '9876543210', otpCode: '111111' });
        },
        /SMS Gateway authentication failed/
      );

      await new Promise((r) => authFailServer.close(r));
    });

    it('should handle gateway connection refused gracefully', async () => {
      // Point to an unused local port
      config.smsGateway.url = 'http://127.0.0.1:59999';
      config.smsGateway.username = 'test';
      config.smsGateway.password = 'test';
      config.smsGateway.demoMode = false;

      await assert.rejects(
        async () => {
          await smsService.sendPhoneOtp({ phone: '9876543210', otpCode: '222222' });
        },
        /Cannot reach Android SMS Gateway/
      );
    });

    it('should gracefully switch to simulated dispatch in Demo Mode without cellular calls', async () => {
      config.smsGateway.demoMode = true;

      const result = await smsService.sendPhoneOtp({
        phone: '9876543210',
        otpCode: '333333',
      });

      assert.equal(result.success, true);
      assert.equal(result.status, 'simulated');
      assert.equal(result.simulated, true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. End-to-End REST API Endpoints (/api/v1/auth/send-otp & verify-otp)
  // --------------------------------------------------------------------------
  describe('Authentication API OTP Routes', () => {
    const testPhone = `+91987${Math.floor(1000000 + Math.random() * 9000000)}`;
    let generatedOtp = '';

    before(() => {
      config.smsGateway.demoMode = true;
      config.smsGateway.otpExpiryMinutes = 5;
      config.smsGateway.otpResendCooldownSeconds = 60;
    });

    it('POST /api/v1/auth/send-otp - should dispatch OTP and return metadata', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber: testPhone, purpose: 'REGISTRATION' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.expiresIn, 300);
      assert.equal(res.body.resendAvailableIn, 60);
      assert.ok(res.body.devOtp, 'Test mode should expose devOtp for automated test validation');
      generatedOtp = res.body.devOtp;
    });

    it('POST /api/v1/auth/send-otp - should enforce 60-second resend cooldown', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber: testPhone, purpose: 'REGISTRATION' });

      assert.equal(res.status, 429);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'OTP_RESEND_COOLDOWN');
    });

    it('POST /api/v1/auth/verify-otp - should reject incorrect OTP code with remaining attempts', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phoneNumber: testPhone, otp: '000000', purpose: 'REGISTRATION' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'INVALID_OTP');
      assert.ok(res.body.error.details.remainingAttempts >= 1);
    });

    it('POST /api/v1/auth/verify-otp - should reject purpose mismatch', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phoneNumber: testPhone, otp: generatedOtp, purpose: 'LOGIN' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'OTP_NOT_FOUND');
    });

    it('POST /api/v1/auth/verify-otp - should successfully verify valid OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phoneNumber: testPhone, otp: generatedOtp, purpose: 'REGISTRATION' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.verified, true);
      assert.equal(res.body.message, 'Phone number verified successfully.');
    });

    it('POST /api/v1/auth/verify-otp - should reject already consumed OTP (single-use enforcement)', async () => {
      // Consume the OTP
      await otpService.consumeRegistrationOtp(testPhone);

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phoneNumber: testPhone, otp: generatedOtp, purpose: 'REGISTRATION' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Existing Core System Regression Checks
  // --------------------------------------------------------------------------
  describe('Regression: Health & Public API Endpoints Intact', () => {
    it('GET /api/health should return 200 OK', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.data.status, 'healthy');
    });

    it('GET /api/v1 should list all active endpoints including auth', async () => {
      const res = await request(app).get('/api/v1');
      assert.equal(res.status, 200);
      assert.equal(res.body.endpoints.auth, '/api/v1/auth');
    });
  });
});
