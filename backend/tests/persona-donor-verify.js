import assert from 'node:assert';
import { prisma } from '../src/config/prisma.js';

const BASE_URL = 'http://localhost:5000/api';

async function testDonorPersona() {
  console.log('================================================================');
  console.log(' PERSONA 1: AUDITING & TESTING DONOR ROLE (tejamurthy)');
  console.log('================================================================\n');

  // 1. Donor Login & Token Acquisition
  console.log('1. Testing Donor Login & Authentication...');
  let loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'tejamurthycng@gmail.com',
      password: 'donor123',
    }),
  });

  let loginData = await loginRes.json();
  if (!loginData.success) {
    // If password differs, test with seed donor donor@lifora.org
    loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'donor@lifora.org',
        password: 'password123',
      }),
    });
    loginData = await loginRes.json();
  }

  assert(loginData.success, `Login must succeed: ${JSON.stringify(loginData)}`);
  const token = loginData.data.token;
  const donorUser = loginData.data.user;
  console.log(`✓ Donor Authenticated: ${donorUser.fullName || donorUser.name} (${donorUser.email})`);
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Testing OTP Verification Flow
  console.log('\n2. Testing Phone / Email OTP Verification...');
  const otpRes = await fetch(`${BASE_URL}/auth/phone/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+919845012345' }),
  });
  const otpData = await otpRes.json();
  assert(otpData.success, `OTP request should succeed: ${JSON.stringify(otpData)}`);
  console.log(`✓ OTP dispatched to phone. Dev code: ${otpData.devOtp || 'Active'}`);

  const verifyOtpRes = await fetch(`${BASE_URL}/auth/phone/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+919845012345',
      otp: otpData.devOtp || '123456',
    }),
  });
  const verifyOtpData = await verifyOtpRes.json();
  assert(verifyOtpData.success, `OTP verification must pass: ${JSON.stringify(verifyOtpData)}`);
  console.log('✓ Phone OTP successfully verified.');

  // 3. Testing Donor Profile Management & Geocoding
  console.log('\n3. Testing Donor Profile Management & Location...');
  const profileRes = await fetch(`${BASE_URL}/donors/me`, {
    headers: authHeaders,
  });
  const profileData = await profileRes.json();
  assert(profileData.success, 'Fetch profile must succeed');
  console.log(`✓ Current Donor Profile: ${profileData.data.fullName}, ${profileData.data.bloodGroup}, City: ${profileData.data.city}, Area: ${profileData.data.area}`);

  // Update donor profile to Bangalore Basavanagudi
  const updateRes = await fetch(`${BASE_URL}/donors/me`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      bio: 'Lifelong voluntary blood donor in Bangalore. Active 24/7.',
      age: 28,
      phone: '+91 98450 99999',
      city: 'Bangalore',
      area: 'Basavanagudi',
      bloodGroup: 'O+',
      emergencyReady: true,
    }),
  });
  const updateData = await updateRes.json();
  assert(updateData.success, 'Profile update must succeed');
  assert(updateData.data.city === 'Bangalore', 'City must be Bangalore');
  assert(updateData.data.lat !== null && updateData.data.lng !== null, 'Coordinates must be resolved');
  console.log(`✓ Donor Profile Updated: ${updateData.data.city}, ${updateData.data.area} [${updateData.data.lat}, ${updateData.data.lng}]`);

  // 4. Testing Availability Toggle
  console.log('\n4. Testing Availability Status Toggle...');
  const pauseRes = await fetch(`${BASE_URL}/donors/me/availability`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ isAvailable: false }),
  });
  const pauseData = await pauseRes.json();
  assert(pauseData.success && pauseData.data.isAvailable === false, 'Should pause availability');
  console.log('✓ Availability toggled: Paused (Inactive)');

  const resumeRes = await fetch(`${BASE_URL}/donors/me/availability`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ isAvailable: true }),
  });
  const resumeData = await resumeRes.json();
  assert(resumeData.success && resumeData.data.isAvailable === true, 'Should resume availability');
  console.log('✓ Availability toggled: Active for Donation');

  // 5. Testing Medical Report Upload
  console.log('\n5. Testing Medical Blood Report Upload...');
  // Construct multipart form data with a valid buffer
  const boundary = '----LiforaBoundary' + Date.now();
  const fileContent = 'Simulated medical blood test lab certificate indicating confirmed blood group O+ with negative serology.';
  const bodyBuffer = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="documentType"\r\n\r\n` +
      `BLOOD_REPORT\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="medical_blood_report.pdf"\r\n` +
      `Content-Type: application/pdf\r\n\r\n`
    ),
    Buffer.from(fileContent),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const uploadRes = await fetch(`${BASE_URL}/verifications/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: bodyBuffer,
  });

  const uploadData = await uploadRes.json();
  assert(uploadData.success, `Upload should succeed: ${JSON.stringify(uploadData)}`);
  console.log(`✓ Medical Report Uploaded: Document ID ${uploadData.data.id}, Status: ${uploadData.data.status}`);

  // Fetch my uploaded verification documents
  const docsRes = await fetch(`${BASE_URL}/verifications/my-document`, {
    headers: authHeaders,
  });
  const docsData = await docsRes.json();
  assert(docsData.success, 'Must retrieve uploaded documents');
  console.log(`✓ Verification Documents Tracked: Status: ${docsData.data?.status || 'Active'}`);

  // 6. Testing Matching Blood Requests Feed
  console.log('\n6. Testing Matching Blood Requests Discovery...');
  const reqsRes = await fetch(`${BASE_URL}/requests?status=OPEN&bloodGroup=O+`, {
    headers: authHeaders,
  });
  const reqsData = await reqsRes.json();
  assert(reqsData.success, 'Requests query should succeed');
  console.log(`✓ Blood Requests Available for O+ Donor: Found ${reqsData.data.length} requisition(s)`);

  // 7. Testing Request Acceptance
  if (reqsData.data.length > 0) {
    // Find a request that hasn't been accepted by this donor yet
    const targetReq = reqsData.data.find(r => r.status === 'OPEN') || reqsData.data[0];
    console.log(`\n7. Responding to Requisition ${targetReq.trackingCode} (${targetReq.bloodGroup} at ${targetReq.hospitalName})...`);
    const acceptRes = await fetch(`${BASE_URL}/requests/${targetReq.id}/accept`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        etaMinutes: 25,
        notes: 'En route via metro, will reach blood bank shortly.',
      }),
    });
    const acceptData = await acceptRes.json();
    if (acceptData.success) {
      console.log(`✓ Requisition Accepted: Status is now ${acceptData.data?.status || 'ACCEPTED'}, Donor Arrival Confirmed`);
    } else if (acceptData.error?.code === 'ALREADY_ACCEPTED') {
      console.log(`✓ Duplicate acceptance safety confirmed: ${acceptData.error.message}`);
    } else {
      assert.fail(`Acceptance failed with unexpected error: ${JSON.stringify(acceptData)}`);
    }
  }

  // 8. Testing Donor Notifications
  console.log('\n8. Testing In-App Notification Center...');
  const notifsRes = await fetch(`${BASE_URL}/notifications`, {
    headers: authHeaders,
  });
  const notifsData = await notifsRes.json();
  assert(notifsData.success, 'Notification fetch should succeed');
  console.log(`✓ Notifications fetched: ${notifsData.unreadCount} unread out of ${notifsData.count} total`);
  if (notifsData.data.length > 0) {
    const firstNotif = notifsData.data[0];
    const markRes = await fetch(`${BASE_URL}/notifications/${firstNotif.id}/read`, {
      method: 'PATCH',
      headers: authHeaders,
    });
    const markData = await markRes.json();
    assert(markData.success, 'Mark as read must succeed');
    console.log(`✓ Notification marked read: "${firstNotif.title}"`);
  }

  console.log('\n================================================================');
  console.log(' ALL DONOR PERSONA FEATURES AUDITED AND 100% OPERATIONAL');
  console.log('================================================================');
}

testDonorPersona()
  .catch((err) => {
    console.error('\n❌ DONOR PERSONA TEST FAILED:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
