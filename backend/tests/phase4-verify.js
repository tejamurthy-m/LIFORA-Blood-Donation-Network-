import assert from 'assert';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma.js';
import { otpService } from '../src/services/otp.service.js';
import { donorService } from '../src/services/donor.service.js';
import { hospitalService } from '../src/services/hospital.service.js';
import { authService } from '../src/services/auth.service.js';

async function runPhase4Tests() {
  console.log('--- STARTING PHASE 4: NOTIFICATIONS, OTP & STAFF INVITES TEST SUITE ---');

  // Find or create test users
  const donorUser = await prisma.user.findFirst({
    where: { role: 'DONOR' },
    include: { donorProfile: true },
  });
  assert(donorUser, 'A donor user must exist in the database.');

  const recipientUser = await prisma.user.findFirst({
    where: { role: 'RECIPIENT' },
  });
  assert(recipientUser, 'A recipient user must exist in the database.');

  const hospital = await prisma.hospital.findFirst({
    include: { staff: { include: { user: true } } },
  });
  assert(hospital, 'A hospital must exist in the database.');

  const adminStaff = hospital.staff.find((s) => s.role === 'HOSPITAL_ADMIN');
  assert(adminStaff, 'Hospital must have a HOSPITAL_ADMIN staff member.');

  // ==========================================
  // Test 1: Phone OTP Generation & Verification
  // ==========================================
  console.log('\n[1/5] Testing Phone OTP Generation & Verification...');
  const testPhone = '9998887771';
  const sendRes = await otpService.sendPhoneOtp(testPhone);
  assert(sendRes.success === true, 'Phone OTP send should succeed.');
  assert(sendRes.devOtp && sendRes.devOtp.length === 6, 'Should generate a 6-digit OTP.');

  // Test invalid OTP rejection
  let failedInvalidOtp = false;
  try {
    await otpService.verifyPhoneOtp(testPhone, '000000');
  } catch (err) {
    failedInvalidOtp = true;
    assert(err.statusCode === 400, 'Invalid OTP should throw 400.');
  }
  assert(failedInvalidOtp, 'Invalid OTP must be rejected.');

  // Test valid OTP verification
  const verifyRes = await otpService.verifyPhoneOtp(testPhone, sendRes.devOtp, donorUser);
  assert(verifyRes.success === true && verifyRes.verified === true, 'Valid OTP should succeed.');

  // Verify DB reflects verified state
  const updatedDonor = await prisma.user.findUnique({ where: { id: donorUser.id } });
  assert(updatedDonor.isPhoneVerified === true, 'User phone verification flag should be true in DB.');

  // Test single-use prevention (reuse should fail)
  let failedReusedOtp = false;
  try {
    await otpService.verifyPhoneOtp(testPhone, sendRes.devOtp);
  } catch (err) {
    failedReusedOtp = true;
  }
  assert(failedReusedOtp, 'Reused OTP must be rejected.');
  console.log('✓ Phone OTP generation, invalid rejection, verification, and single-use enforcement passed.');

  // ==========================================
  // Test 2: Email Verification Code Lifecycle
  // ==========================================
  console.log('\n[2/5] Testing Email Verification Code Lifecycle...');
  const testEmail = donorUser.email;
  const emailRes = await otpService.sendEmailVerification(testEmail);
  assert(emailRes.success === true, 'Email verification send should succeed.');
  assert(emailRes.devCode && emailRes.devCode.length === 6, 'Should generate 6-digit code.');

  const verifyEmailRes = await otpService.verifyEmailCode(testEmail, emailRes.devCode, donorUser);
  assert(verifyEmailRes.success === true && verifyEmailRes.verified === true, 'Valid email code should verify.');

  const donorEmailVerified = await prisma.user.findUnique({ where: { id: donorUser.id } });
  assert(donorEmailVerified.isEmailVerified === true, 'User email verification flag should be true in DB.');
  console.log('✓ Email verification code lifecycle and user record update passed.');

  // ==========================================
  // Test 3: Password Reset Token & Execution
  // ==========================================
  console.log('\n[3/5] Testing Password Reset Flow...');
  const resetReq = await otpService.requestPasswordReset(testEmail);
  assert(resetReq.success === true, 'Password reset request should succeed.');
  assert(resetReq.devResetCode && resetReq.devResetCode.length === 6, 'Should generate reset code.');

  const newTestPass = 'L1fora$Passw0rd_New';
  const resetResult = await otpService.resetPassword({
    email: testEmail,
    resetCode: resetReq.devResetCode,
    newPassword: newTestPass,
  });
  assert(resetResult.success === true, 'Password reset should succeed.');

  // Verify updated password hash in DB
  const userAfterReset = await prisma.user.findUnique({ where: { id: donorUser.id } });
  const isMatch = await bcrypt.compare(newTestPass, userAfterReset.passwordHash);
  assert(isMatch === true, 'New password hash should match in DB.');

  // Test logging in with newly reset credentials
  const loginResult = await authService.login(testEmail, newTestPass);
  assert(loginResult.token && loginResult.user.id === donorUser.id, 'Login with new password should succeed.');
  console.log('✓ Password reset token generation, password update, and login verified.');

  // ==========================================
  // Test 4: Notification Isolation & Direct Request Targeting
  // ==========================================
  console.log('\n[4/5] Testing User-Scoped Notification Isolation...');
  const initialHospitalNotifs = await prisma.notification.count({
    where: { userId: adminStaff.userId },
  });

  const directReqRes = await donorService.sendDirectRequest(
    donorUser.donorProfile.id,
    {
      hospitalName: 'Manipal Hospital, Bangalore',
      patientName: 'Kavita Reddy',
      requester: 'Suresh Reddy (Family Member)',
      unitsNeeded: 2,
      isEmergency: true,
    },
    recipientUser
  );
  assert(directReqRes.success === true, 'Direct request should be dispatched.');

  // Verify donor notification
  const donorLatestNotif = await prisma.notification.findFirst({
    where: { userId: donorUser.id },
    orderBy: { createdAt: 'desc' },
  });
  assert(donorLatestNotif, 'Target donor must receive in-app notification.');
  assert(donorLatestNotif.title.includes('Direct Blood Requisition'), 'Title must reflect requisition.');
  assert(donorLatestNotif.message.includes('Suresh Reddy'), 'Message must name the requester.');
  assert(donorLatestNotif.message.includes('Kavita Reddy'), 'Message must name the patient.');
  assert(donorLatestNotif.message.includes('Manipal Hospital'), 'Message must name the hospital.');

  // Verify requester confirmation notification
  const requesterLatestNotif = await prisma.notification.findFirst({
    where: { userId: recipientUser.id },
    orderBy: { createdAt: 'desc' },
  });
  assert(requesterLatestNotif, 'Requester must receive confirmation notification.');
  assert(requesterLatestNotif.title.includes('Direct Request Dispatched'), 'Requester title must confirm dispatch.');
  assert(requesterLatestNotif.message.includes(donorUser.fullName), 'Requester message must name target donor.');

  // Verify Hospital did NOT receive this user-to-donor notification
  const finalHospitalNotifs = await prisma.notification.count({
    where: { userId: adminStaff.userId },
  });
  assert(finalHospitalNotifs === initialHospitalNotifs, 'Hospital notifications must not be contaminated by private donor request.');
  console.log('✓ Notification targeting, message formatting, and isolation across portals verified.');

  // ==========================================
  // Test 5: Hospital Staff Invitation & Audit Trail
  // ==========================================
  console.log('\n[5/5] Testing Hospital Staff Invitation & Audit Trail...');
  const newStaffEmail = `staff_${Date.now()}@lifora-test.org`;
  const inviteResult = await hospitalService.addStaff(
    hospital.id,
    {
      name: 'Dr. Sameer Deshmukh',
      email: newStaffEmail,
      phone: `+91 91000 ${Math.floor(10000 + Math.random() * 90000)}`,
      role: 'request_manager',
      department: 'Emergency & Blood Bank',
      password: 'TemporaryPass123!',
    },
    adminStaff.user
  );

  assert(inviteResult.userId, 'New staff user must be created.');
  assert(inviteResult.role === 'request_manager', 'Staff role must match.');

  // Verify in-app notification created for the new staff
  const staffNotif = await prisma.notification.findFirst({
    where: { userId: inviteResult.userId },
  });
  assert(staffNotif && staffNotif.type === 'STAFF_INVITE', 'Staff member must receive STAFF_INVITE notification.');

  // Verify audit log
  const auditEntry = await prisma.auditLog.findFirst({
    where: { hospitalId: hospital.id, action: 'Staff Member Added' },
    orderBy: { createdAt: 'desc' },
  });
  assert(auditEntry && auditEntry.actorName === adminStaff.user.fullName, 'Audit log must record admin action.');
  console.log('✓ Hospital staff invitation, notification dispatch, and audit logging verified.');

  console.log('\n======================================================');
  console.log(' ALL 5 PHASE 4 TESTS COMPLETED SUCCESSFULLY (100%)');
  console.log('======================================================\n');
  process.exit(0);
}

runPhase4Tests().catch((err) => {
  console.error('Phase 4 Test Failed:', err);
  process.exit(1);
});
