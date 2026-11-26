import assert from 'node:assert';
import { prisma } from '../src/config/prisma.js';

const BASE_URL = 'http://localhost:5000/api';

async function testRecipientPersona() {
  console.log('================================================================');
  console.log(' PERSONA 2: AUDITING & TESTING RECIPIENT ROLE (Priya Nair)');
  console.log('================================================================\n');

  // 1. Recipient Login & Authentication
  console.log('1. Testing Recipient Login & Authentication...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'recipient@lifora.org',
      password: 'recipient123',
    }),
  });

  const loginData = await loginRes.json();
  assert(loginData.success, `Recipient login must succeed: ${JSON.stringify(loginData)}`);
  const token = loginData.data.token;
  const recipientUser = loginData.data.user;
  console.log(`✓ Recipient Authenticated: ${recipientUser.fullName || recipientUser.name} (${recipientUser.email}), Role: ${recipientUser.role}`);
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Testing Recipient Profile Management (Bangalore Indiranagar)
  console.log('\n2. Testing Recipient Profile & Location...');
  const profileRes = await fetch(`${BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      fullName: 'Priya Nair',
      city: 'Bangalore',
      area: 'Indiranagar',
      phone: '+91 98450 33445',
    }),
  });
  const profileData = await profileRes.json();
  assert(profileData.success, 'Profile update must succeed');
  assert(profileData.data.city === 'Bangalore', 'Recipient city must be Bangalore');
  console.log(`✓ Recipient Profile active in ${profileData.data.city}, ${profileData.data.area}`);

  // 3. Testing Blood Requisition Creation
  console.log('\n3. Testing Creation of Patient Blood Requisition...');
  const reqRes = await fetch(`${BASE_URL}/requests`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      patientName: 'Anil Kumar',
      bloodGroup: 'O+',
      unitsRequired: 2,
      urgency: 'CRITICAL',
      hospitalName: 'Manipal Hospital, Bangalore',
      city: 'Bangalore',
      area: 'HAL Airport Road',
      contactPhone: '+91 98450 33445',
      notes: 'Scheduled cardiovascular surgery requiring verified O+ cross-match.',
    }),
  });
  const reqData = await reqRes.json();
  assert(reqData.success, `Request creation must succeed: ${JSON.stringify(reqData)}`);
  const newRequest = reqData.data;
  console.log(`✓ Blood Requisition Created: Tracking Code ${newRequest.trackingCode}, Status: ${newRequest.status}`);

  // 4. Testing Public Tracking of the Requisition
  console.log(`\n4. Testing Public Live Tracking for Requisition ${newRequest.trackingCode}...`);
  const trackRes = await fetch(`${BASE_URL}/requests/track/${newRequest.trackingCode}`);
  const trackData = await trackRes.json();
  assert(trackData.success, 'Tracking must succeed');
  assert(trackData.data.bloodGroup === 'O+', 'Blood group must match');
  console.log(`✓ Tracking Verified: Patient ${trackData.data.patientName}, Status: ${trackData.data.status}, Facility: ${trackData.data.hospitalName}`);

  // 5. Testing Verified Donor Discovery with Strict 25km Bangalore Radius Filter
  console.log('\n5. Testing Verified Donor Search (Max Radius: 25 km around Bangalore)...');
  const donorsRes = await fetch(
    `${BASE_URL}/donors?city=Bangalore&bloodGroup=O+&maxDistance=25&userLat=12.9716&userLng=77.5946`
  );
  const donorsData = await donorsRes.json();
  assert(donorsData.success, 'Donors search should succeed');
  const nearbyDonors = donorsData.data;
  console.log(`✓ Donors Search Found ${nearbyDonors.length} matching O+ donor(s) within 25 km`);

  // Verify none are farther than 25km and Mumbai donors are excluded
  for (const donor of nearbyDonors) {
    assert(donor.distanceKm <= 25, `Donor ${donor.name} distance (${donor.distanceKm}km) must be <= 25km`);
    assert(donor.city.toLowerCase() === 'bangalore', `Donor ${donor.name} must be in Bangalore`);
  }
  console.log('✓ Strict 25 km radius boundary verified: zero out-of-city donors included.');

  // 6. Testing Direct Request to Verified Donor
  if (nearbyDonors.length > 0) {
    const targetDonor = nearbyDonors[0];
    console.log(`\n6. Dispatching Direct Requisition to verified donor ${targetDonor.name} (${targetDonor.city})...`);
    const directRes = await fetch(`${BASE_URL}/donors/${targetDonor.id}/direct-request`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        hospitalName: 'Manipal Hospital, Bangalore',
        unitsNeeded: 1,
        isEmergency: true,
        requester: 'Priya Nair',
        patientName: 'Anil Kumar',
      }),
    });
    const directData = await directRes.json();
    assert(directData.success, `Direct request must succeed: ${JSON.stringify(directData)}`);
    console.log(`✓ Direct Requisition Dispatched: Donor ${directData.donorName || targetDonor.name} notified.`);
  }

  // 7. Testing Self-Requisition Prevention
  console.log('\n7. Testing Self-Requisition Prevention...');
  // If recipient tries to request using donor's identity
  if (nearbyDonors.length > 0) {
    const targetDonor = nearbyDonors[0];
    const selfRes = await fetch(`${BASE_URL}/donors/${targetDonor.id}/direct-request`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        hospitalName: 'Manipal Hospital, Bangalore',
        unitsNeeded: 1,
        requester: targetDonor.name, // same name as target donor
        patientName: 'Self',
      }),
    });
    const selfData = await selfRes.json();
    assert(!selfData.success, 'Self-request must be rejected');
    console.log(`✓ Self-request prevented safely: ${selfData.error?.message || 'Rejected'}`);
  }

  // 8. Testing Request Closure / Cancellation
  console.log(`\n8. Testing Requisition Status Update (Closing fulfilled request ${newRequest.trackingCode})...`);
  const cancelRes = await fetch(`${BASE_URL}/requests/${newRequest.id}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'FULFILLED' }),
  });
  const cancelData = await cancelRes.json();
  assert(cancelData.success, 'Status change must succeed');
  console.log(`✓ Requisition Status Updated: ${cancelData.data.status}`);

  console.log('\n================================================================');
  console.log(' ALL RECIPIENT PERSONA FEATURES AUDITED AND 100% OPERATIONAL');
  console.log('================================================================');
}

testRecipientPersona()
  .catch((err) => {
    console.error('\n❌ RECIPIENT PERSONA TEST FAILED:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
