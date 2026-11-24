import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('LIFORA Backend Foundation Tests', () => {
  it('GET /api/health should return 200 OK with healthy status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'healthy');
    assert.equal(res.body.data.service, 'LIFORA Blood Donation Network API');
  });

  it('GET /api/v1 should return 200 OK with API endpoint map', async () => {
    const res = await request(app).get('/api/v1');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.endpoints);
  });

  it('GET /api/v1/non-existent-route should return 404 with standard error format', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error);
    assert.ok(res.body.error.message.includes('Endpoint not found'));
  });
});
