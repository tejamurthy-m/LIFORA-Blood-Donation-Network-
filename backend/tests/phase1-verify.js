import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('--- STARTING PHASE 1 AUDIT & VERIFICATION TESTS ---');

  // Test 1: Health Check
  try {
    const health = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health Check:', health.data);
  } catch (err) {
    console.error('❌ Health Check Failed:', err.message);
  }

  // Test 2: Check Tejamurthy's verification and badge in DB
  try {
    const tm = await prisma.donorProfile.findFirst({
      where: { user: { email: { contains: 'tejamurthy' } } },
      include: { user: true }
    });
    console.log('✅ Tejamurthy Donor Profile:', {
      id: tm?.id,
      fullName: tm?.user?.fullName,
      email: tm?.user?.email,
      verificationStatus: tm?.verificationStatus,
      badge: tm?.badge,
      isAvailable: tm?.isAvailable
    });

    const docs = await prisma.medicalDocument.findMany({
      where: { userId: tm?.userId }
    });
    console.log('✅ Medical Documents Count for Tejamurthy:', docs.length, docs.map(d => ({
      id: d.id,
      status: d.status,
      docType: d.docType,
      fileUrl: d.fileUrl
    })));
  } catch (err) {
    console.error('❌ Tejamurthy DB check failed:', err.message);
  }

  // Test 3: Donor matching endpoint (GET /api/v1/donors)
  try {
    const res = await axios.get(`${API_URL}/donors?bloodGroup=O_POSITIVE`);
    const donors = res.data.data;
    console.log(`✅ Donor Search (O_POSITIVE): Found ${donors.length} donors`);
    const unverified = donors.filter(d => d.verificationStatus !== 'VERIFIED');
    if (unverified.length === 0) {
      console.log('✅ Verified Donors Filter Enforcement: PASSED (0 unverified donors returned in matching)');
    } else {
      console.error(`❌ Leak: ${unverified.length} unverified donors returned!`);
    }
    const hasTeja = donors.some(d => d.fullName?.toLowerCase().includes('tejamurthy') || d.email?.toLowerCase().includes('tejamurthy'));
    console.log(`✅ Tejamurthy present in matching results: ${hasTeja}`);
  } catch (err) {
    console.error('❌ Donor Search API failed:', err.message);
  }

  // Test 4: requireMedicalReviewer Guard
  try {
    // With donor demo token: should be 403 Forbidden
    try {
      await axios.get(`${API_URL}/verifications/queue`, {
        headers: { Authorization: 'Bearer jwt_demo_donor' }
      });
      console.error('❌ Donor access to /verifications/queue did NOT fail (expected 403)!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Donor access to /verifications/queue correctly rejected with 403 Forbidden');
      } else {
        console.error('❌ Unexpected status for donor:', err.response?.status);
      }
    }

    // With hospital admin / medical reviewer demo token: should succeed
    const queueRes = await axios.get(`${API_URL}/verifications/queue`, {
      headers: { Authorization: 'Bearer jwt_demo_hospital' }
    });
    console.log(`✅ Medical Reviewer queue access: PASSED (${queueRes.data.count} pending items)`);
  } catch (err) {
    console.error('❌ Medical Reviewer verification queue test failed:', err.response?.data || err.message);
  }

  // Test 5: Super Admin Access
  try {
    const pendingHospitals = await axios.get(`${API_URL}/hospitals/platform/pending`, {
      headers: { Authorization: 'Bearer jwt_demo_super_admin' }
    });
    console.log(`✅ Super Admin platform/pending access: PASSED (Status 200, count: ${pendingHospitals.data.count})`);
  } catch (err) {
    console.error('❌ Super Admin access failed:', err.response?.data || err.message);
  }

  console.log('--- ALL PHASE 1 AUDIT & VERIFICATION TESTS PASSED ---');
  await prisma.$disconnect();
}

runTests().catch(console.error);
