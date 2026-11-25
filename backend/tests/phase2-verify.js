import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';

async function runPhase2Tests() {
  console.log('--- STARTING PHASE 2 MEDICAL VERIFICATION PIPELINE TESTS ---');

  // Test 1: Check GET /api/v1/donors/me/donations
  try {
    const donRes = await axios.get(`${API_URL}/donors/me/donations`, {
      headers: { Authorization: 'Bearer jwt_demo_donor' },
    });
    console.log('✅ GET /api/v1/donors/me/donations Status:', donRes.status, 'Count:', donRes.data.data.length);
  } catch (err) {
    console.error('❌ GET /api/v1/donors/me/donations failed:', err.response?.data || err.message);
  }

  // Test 2: Upload medical document via FormData
  let uploadedDocId = null;
  try {
    const formData = new FormData();
    const dummyBlob = new Blob(['%PDF-1.4 Mock Pathology Blood Report for Testing...'], { type: 'application/pdf' });
    formData.append('file', dummyBlob, 'pathology_test_report.pdf');
    formData.append('docType', 'Pathology Blood Group Certificate');
    formData.append('docNumber', 'TEST-DOC-2026-999');
    formData.append('notes', 'Automated Phase 2 pipeline test document');

    const uploadRes = await axios.post(`${API_URL}/verifications/upload`, formData, {
      headers: {
        Authorization: 'Bearer jwt_demo_donor',
      },
    });

    console.log('✅ POST /api/v1/verifications/upload Status:', uploadRes.status);
    console.log('✅ Uploaded Doc ID:', uploadRes.data.data.id, 'Status:', uploadRes.data.data.status);
    uploadedDocId = uploadRes.data.data.id;
  } catch (err) {
    console.error('❌ POST /api/v1/verifications/upload failed:', err.response?.data || err.message);
  }

  // Test 3: Get current user's document
  try {
    const myDocRes = await axios.get(`${API_URL}/verifications/my-document`, {
      headers: { Authorization: 'Bearer jwt_demo_donor' },
    });
    console.log('✅ GET /api/v1/verifications/my-document:', {
      id: myDocRes.data.data?.id,
      docType: myDocRes.data.data?.docType,
      status: myDocRes.data.data?.status,
      hasSignedUrl: Boolean(myDocRes.data.data?.signedUrl),
    });
  } catch (err) {
    console.error('❌ GET /api/v1/verifications/my-document failed:', err.response?.data || err.message);
  }

  // Test 4: Medical reviewer views queue
  try {
    const queueRes = await axios.get(`${API_URL}/verifications/queue`, {
      headers: { Authorization: 'Bearer jwt_demo_hospital' },
    });
    console.log(`✅ Medical Reviewer queue count: ${queueRes.data.count}`);
    const found = queueRes.data.data.some((d) => d.id === uploadedDocId);
    console.log(`✅ Newly uploaded document present in medical review queue: ${found}`);
  } catch (err) {
    console.error('❌ Medical Reviewer queue fetch failed:', err.response?.data || err.message);
  }

  // Test 5: Medical reviewer requests clarification
  if (uploadedDocId) {
    try {
      const clarifyRes = await axios.patch(
        `${API_URL}/verifications/${uploadedDocId}/review`,
        {
          action: 'request_clarification',
          clarificationMessage: 'Test: Please provide updated serology test report.',
        },
        {
          headers: { Authorization: 'Bearer jwt_demo_hospital' },
        }
      );
      console.log('✅ Request Clarification Status:', clarifyRes.data.data.status);
    } catch (err) {
      console.error('❌ Request Clarification failed:', err.response?.data || err.message);
    }

    // Test 6: Medical reviewer approves report
    try {
      const approveRes = await axios.patch(
        `${API_URL}/verifications/${uploadedDocId}/review`,
        {
          action: 'approve',
          notes: 'Test: Verified by Transfusion Specialist.',
        },
        {
          headers: { Authorization: 'Bearer jwt_demo_hospital' },
        }
      );
      console.log('✅ Approve Document Status:', approveRes.data.data.status);
    } catch (err) {
      console.error('❌ Approve Document failed:', err.response?.data || err.message);
    }
  }

  console.log('--- ALL PHASE 2 TESTS COMPLETED SUCCESSFULLY ---');
  await prisma.$disconnect();
}

runPhase2Tests().catch(console.error);
