import assert from 'node:assert';
import { prisma } from '../src/config/prisma.js';
import { donorService } from '../src/services/donor.service.js';
import { requestService } from '../src/services/request.service.js';
import { hospitalService } from '../src/services/hospital.service.js';
import { authService } from '../src/services/auth.service.js';

async function verifyUserReportedFixes() {
  console.log('================================================================');
  console.log(' VERIFYING USER-REPORTED FIXES ACROSS ROLES & PORTALS');
  console.log('================================================================\n');

  // 1. Verify Donor Profile Update & Sync
  console.log('1. Testing Donor Profile Update & Coordinate Recalculation...');
  const donorUser = await prisma.user.findFirst({
    where: { role: 'DONOR', fullName: { contains: 'tejamurthy', mode: 'insensitive' } },
    include: { donorProfile: true },
  });
  assert(donorUser, 'tejamurthy donor account exists.');

  const updatedDonor = await donorService.updateProfile(donorUser.id, {
    fullName: 'tejamurthy',
    phone: '9380149463',
    city: 'Bangalore',
    area: 'basavanagudi',
    bloodGroup: 'O+',
    bio: 'Emergency O+ voluntary donor in Basavanagudi, Bangalore.',
    age: 26,
    isAvailable: true,
  });

  assert(updatedDonor.city === 'Bangalore', 'City updated.');
  assert(updatedDonor.area.toLowerCase().includes('basavanagudi'), 'Area updated.');
  assert(updatedDonor.lat === 12.9422 && updatedDonor.lng === 77.5753, 'Coordinates accurately resolved to Basavanagudi (12.9422, 77.5753).');
  console.log('✓ Donor profile updated: Bangalore, Basavanagudi [12.9422, 77.5753]');

  // 2. Testing Recipient Distance & 25km Filter
  console.log('\n2. Testing Recipient in Bangalore & Strict 25km Radius Filter...');
  const bangaloreResults = await donorService.getDonors({
    userCity: 'Bangalore',
    userArea: 'Basavanagudi',
    userLat: 12.9422,
    userLng: 77.5753,
    maxDistance: 25,
    bloodGroup: 'ALL',
    city: 'ALL',
  });

  assert(Array.isArray(bangaloreResults), 'Donor search returned array.');
  assert(bangaloreResults.length > 0, 'Found matching donors in Bangalore.');

  // Every single returned donor MUST be <= 25km
  for (const d of bangaloreResults) {
    assert(d.distanceKm != null && d.distanceKm <= 25, `Donor ${d.fullName} distance ${d.distanceKm}km exceeds 25km!`);
    assert(d.city.toLowerCase() === 'bangalore', `Distant donor ${d.fullName} from ${d.city} leaked into Bangalore 25km results!`);
  }
  console.log(`✓ Recipient search at Basavanagudi: Found ${bangaloreResults.length} donors. All strictly <= 25km and located in Bangalore.`);

  // Verify that Mumbai donors are at ~840km and completely excluded
  const allDonorsNoCap = await donorService.getDonors({
    userCity: 'Bangalore',
    userArea: 'Basavanagudi',
    userLat: 12.9422,
    userLng: 77.5753,
    maxDistance: 'ALL',
    city: 'ALL',
  });
  const mumbaiDonor = allDonorsNoCap.find(d => d.city.toLowerCase() === 'mumbai');
  if (mumbaiDonor) {
    assert(mumbaiDonor.distanceKm > 800, `Mumbai donor ${mumbaiDonor.fullName} has wrong distance ${mumbaiDonor.distanceKm}km (should be ~840km).`);
    console.log(`✓ Distance calculation verified: Mumbai donor (${mumbaiDonor.fullName}) is ${mumbaiDonor.distanceKm}km away from Bangalore.`);
  }

  // Verify that the updated donor tejamurthy appears with updated profile in recipient search
  const foundTeja = bangaloreResults.find(d => d.fullName.toLowerCase().includes('tejamurthy'));
  assert(foundTeja, 'tejamurthy appears in recipient search results.');
  assert(foundTeja.city === 'Bangalore', 'tejamurthy profile shows updated city Bangalore.');
  assert(foundTeja.distanceKm === 0, 'tejamurthy in Basavanagudi is 0km from Basavanagudi recipient.');
  console.log('✓ Updated donor profile is actively reflected in recipient portal matching.');

  // 3. Testing Direct Request & Targeted Notification
  console.log('\n3. Testing Requisition & Notification Delivery...');
  const recipientUser = await prisma.user.findFirst({
    where: { role: 'RECIPIENT' },
  });
  assert(recipientUser, 'Recipient user exists.');

  const directReqRes = await donorService.sendDirectRequest(
    foundTeja.id,
    {
      patientName: 'Ramesh Sharma',
      requester: recipientUser.fullName,
      hospitalName: 'Manipal Hospital, Bangalore',
      unitsNeeded: 1,
    },
    recipientUser
  );
  assert(directReqRes.success, 'Direct request dispatched successfully.');

  // Check target donor notification
  const donorNotifs = await prisma.notification.findMany({
    where: { userId: foundTeja.userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  const latestDonorNotif = donorNotifs[0];
  assert(latestDonorNotif, 'Donor received in-app notification.');
  assert(latestDonorNotif.message.includes('Ramesh Sharma') || latestDonorNotif.message.includes(recipientUser.fullName), 'Notification contains correct requester/patient info.');
  console.log(`✓ Donor notification: "${latestDonorNotif.title}" - ${latestDonorNotif.message}`);

  // Check requester confirmation notification
  const requesterNotifs = await prisma.notification.findMany({
    where: { userId: recipientUser.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  const latestReqNotif = requesterNotifs[0];
  assert(latestReqNotif, 'Requester received confirmation notification.');
  console.log(`✓ Requester confirmation: "${latestReqNotif.title}" - ${latestReqNotif.message}`);

  // 4. Testing Hospital Portal Functions
  console.log('\n4. Testing Hospital Portal Functions & Overview...');
  const hospital = await prisma.hospital.findFirst({
    include: { staff: { include: { user: true } } },
  });
  assert(hospital, 'Hospital exists.');
  const adminStaff = hospital.staff.find((s) => s.role === 'HOSPITAL_ADMIN');
  assert(adminStaff, 'Hospital admin staff exists.');

  const hospitalOverview = await hospitalService.getOverviewMetrics(hospital.id);
  assert(hospitalOverview.activeRequests !== undefined, 'Hospital overview metrics loaded.');
  console.log(`✓ Hospital overview metrics loaded for ${hospital.name}.`);

  console.log('\n================================================================');
  console.log(' ALL USER-REPORTED ISSUES VERIFIED FIXED AND WORKING 100%');
  console.log('================================================================\n');
  process.exit(0);
}

verifyUserReportedFixes().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
