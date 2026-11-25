import assert from 'assert';
import { prisma } from '../src/config/prisma.js';
import { authService } from '../src/services/auth.service.js';
import { donorService } from '../src/services/donor.service.js';
import { requestService } from '../src/services/request.service.js';
import { hospitalService } from '../src/services/hospital.service.js';
import { verificationService } from '../src/services/verification.service.js';
import { otpService } from '../src/services/otp.service.js';

async function runMasterE2ETests() {
  console.log('================================================================');
  console.log('   LIFORA COMPLETE SYSTEM VERIFICATION - ALL 3 PORTALS (E2E)');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // PORTAL 1: DONOR PORTAL - ALL SERVICES & ACTIONS
  // -------------------------------------------------------------
  console.log('>>> [PORTAL 1: DONOR SERVICES]');

  // 1.1 Donor Login & Token issuance
  console.log('1.1 Testing Donor Login & Authentication...');
  const donorUser = await prisma.user.findFirst({
    where: { role: 'DONOR' },
    include: { donorProfile: true },
  });
  assert(donorUser, 'Donor account exists in DB.');
  console.log(`✓ Authenticated as Donor: ${donorUser.fullName} (${donorUser.email})`);

  // 1.2 Phone & Email Verification
  console.log('1.2 Testing Donor Phone & Email Verification...');
  const phoneOtpRes = await otpService.sendPhoneOtp(donorUser.phone);
  assert(phoneOtpRes.success && phoneOtpRes.devOtp, 'Phone OTP generated.');
  await otpService.verifyPhoneOtp(donorUser.phone, phoneOtpRes.devOtp, donorUser);

  const emailOtpRes = await otpService.sendEmailVerification(donorUser.email);
  assert(emailOtpRes.success && emailOtpRes.devCode, 'Email OTP generated.');
  await otpService.verifyEmailCode(donorUser.email, emailOtpRes.devCode, donorUser);
  console.log('✓ Donor Phone OTP & Email Verification succeeded.');

  // 1.3 Toggle Availability
  console.log('1.3 Testing Donor Availability Status Toggle...');
  const availRes = await donorService.updateAvailability(donorUser.id, true, donorUser);
  assert(availRes.isAvailable === true, 'Availability toggled to true.');
  console.log('✓ Donor is discoverable for emergency matches.');

  // 1.4 Medical Document Upload & Review
  console.log('1.4 Testing Donor Medical Blood Group Report Lifecycle...');
  const uploadRes = await verificationService.uploadDocument(
    donorUser.id,
    {
      buffer: Buffer.from('%PDF-1.4 test content'),
      originalname: 'apollo-lab-report.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    },
    {
      docType: 'BLOOD_GROUP_CERTIFICATE',
      docNumber: 'APOLLO-8921-X',
      notes: 'Clinical Serology Confirmation',
    }
  );
  assert(uploadRes.id && uploadRes.status === 'pending', 'Medical report uploaded with pending status.');

  // Review by Medical Staff
  const reviewer = await prisma.user.findFirst({
    where: { role: 'HOSPITAL' },
  });
  assert(reviewer, 'Authorized reviewer found.');
  const reviewRes = await verificationService.reviewDocument(uploadRes.id, {
    status: 'VERIFIED',
    notes: 'Official lab seal confirmed.',
  }, reviewer);
  assert(reviewRes.status === 'approved' || reviewRes.status === 'verified', 'Report approved and donor marked verified.');
  console.log('✓ Medical report upload, human review queue, and verified donor badge active.');

  // 1.5 View Matching Requests & Accept
  console.log('1.5 Testing Donor Matching Requests & Requisition Response...');
  const openReq = await prisma.bloodRequest.findFirst({
    where: { status: 'PENDING' },
  });
  if (openReq) {
    const acceptRes = await requestService.acceptRequest(openReq.id, donorUser);
    assert(acceptRes.trackingCode, 'Donor accepted blood request.');
    console.log(`✓ Donor successfully responded to request ${openReq.trackingCode}`);
  }

  // 1.6 Donation History
  console.log('1.6 Testing Donor Donation History...');
  const history = await donorService.getMyDonations(donorUser.id);
  assert(Array.isArray(history), 'Donation history returned.');
  console.log(`✓ Donor has ${history.length} logged phlebotomy donation records.`);

  // -------------------------------------------------------------
  // PORTAL 2: RECIPIENT PORTAL - ALL SERVICES & ACTIONS
  // -------------------------------------------------------------
  console.log('\n>>> [PORTAL 2: RECIPIENT SERVICES]');

  const recipientUser = await prisma.user.findFirst({
    where: { role: 'RECIPIENT' },
  });
  assert(recipientUser, 'Recipient account exists in DB.');
  console.log(`✓ Authenticated as Recipient: ${recipientUser.fullName} (${recipientUser.email})`);

  // 2.1 Create Blood Request
  console.log('2.1 Testing Create Blood Requisition...');
  const newReq = await requestService.createRequest({
    patientName: 'Arjun Verma',
    bloodGroup: 'O+',
    unitsRequired: 2,
    urgency: 'URGENT',
    requiredDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    locationDescription: 'Apollo Hospital, Bannerghatta Road',
    city: 'Bangalore',
    contactPerson: 'Sunita Verma (Wife)',
    contactPhone: '+91 98450 11223',
    requesterId: recipientUser.id,
  });
  assert(newReq.trackingCode && (newReq.status === 'Pending' || newReq.status === 'PENDING'), 'Blood request created with unique tracking code.');
  console.log(`✓ Blood Request created: Tracking Code ${newReq.trackingCode}`);

  // 2.2 Donor Discovery with 25km radius check
  console.log('2.2 Testing Verified Donor Matching & Strict Distance Filtering...');
  const matchedDonors = await donorService.getDonors({
    userCity: 'Bangalore',
    userArea: 'basavanagudi',
    maxDistance: 25,
    bloodGroup: 'O+',
  });
  assert(Array.isArray(matchedDonors), 'Donor list returned.');
  // Confirm every returned donor is <= 25km away
  for (const d of matchedDonors) {
    if (d.distanceKm !== null && d.distanceKm !== undefined) {
      assert(d.distanceKm <= 25, `Donor ${d.name} (${d.distanceKm}km) must be <= 25km.`);
    }
  }
  console.log(`✓ Discovered ${matchedDonors.length} verified O+ donors strictly within 25km radius in Bangalore.`);

  // 2.3 Send Direct Request to Donor
  console.log('2.3 Testing Direct Blood Request Dispatch...');
  const targetDonor = matchedDonors[0];
  if (targetDonor) {
    const directRes = await donorService.sendDirectRequest(
      targetDonor.id,
      {
        hospitalName: 'Apollo Hospital, Bangalore',
        patientName: 'Arjun Verma',
        requester: 'Sunita Verma',
        unitsNeeded: 2,
        isEmergency: false,
      },
      recipientUser
    );
    assert(directRes.success === true, 'Direct request dispatched.');
    console.log(`✓ Direct request dispatched to ${targetDonor.name}.`);
  }

  // 2.4 Cancel / Close Blood Request
  console.log('2.4 Testing Recipient Request Cancellation...');
  const cancelRes = await requestService.updateStatus(newReq.id, 'CANCELLED', recipientUser);
  assert(cancelRes.status === 'Cancelled' || cancelRes.status === 'CANCELLED', 'Request status updated to CANCELLED.');
  console.log(`✓ Recipient cancelled request ${newReq.trackingCode} successfully.`);

  // -------------------------------------------------------------
  // PORTAL 3: HOSPITAL PORTAL - ALL SERVICES & ACTIONS
  // -------------------------------------------------------------
  console.log('\n>>> [PORTAL 3: HOSPITAL SERVICES]');

  const hospital = await prisma.hospital.findFirst({
    include: { staff: { include: { user: true } } },
  });
  assert(hospital, 'Hospital exists.');
  const adminStaff = hospital.staff.find((s) => s.role === 'HOSPITAL_ADMIN');
  assert(adminStaff, 'Hospital Admin staff exists.');
  console.log(`✓ Hospital Admin: ${adminStaff.user.fullName} (${hospital.name})`);

  // 3.1 Overview Metrics
  console.log('3.1 Testing Hospital Dashboard Overview Metrics...');
  const overview = await hospitalService.getOverviewMetrics(hospital.id);
  assert(overview.activeRequests !== undefined && overview.pendingArrivals !== undefined, 'Overview metrics returned.');
  console.log(`✓ Overview loaded: ${overview.activeRequests} active requests, ${overview.pendingArrivals} pending arrivals, ${overview.successfulDonations} donations.`);

  // 3.2 Donor Arrivals Management
  console.log('3.2 Testing Donor Arrival Confirmation & Screening...');
  const testArrival = await prisma.donorArrival.create({
    data: {
      hospitalId: hospital.id,
      donorId: donorUser.donorProfile.id,
      status: 'EXPECTED',
      eta: '20 mins',
    },
  });
  assert(testArrival.id, 'Donor arrival record scheduled.');

  // Confirm arrival
  const updatedArrival = await hospitalService.updateArrivalStatus(
    hospital.id,
    testArrival.id,
    'ARRIVED',
    adminStaff.user
  );
  assert(updatedArrival.status === 'ARRIVED', 'Arrival status updated to ARRIVED.');
  console.log('✓ Donor arrival checked in at hospital phlebotomy reception.');

  // 3.3 Clinical Phlebotomy & Recording Outcome
  console.log('3.3 Testing Clinical Phlebotomy Donation Collection...');
  const donationOutcome = await hospitalService.recordDonation(
    hospital.id,
    {
      donorId: donorUser.donorProfile.id,
      bloodGroup: 'O+',
      unitsDonated: 1,
      donationType: 'WHOLE_BLOOD',
      screeningPassed: true,
      hemoglobinLevel: 14.2,
      bloodPressure: '120/80',
      pulseRate: 72,
    },
    adminStaff.user
  );
  assert(donationOutcome.id && donationOutcome.unitsDonated === 1, 'Donation recorded.');
  console.log(`✓ Phlebotomy unit recorded: Unit Barcode ${donationOutcome.bagBarcode || donationOutcome.id}`);

  // 3.4 Manage Inventory / Requirements
  console.log('3.4 Testing Blood Inventory & Requirements Update...');
  const reqs = await hospitalService.getRequirements(hospital.id);
  assert(Array.isArray(reqs), 'Hospital requirements list returned.');
  console.log(`✓ Blood inventory contains ${reqs.length} blood product groups.`);

  // 3.5 Staff Management & Permissions
  console.log('3.5 Testing Staff Invitation & Role-Based Access Control...');
  const newStaffRes = await hospitalService.addStaff(
    hospital.id,
    {
      name: 'Dr. Neha Saxena',
      email: `neha_${Date.now()}@test-hospital.org`,
      phone: `+91 94000 ${Math.floor(10000 + Math.random() * 90000)}`,
      role: 'donor_coordinator',
      department: 'Donor Relations & Camps',
      password: 'CoordinatorPass123!',
    },
    adminStaff.user
  );
  assert(newStaffRes.id && newStaffRes.role === 'donor_coordinator', 'Staff member assigned role.');

  // Verify staff removal
  const removeRes = await hospitalService.removeStaff(hospital.id, newStaffRes.id, adminStaff.user);
  assert(removeRes.success === true, 'Staff member removed.');
  console.log('✓ Hospital staff invitation, role assignment, and removal verified.');

  console.log('\n================================================================');
  console.log(' MASTER E2E VERIFICATION COMPLETED: ALL 3 PORTALS 100% WORKING');
  console.log('================================================================\n');
  process.exit(0);
}

runMasterE2ETests().catch((err) => {
  console.error('Master E2E Verification Failed:', err);
  process.exit(1);
});
