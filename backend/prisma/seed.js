import { PrismaClient, UserRole, StaffRole, BloodGroup, VerificationStatus, RequestUrgency, RequestStatus, ArrivalStatus, DonationType, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed on Supabase PostgreSQL...');

  // Clean existing data in reverse order of foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.donationRecord.deleteMany();
  await prisma.donorArrival.deleteMany();
  await prisma.bloodRequirement.deleteMany();
  await prisma.donorResponse.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.medicalDocument.deleteMany();
  await prisma.hospitalStaff.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.donorProfile.deleteMany();
  await prisma.recipientProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const donorPasswordHash = await bcrypt.hash('donor123', 10);
  const recipientPasswordHash = await bcrypt.hash('recipient123', 10);
  const hospitalPasswordHash = await bcrypt.hash('hospital123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. Create Super Admin / Platform Operator
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@lifora.org',
      passwordHash: adminPasswordHash,
      fullName: 'Lifora Operations',
      phone: '+91 99999 00001',
      role: UserRole.SUPER_ADMIN,
      city: 'Mumbai',
      area: 'BKC Compliance Desk',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Create Hospital: Lilavati Hospital & Research Centre
  const hospital = await prisma.hospital.create({
    data: {
      name: 'Lilavati Hospital & Research Centre',
      licenseNumber: 'BB-LIC-MH-401',
      registrationNumber: 'MH-HOSP-REG-10492',
      address: 'A-791, Bandra Reclamation, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      latitude: 19.0509,
      longitude: 72.8286,
      contactPhone: '+91 22 2675 1000',
      officialEmail: 'bloodbank@lilavatihospital.com',
      verificationStatus: VerificationStatus.VERIFIED,
      accreditation: 'NABH Accredited Transfusion Centre',
      bedCapacity: 350,
      headDoctorName: 'Dr. A. K. Sen',
      headDoctorQual: 'MD (Transfusion Medicine)',
      headDoctorPhone: '+91 22 2675 1022',
      headDoctorEmail: 'a.sen@lilavatihospital.com',
      facilities: [
        'Whole Blood',
        'Packed Red Blood Cells (PRBC)',
        'Platelet Concentrate (RDP / SDP)',
        'Fresh Frozen Plasma (FFP)',
        'Cryoprecipitate',
        'Leukoreduced Components',
      ],
    },
  });

  // 3. Create Hospital Staff Accounts
  const staffConfigs = [
    {
      name: 'Dr. Anita Joshi',
      email: 'hospital@lifora.org',
      role: StaffRole.HOSPITAL_ADMIN,
      department: 'Transfusion Medicine & Blood Centre',
      phone: '+91 98200 12345',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Rajesh Kadam',
      email: 'requests@lilavati.org',
      role: StaffRole.REQUEST_MANAGER,
      department: 'Emergency Requisitions Desk',
      phone: '+91 98200 67890',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sneha Fernandez',
      email: 'coordinator@lilavati.org',
      role: StaffRole.DONOR_COORDINATOR,
      department: 'Community Donor Outreach',
      phone: '+91 98200 54321',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Vikram Malhotra',
      email: 'medical@lilavati.org',
      role: StaffRole.MEDICAL_STAFF,
      department: 'Donor Screening & Phlebotomy',
      phone: '+91 98200 98765',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
    },
  ];

  for (const s of staffConfigs) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: hospitalPasswordHash,
        fullName: s.name,
        phone: s.phone,
        role: UserRole.HOSPITAL,
        city: 'Mumbai',
        area: 'Bandra West',
        avatarUrl: s.avatar,
      },
    });

    await prisma.hospitalStaff.create({
      data: {
        hospitalId: hospital.id,
        userId: user.id,
        role: s.role,
        department: s.department,
        status: 'active',
      },
    });
  }

  // 4. Create Primary Donor: Dr. Aryan Sharma
  const donorUser1 = await prisma.user.create({
    data: {
      email: 'donor@lifora.org',
      passwordHash: donorPasswordHash,
      fullName: 'Dr. Aryan Sharma',
      phone: '+91 98201 11223',
      role: UserRole.DONOR,
      city: 'Mumbai',
      area: 'Bandra West',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const donorProfile1 = await prisma.donorProfile.create({
    data: {
      userId: donorUser1.id,
      bloodGroup: BloodGroup.O_POSITIVE,
      latitude: 19.0596,
      longitude: 72.8295,
      isAvailable: true,
      emergencyReady: true,
      badge: 'Golden Donor',
      totalDonations: 9,
      lastDonationDate: new Date('2026-08-10'),
      profileCompletion: 92,
      bio: 'Voluntary O+ donor and medical officer. Dedicated to emergency pediatric and oncology units.',
      age: 32,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });

  // Additional realistic donors
  const extraDonors = [
    {
      name: 'Kavita Menon',
      email: 'kavita.m@example.com',
      phone: '+91 98202 22334',
      bloodGroup: BloodGroup.A_POSITIVE,
      city: 'Mumbai',
      area: 'Andheri East',
      lat: 19.1136,
      lng: 72.8697,
      badge: 'Verified Donor',
      totalDonations: 5,
    },
    {
      name: 'Rahul Deshmukh',
      email: 'rahul.d@example.com',
      phone: '+91 98203 33445',
      bloodGroup: BloodGroup.B_POSITIVE,
      city: 'Mumbai',
      area: 'Dadar West',
      lat: 19.0178,
      lng: 72.8478,
      badge: 'Silver Donor',
      totalDonations: 3,
    },
    {
      name: 'Amitabh Sen',
      email: 'amitabh.s@example.com',
      phone: '+91 98204 44556',
      bloodGroup: BloodGroup.O_NEGATIVE,
      city: 'Mumbai',
      area: 'Colaba',
      lat: 18.9067,
      lng: 72.8147,
      badge: 'Universal Hero (O-)',
      totalDonations: 11,
    },
  ];

  for (const d of extraDonors) {
    const user = await prisma.user.create({
      data: {
        email: d.email,
        passwordHash: donorPasswordHash,
        fullName: d.name,
        phone: d.phone,
        role: UserRole.DONOR,
        city: d.city,
        area: d.area,
      },
    });

    await prisma.donorProfile.create({
      data: {
        userId: user.id,
        bloodGroup: d.bloodGroup,
        latitude: d.lat,
        longitude: d.lng,
        isAvailable: true,
        emergencyReady: true,
        badge: d.badge,
        totalDonations: d.totalDonations,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });
  }

  // 5. Create Recipient: Priya Nair
  const recipientUser = await prisma.user.create({
    data: {
      email: 'recipient@lifora.org',
      passwordHash: recipientPasswordHash,
      fullName: 'Priya Nair',
      phone: '+91 98450 33445',
      role: UserRole.RECIPIENT,
      city: 'Mumbai',
      area: 'Bandra East',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  await prisma.recipientProfile.create({
    data: {
      userId: recipientUser.id,
      hospitalName: 'Lilavati Hospital & Research Centre',
    },
  });

  // 6. Create Blood Requirements for Hospital
  const requirements = [
    { group: BloodGroup.O_POSITIVE, target: 40, collected: 28, urgency: RequestUrgency.EMERGENCY },
    { group: BloodGroup.A_POSITIVE, target: 30, collected: 24, urgency: RequestUrgency.URGENT },
    { group: BloodGroup.B_POSITIVE, target: 25, collected: 21, urgency: RequestUrgency.NORMAL },
    { group: BloodGroup.O_NEGATIVE, target: 15, collected: 4, urgency: RequestUrgency.EMERGENCY },
    { group: BloodGroup.AB_POSITIVE, target: 20, collected: 18, urgency: RequestUrgency.NORMAL },
    { group: BloodGroup.A_NEGATIVE, target: 10, collected: 6, urgency: RequestUrgency.URGENT },
    { group: BloodGroup.B_NEGATIVE, target: 10, collected: 5, urgency: RequestUrgency.URGENT },
    { group: BloodGroup.AB_NEGATIVE, target: 8, collected: 3, urgency: RequestUrgency.EMERGENCY },
  ];

  for (const r of requirements) {
    await prisma.bloodRequirement.create({
      data: {
        hospitalId: hospital.id,
        bloodGroup: r.group,
        targetUnits: r.target,
        collectedUnits: r.collected,
        urgency: r.urgency,
        status: r.collected < r.target * 0.5 ? 'Critical' : 'Active',
      },
    });
  }

  // 7. Create Active Blood Requests
  const request1 = await prisma.bloodRequest.create({
    data: {
      trackingCode: 'LIF-8831',
      patientName: 'PT-9042 (Trauma Surgery)',
      bloodGroup: BloodGroup.O_POSITIVE,
      unitsRequired: 10,
      unitsFulfilled: 4,
      urgency: RequestUrgency.EMERGENCY,
      requiredDate: new Date(),
      locationDescription: 'Emergency OT - Ward 3B',
      city: 'Mumbai',
      contactPerson: 'Rajesh Kadam (Request Desk)',
      contactPhone: '+91 98200 67890',
      additionalInstructions: 'Immediate cross-matching for post-accident trauma transfusion.',
      status: RequestStatus.IN_PROGRESS,
      hospitalId: hospital.id,
      requesterId: recipientUser.id,
    },
  });

  const request2 = await prisma.bloodRequest.create({
    data: {
      trackingCode: 'LIF-8840',
      patientName: 'PT-9055 (CABG Bypass)',
      bloodGroup: BloodGroup.A_POSITIVE,
      unitsRequired: 4,
      unitsFulfilled: 4,
      urgency: RequestUrgency.URGENT,
      requiredDate: new Date(),
      locationDescription: 'Cardiology ICU - 4th Floor',
      city: 'Mumbai',
      contactPerson: 'Dr. Anita Joshi',
      contactPhone: '+91 22 2675 1000',
      additionalInstructions: 'Packed red cells required pre-op.',
      status: RequestStatus.FULFILLED,
      hospitalId: hospital.id,
    },
  });

  // 8. Create Donor Arrival
  await prisma.donorArrival.create({
    data: {
      hospitalId: hospital.id,
      donorId: donorProfile1.id,
      requestId: request1.id,
      eta: '15 mins',
      status: ArrivalStatus.EXPECTED,
      assignedStaff: 'Dr. Vikram Malhotra',
    },
  });

  // 9. Create Clinical Donation Record
  await prisma.donationRecord.create({
    data: {
      hospitalId: hospital.id,
      donorId: donorProfile1.id,
      bloodGroup: BloodGroup.O_POSITIVE,
      unitsDonated: 1,
      donationType: DonationType.WHOLE_BLOOD,
      screeningPassed: true,
      hemoglobinLevel: 14.2,
      bloodPressure: '120/80',
      pulseRate: 72,
      bagBarcode: 'BAG-2026-9921',
      verifiedBy: 'Dr. Vikram Malhotra',
    },
  });

  // 10. Create Audit Log
  await prisma.auditLog.create({
    data: {
      hospitalId: hospital.id,
      userId: adminUser.id,
      action: 'Hospital Verified & Activated',
      actorName: 'Lifora Operations',
      target: 'BB-LIC-MH-401',
      notes: 'State blood bank license verified against state medical council database.',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Accounts Created:');
  console.log('  Donor:         donor@lifora.org / donor123');
  console.log('  Recipient:     recipient@lifora.org / recipient123');
  console.log('  Hospital Admin:hospital@lifora.org / hospital123');
  console.log('  Request Mgr:   requests@lilavati.org / hospital123');
  console.log('  Donor Coord:   coordinator@lilavati.org / hospital123');
  console.log('  Medical Staff: medical@lilavati.org / hospital123');
  console.log('  Super Admin:   admin@lifora.org / admin123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
