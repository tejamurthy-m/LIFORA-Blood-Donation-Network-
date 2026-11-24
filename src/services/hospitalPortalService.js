import api, { simulatedDelay } from './api';
import { getStoredRequests, saveStoredRequests } from './requestService';

const HOSPITAL_DATA_KEY = 'lifora_hospital_portal_data';

// Default Seed Data for the Logged-in Hospital: Lilavati Hospital & Research Centre
export const INITIAL_HOSPITAL_DATA = {
  profile: {
    id: 'hosp-1',
    name: 'Lilavati Hospital & Research Centre',
    licenseNumber: 'BB-LIC-MH-401',
    registrationNumber: 'MH-HOSP-REG-10492',
    address: 'A-791, Bandra Reclamation, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    contactPhone: '+91 22 2675 1000',
    officialEmail: 'bloodbank@lilavatihospital.com',
    verificationStatus: 'Verified', // Verified | Pending | Suspended (controlled strictly by Super Admin)
    accreditation: 'NABH Accredited Transfusion Centre',
    bedCapacity: 350,
    logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80',
    bloodBankHead: {
      name: 'Dr. A. K. Sen',
      qualification: 'MD (Transfusion Medicine)',
      phone: '+91 22 2675 1022',
      email: 'a.sen@lilavatihospital.com',
    },
    facilities: [
      'Whole Blood',
      'Packed Red Blood Cells (PRBC)',
      'Platelet Concentrate (RDP / SDP)',
      'Fresh Frozen Plasma (FFP)',
      'Cryoprecipitate',
      'Leukoreduced Components',
    ],
  },

  // Hospital Staff accounts working in the SAME portal with RBAC
  staff: [
    {
      id: 'staff-1',
      name: 'Dr. Anita Joshi',
      email: 'hospital@lifora.org',
      role: 'hospital_admin',
      roleLabel: 'Hospital Admin',
      department: 'Transfusion Medicine & Blood Centre',
      phone: '+91 98200 12345',
      status: 'active',
      joinedDate: '2025-01-15',
      lastActive: 'Just now',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'staff-2',
      name: 'Rajesh Kadam',
      email: 'requests@lilavati.org',
      role: 'request_manager',
      roleLabel: 'Request Manager',
      department: 'Emergency Requisitions Desk',
      phone: '+91 98200 67890',
      status: 'active',
      joinedDate: '2025-03-10',
      lastActive: '25 mins ago',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'staff-3',
      name: 'Sneha Fernandez',
      email: 'coordinator@lilavati.org',
      role: 'donor_coordinator',
      roleLabel: 'Donor Coordinator',
      department: 'Community Donor Outreach',
      phone: '+91 98200 54321',
      status: 'active',
      joinedDate: '2025-06-20',
      lastActive: '1 hour ago',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'staff-4',
      name: 'Dr. Vikram Malhotra',
      email: 'medical@lilavati.org',
      role: 'medical_staff',
      roleLabel: 'Medical Staff',
      department: 'Donor Screening & Phlebotomy',
      phone: '+91 98200 98765',
      status: 'active',
      joinedDate: '2025-08-01',
      lastActive: '2 hours ago',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
    },
  ],

  // Hospital-scoped Blood Requests
  requests: [
    {
      id: 'REQ-8831',
      trackingId: 'LIF-8831',
      bloodGroup: 'O+',
      unitsRequired: 10,
      urgency: 'Emergency',
      requiredDate: '2026-11-24',
      location: 'Emergency OT - Ward 3B',
      patientRef: 'PT-9042 (Trauma Surgery)',
      additionalInstructions: 'Immediate cross-matching for post-accident trauma transfusion.',
      status: 'Partially Fulfilled', // Draft | Active | Partially Fulfilled | Fulfilled | Cancelled | Closed
      createdAt: '2026-11-23 08:30',
      createdBy: 'Rajesh Kadam (Request Manager)',
    },
    {
      id: 'REQ-8840',
      trackingId: 'LIF-8840',
      bloodGroup: 'A+',
      unitsRequired: 4,
      urgency: 'Urgent',
      requiredDate: '2026-11-24',
      location: 'Cardiology ICU - 4th Floor',
      patientRef: 'PT-9055 (CABG Bypass)',
      additionalInstructions: 'Packed red cells required pre-op by 09:00 AM.',
      status: 'Fulfilled',
      createdAt: '2026-11-22 14:10',
      createdBy: 'Rajesh Kadam (Request Manager)',
    },
    {
      id: 'REQ-8845',
      trackingId: 'LIF-8845',
      bloodGroup: 'B-',
      unitsRequired: 3,
      urgency: 'Normal',
      requiredDate: '2026-11-26',
      location: 'Hematology Daycare',
      patientRef: 'PT-9081 (Thalassemia Care)',
      additionalInstructions: 'Leukodepleted units preferred. Regular bi-weekly transfusion.',
      status: 'Active',
      createdAt: '2026-11-23 11:00',
      createdBy: 'Dr. Anita Joshi (Hospital Admin)',
    },
    {
      id: 'REQ-8850',
      trackingId: 'LIF-8850',
      bloodGroup: 'AB-',
      unitsRequired: 2,
      urgency: 'Emergency',
      requiredDate: '2026-11-24',
      location: 'Pediatric ICU - Bed 12',
      patientRef: 'PT-9102 (Dengue Shock)',
      additionalInstructions: 'Platelet concentration needed urgently.',
      status: 'Active',
      createdAt: '2026-11-23 15:45',
      createdBy: 'Rajesh Kadam (Request Manager)',
    },
    {
      id: 'REQ-8862',
      trackingId: 'LIF-8862',
      bloodGroup: 'O-',
      unitsRequired: 5,
      urgency: 'Urgent',
      requiredDate: '2026-11-21',
      location: 'Oncology Surgery Suite',
      patientRef: 'PT-8994 (Whipple Procedure)',
      additionalInstructions: 'Universal donor PRBC required.',
      status: 'Closed',
      createdAt: '2026-11-20 09:00',
      createdBy: 'Dr. Anita Joshi (Hospital Admin)',
    },
    {
      id: 'REQ-8871',
      trackingId: 'LIF-8871',
      bloodGroup: 'B+',
      unitsRequired: 6,
      urgency: 'Normal',
      requiredDate: '2026-11-28',
      location: 'Orthopedics OT 2',
      patientRef: 'PT-9130 (Joint Replacement)',
      additionalInstructions: 'Elective surgery requirement. Donor slots open.',
      status: 'Draft',
      createdAt: '2026-11-23 16:30',
      createdBy: 'Rajesh Kadam (Request Manager)',
    },
  ],

  // Donors responding to this Hospital's requests
  donorResponses: [
    {
      id: 'resp-1',
      requestId: 'REQ-8831',
      bloodGroup: 'O+',
      donorName: 'Dr. Aryan Sharma',
      phone: '+91 98201 11223',
      email: 'donor@lifora.org',
      hasConsent: true,
      responseDate: '2026-11-23 09:15',
      responseStatus: 'Confirmed', // Interested | Contacted | Confirmed | Withdrawn | Not Reachable
      notes: 'Confirmed by phone. Arriving at 14:00 today.',
      contactedBy: 'Sneha Fernandez (Donor Coordinator)',
    },
    {
      id: 'resp-2',
      requestId: 'REQ-8831',
      bloodGroup: 'O+',
      donorName: 'Kavita Menon',
      phone: '+91 98190 22334',
      email: 'kavita.m@example.com',
      hasConsent: true,
      responseDate: '2026-11-23 09:40',
      responseStatus: 'Confirmed',
      notes: 'Completed donation earlier today.',
      contactedBy: 'Sneha Fernandez (Donor Coordinator)',
    },
    {
      id: 'resp-3',
      requestId: 'REQ-8831',
      bloodGroup: 'O+',
      donorName: 'Sanjay Patwardhan',
      phone: '+91 98205 33445',
      email: 'sanjay.p@example.com',
      hasConsent: true,
      responseDate: '2026-11-23 10:20',
      responseStatus: 'Contacted',
      notes: 'Spoke via call. Requested slot after 17:00 due to work.',
      contactedBy: 'Sneha Fernandez (Donor Coordinator)',
    },
    {
      id: 'resp-4',
      requestId: 'REQ-8845',
      bloodGroup: 'B-',
      donorName: 'Sunil Deshmukh',
      phone: '+91 98701 44556',
      email: 'sunil.d@example.com',
      hasConsent: true,
      responseDate: '2026-11-23 11:30',
      responseStatus: 'Interested',
      notes: 'Responded via Lifora App. Needs confirmation on fasting guidelines.',
      contactedBy: null,
    },
    {
      id: 'resp-5',
      requestId: 'REQ-8850',
      bloodGroup: 'AB-',
      donorName: 'Farhan Qureshi',
      phone: '+91 99887 65432',
      email: 'farhan.q@example.com',
      hasConsent: true,
      responseDate: '2026-11-23 16:00',
      responseStatus: 'Confirmed',
      notes: 'Universal plasma donor. Confirmed arrival tomorrow 10:00 AM.',
      contactedBy: 'Sneha Fernandez (Donor Coordinator)',
    },
    {
      id: 'resp-6',
      requestId: 'REQ-8840',
      bloodGroup: 'A+',
      donorName: 'Ritu Sen',
      phone: '+91 98212 99887',
      email: 'ritu.s@example.com',
      hasConsent: false, // Consent masked
      responseDate: '2026-11-22 15:30',
      responseStatus: 'Withdrawn',
      notes: 'Donor caught seasonal fever. Withdrew response voluntarily.',
      contactedBy: 'Sneha Fernandez (Donor Coordinator)',
    },
  ],

  // Donor Arrival Management
  arrivals: [
    {
      id: 'arr-1',
      requestId: 'REQ-8831',
      responseId: 'resp-1',
      donorName: 'Dr. Aryan Sharma',
      bloodGroup: 'O+',
      expectedDate: '2026-11-24',
      expectedTime: '14:00',
      arrivalStatus: 'Expected', // Expected | Arrived | No-show | Cancelled
      receptionPoint: 'Counter 2 - Transfusion Medicine',
      checkInTime: null,
      notes: 'Pre-registered donor. Fast-track screening approved.',
    },
    {
      id: 'arr-2',
      requestId: 'REQ-8831',
      responseId: 'resp-2',
      donorName: 'Kavita Menon',
      bloodGroup: 'O+',
      expectedDate: '2026-11-23',
      expectedTime: '10:30',
      arrivalStatus: 'Arrived',
      receptionPoint: 'Counter 1 - Donor Entry',
      checkInTime: '2026-11-23 10:25',
      notes: 'Arrived on schedule. Directed to Phlebotomy Bay 3.',
    },
    {
      id: 'arr-3',
      requestId: 'REQ-8850',
      responseId: 'resp-5',
      donorName: 'Farhan Qureshi',
      bloodGroup: 'AB-',
      expectedDate: '2026-11-24',
      expectedTime: '10:00',
      arrivalStatus: 'Expected',
      receptionPoint: 'Apheresis Section - 2nd Floor',
      checkInTime: null,
      notes: 'Platelet apheresis scheduled.',
    },
    {
      id: 'arr-4',
      requestId: 'REQ-8845',
      responseId: 'resp-4',
      donorName: 'Sunil Deshmukh',
      bloodGroup: 'B-',
      expectedDate: '2026-11-25',
      expectedTime: '11:00',
      arrivalStatus: 'Expected',
      receptionPoint: 'Counter 2 - Transfusion Medicine',
      checkInTime: null,
      notes: 'Awaiting coordinator final reminder.',
    },
    {
      id: 'arr-5',
      requestId: 'REQ-8840',
      responseId: 'resp-prev-1',
      donorName: 'Meenakshi Sundaram',
      bloodGroup: 'A+',
      expectedDate: '2026-11-22',
      expectedTime: '11:00',
      arrivalStatus: 'Arrived',
      checkInTime: '2026-11-22 10:55',
      receptionPoint: 'Counter 1 - Donor Entry',
      notes: 'Donation completed successfully.',
    },
    {
      id: 'arr-6',
      requestId: 'REQ-8831',
      responseId: 'resp-prev-2',
      donorName: 'Vikramaditya Roy',
      bloodGroup: 'O+',
      expectedDate: '2026-11-22',
      expectedTime: '16:00',
      arrivalStatus: 'No-show',
      checkInTime: null,
      receptionPoint: 'Counter 2',
      notes: 'Did not arrive for appointment. Not reachable on phone.',
    },
  ],

  // Donation Management (Recorded by authorized Medical Staff)
  donations: [
    {
      id: 'don-1',
      requestId: 'REQ-8831',
      arrivalId: 'arr-2',
      donorName: 'Kavita Menon',
      bloodGroup: 'O+',
      outcome: 'Donated', // Donated | Medically Deferred | No-show | Cancelled
      unitsCollected: 1,
      componentType: 'Whole Blood (450 mL)',
      donationDate: '2026-11-23 11:15',
      recordedByStaffId: 'staff-4',
      recordedByStaffName: 'Dr. Vikram Malhotra',
      recordedByStaffRole: 'Medical Staff',
      screeningMetrics: { hb: '13.4 g/dL', bp: '120/80', weight: '62 kg', pulse: '74 bpm' },
      deferralReason: null,
      medicalNotes: 'Standard phlebotomy. Bag ID: WB-LLV-2026-4401. Transferred to component separator.',
    },
    {
      id: 'don-2',
      requestId: 'REQ-8840',
      arrivalId: 'arr-5',
      donorName: 'Meenakshi Sundaram',
      bloodGroup: 'A+',
      outcome: 'Donated',
      unitsCollected: 1,
      componentType: 'Packed Red Cells (PRBC)',
      donationDate: '2026-11-22 11:45',
      recordedByStaffId: 'staff-4',
      recordedByStaffName: 'Dr. Vikram Malhotra',
      recordedByStaffRole: 'Medical Staff',
      screeningMetrics: { hb: '14.1 g/dL', bp: '118/76', weight: '68 kg', pulse: '72 bpm' },
      deferralReason: null,
      medicalNotes: 'Successful PRBC harvest. Unit delivered to Cardiac ICU.',
    },
    {
      id: 'don-3',
      requestId: 'REQ-8840',
      arrivalId: 'arr-prev-3',
      donorName: 'Rahul Deshpande',
      bloodGroup: 'A+',
      outcome: 'Donated',
      unitsCollected: 1,
      componentType: 'Packed Red Cells (PRBC)',
      donationDate: '2026-11-22 13:00',
      recordedByStaffId: 'staff-4',
      recordedByStaffName: 'Dr. Vikram Malhotra',
      recordedByStaffRole: 'Medical Staff',
      screeningMetrics: { hb: '13.9 g/dL', bp: '122/82', weight: '74 kg', pulse: '76 bpm' },
      deferralReason: null,
      medicalNotes: 'Cross-matched unit cleared for surgery.',
    },
    {
      id: 'don-4',
      requestId: 'REQ-8840',
      arrivalId: 'arr-prev-4',
      donorName: 'Deepak Varma',
      bloodGroup: 'A+',
      outcome: 'Donated',
      unitsCollected: 1,
      componentType: 'Packed Red Cells (PRBC)',
      donationDate: '2026-11-22 14:15',
      recordedByStaffId: 'staff-4',
      recordedByStaffName: 'Dr. Vikram Malhotra',
      recordedByStaffRole: 'Medical Staff',
      screeningMetrics: { hb: '14.5 g/dL', bp: '124/80', weight: '80 kg', pulse: '70 bpm' },
      deferralReason: null,
      medicalNotes: 'Unit allocated to bypass surgery pool.',
    },
    {
      id: 'don-5',
      requestId: 'REQ-8840',
      arrivalId: 'arr-prev-5',
      donorName: 'Aarti Pillai',
      bloodGroup: 'A+',
      outcome: 'Donated',
      unitsCollected: 1,
      componentType: 'Packed Red Cells (PRBC)',
      donationDate: '2026-11-22 15:30',
      recordedByStaffId: 'staff-4',
      recordedByStaffName: 'Dr. Vikram Malhotra',
      recordedByStaffRole: 'Medical Staff',
      screeningMetrics: { hb: '13.2 g/dL', bp: '116/74', weight: '58 kg', pulse: '75 bpm' },
      deferralReason: null,
      medicalNotes: 'Final required unit collected. REQ-8840 marked Fulfilled.',
    },
    {
      id: 'don-6',
      requestId: 'REQ-8831',
      arrivalId: 'arr-prev-6',
      donorName: 'Ananya Deshmukh',
      bloodGroup: 'O+',
      outcome: 'Medically Deferred',
      unitsCollected: 0,
      componentType: null,
      donationDate: '2026-11-23 10:00',
      recordedByStaffId: 'staff-4',
      recordedByStaffName: 'Dr. Vikram Malhotra',
      recordedByStaffRole: 'Medical Staff',
      screeningMetrics: { hb: '11.0 g/dL', bp: '110/70', weight: '51 kg', pulse: '82 bpm' },
      deferralReason: 'Low Hemoglobin (11.0 g/dL, clinical minimum 12.5 g/dL required).',
      medicalNotes: 'Temporary 30-day medical deferral issued. Advised dietary iron supplementation.',
    },
    // 5 previous successful donations recorded for REQ-8831 so successful total is 6 units
    {
      id: 'don-7',
      requestId: 'REQ-8831',
      arrivalId: 'arr-prev-7',
      donorName: 'Rohit Shenoy',
      bloodGroup: 'O+',
      outcome: 'Donated',
      unitsCollected: 1,
      componentType: 'Whole Blood (450 mL)',
      donationDate: '2026-11-23 09:30',
      recordedByStaffId: 'staff-4',
      recordedByStaffName: 'Dr. Vikram Malhotra',
      recordedByStaffRole: 'Medical Staff',
      screeningMetrics: { hb: '14.8 g/dL', bp: '120/80', weight: '76 kg', pulse: '72 bpm' },
      deferralReason: null,
      medicalNotes: 'Unit allocated to emergency trauma bank.',
    },
    {
      id: 'don-8',
      requestId: 'REQ-8831',
      arrivalId: 'arr-prev-8',
      donorName: 'Manoj Kumar',
      bloodGroup: 'O+',
      outcome: 'Donated',
      unitsCollected: 1,
      componentType: 'Whole Blood (450 mL)',
      donationDate: '2026-11-23 09:50',
      recordedByStaffId: 'staff-4',
      recordedByStaffName: 'Dr. Vikram Malhotra',
      recordedByStaffRole: 'Medical Staff',
      screeningMetrics: { hb: '13.6 g/dL', bp: '122/78', weight: '69 kg', pulse: '74 bpm' },
      deferralReason: null,
      medicalNotes: 'Unit cross-matched.',
    },
    {
      id: 'don-9',
      requestId: 'REQ-8831',
      arrivalId: 'arr-prev-9',
      donorName: 'Girish Patel',
      bloodGroup: 'O+',
      outcome: 'Donated',
      unitsCollected: 1,
      componentType: 'Whole Blood (450 mL)',
      donationDate: '2026-11-23 10:15',
      recordedByStaffId: 'staff-4',
      recordedByStaffName: 'Dr. Vikram Malhotra',
      recordedByStaffRole: 'Medical Staff',
      screeningMetrics: { hb: '15.1 g/dL', bp: '126/82', weight: '82 kg', pulse: '70 bpm' },
      deferralReason: null,
      medicalNotes: 'Unit cross-matched for surgery.',
    },
    {
      id: 'don-10',
      requestId: 'REQ-8831',
      arrivalId: 'arr-prev-10',
      donorName: 'Alok Nath',
      bloodGroup: 'O+',
      outcome: 'Donated',
      unitsCollected: 1,
      componentType: 'Whole Blood (450 mL)',
      donationDate: '2026-11-23 10:40',
      recordedByStaffId: 'staff-4',
      recordedByStaffName: 'Dr. Vikram Malhotra',
      recordedByStaffRole: 'Medical Staff',
      screeningMetrics: { hb: '14.0 g/dL', bp: '118/78', weight: '71 kg', pulse: '72 bpm' },
      deferralReason: null,
      medicalNotes: 'Pre-transfusion serology tests negative.',
    },
    {
      id: 'don-11',
      requestId: 'REQ-8831',
      arrivalId: 'arr-prev-11',
      donorName: 'Prakash Rao',
      bloodGroup: 'O+',
      outcome: 'Donated',
      unitsCollected: 1,
      componentType: 'Whole Blood (450 mL)',
      donationDate: '2026-11-23 11:00',
      recordedByStaffId: 'staff-4',
      recordedByStaffName: 'Dr. Vikram Malhotra',
      recordedByStaffRole: 'Medical Staff',
      screeningMetrics: { hb: '14.2 g/dL', bp: '120/80', weight: '65 kg', pulse: '76 bpm' },
      deferralReason: null,
      medicalNotes: 'Collected and dispatched to OT.',
    },
  ],

  // Hospital Notifications
  notifications: [
    {
      id: 'hnotif-1',
      title: 'Donor Confirmed for REQ-8831 (O+)',
      message: 'Dr. Aryan Sharma confirmed appointment for today 14:00 at Counter 2.',
      category: 'Arrivals', // Requests | Responses | Arrivals | Donations | System
      priority: 'Normal',
      read: false,
      timestamp: '25 mins ago',
      date: '2026-11-23 11:30',
    },
    {
      id: 'hnotif-2',
      title: 'Emergency Blood Request Broadcast Active',
      message: 'REQ-8850 (AB- 2 units) broadcast to 18 verified donors within 15 km.',
      category: 'Requests',
      priority: 'Urgent',
      read: false,
      timestamp: '1 hour ago',
      date: '2026-11-23 11:00',
    },
    {
      id: 'hnotif-3',
      title: 'Donation Completed: Kavita Menon',
      message: '1 unit O+ Whole Blood collected by Dr. Vikram Malhotra for REQ-8831.',
      category: 'Donations',
      priority: 'Normal',
      read: true,
      timestamp: '2 hours ago',
      date: '2026-11-23 10:00',
    },
    {
      id: 'hnotif-4',
      title: 'NABH Blood Bank Audit Scheduled',
      message: 'Annual quality and hemovigilance inspection scheduled for next Monday.',
      category: 'System',
      priority: 'Normal',
      read: true,
      timestamp: '1 day ago',
      date: '2026-11-22 09:00',
    },
  ],

  // Audit Logs
  auditLogs: [
    {
      id: 'log-1',
      action: 'Donation Outcome Recorded',
      actor: 'Dr. Vikram Malhotra (Medical Staff)',
      target: 'Kavita Menon (O+) • Unit WB-4401',
      time: 'Today, 11:15',
    },
    {
      id: 'log-2',
      action: 'Donor Arrival Confirmed',
      actor: 'Sneha Fernandez (Donor Coordinator)',
      target: 'Kavita Menon • Check-in at Counter 1',
      time: 'Today, 10:25',
    },
    {
      id: 'log-3',
      action: 'Emergency Request Created',
      actor: 'Rajesh Kadam (Request Manager)',
      target: 'REQ-8850 (AB- • 2 Units)',
      time: 'Today, 08:30',
    },
    {
      id: 'log-4',
      action: 'Staff Role Updated',
      actor: 'Dr. Anita Joshi (Hospital Admin)',
      target: 'Sneha Fernandez promoted to Lead Coordinator',
      time: 'Yesterday, 16:40',
    },
  ],
};

// LocalStorage helpers
export const getStoredHospitalData = () => {
  const stored = localStorage.getItem(HOSPITAL_DATA_KEY);
  if (!stored) {
    localStorage.setItem(HOSPITAL_DATA_KEY, JSON.stringify(INITIAL_HOSPITAL_DATA));
    return INITIAL_HOSPITAL_DATA;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_HOSPITAL_DATA;
  }
};

export const saveStoredHospitalData = (data) => {
  localStorage.setItem(HOSPITAL_DATA_KEY, JSON.stringify(data));
};

// ROLE-BASED ACCESS CONTROL (RBAC) DEFINITIONS
export const STAFF_ROLES = {
  hospital_admin: {
    label: 'Hospital Admin',
    description: 'Full administrative access: staff management, hospital profile, all operations.',
    permissions: [
      'view_dashboard',
      'manage_requests',
      'manage_donors',
      'manage_arrivals',
      'record_donations',
      'track_requirements',
      'manage_staff',
      'manage_profile',
      'view_reports',
      'manage_settings',
    ],
  },
  request_manager: {
    label: 'Request Manager',
    description: 'Creates and manages blood requirements, tracks fulfillment, views analytics.',
    permissions: [
      'view_dashboard',
      'manage_requests',
      'track_requirements',
      'view_reports',
      'view_profile',
      'manage_settings',
    ],
  },
  donor_coordinator: {
    label: 'Donor Coordinator',
    description: 'Contacts donors, schedules appointments, and confirms donor arrivals.',
    permissions: [
      'view_dashboard',
      'view_requests',
      'manage_donors',
      'manage_arrivals',
      'view_profile',
      'manage_settings',
    ],
  },
  medical_staff: {
    label: 'Medical Staff',
    description: 'Authorized medical personnel: records donation outcomes & confidential deferrals.',
    permissions: [
      'view_dashboard',
      'view_arrivals',
      'record_donations',
      'track_requirements',
      'view_profile',
      'manage_settings',
    ],
  },
};

export const hasPermission = (staffRole, permission) => {
  if (!staffRole) return false;
  const roleConfig = STAFF_ROLES[staffRole];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
};

// Service API layer for Hospital Management Portal
export const hospitalPortalService = {
  // Get all hospital state
  async getHospitalState() {
    await simulatedDelay(100);
    return getStoredHospitalData();
  },

  // Reset demo state
  resetHospitalState() {
    localStorage.setItem(HOSPITAL_DATA_KEY, JSON.stringify(INITIAL_HOSPITAL_DATA));
    return INITIAL_HOSPITAL_DATA;
  },

  // 1. BLOOD REQUEST MANAGEMENT
  async createRequest(payload, staffMember) {
    const data = getStoredHospitalData();
    const reqNumber = Math.floor(1000 + Math.random() * 9000);
    let trackingCode = `LIF-${reqNumber}`;

    // Attempt backend sync
    try {
      const res = await api.post('/requests', {
        bloodGroup: payload.bloodGroup,
        unitsRequired: parseInt(payload.unitsRequired, 10) || 1,
        urgency: payload.urgency || 'Normal',
        requiredDate: payload.requiredDate || new Date().toISOString().split('T')[0],
        locationDescription: payload.location || 'Central Blood Bank Desk',
        patientName: payload.patientRef || 'Clinical Requisition',
        additionalInstructions: payload.additionalInstructions || 'Standard cross-match requested.',
        hospitalId: staffMember?.hospitalId || data.profile?.id || 'hosp-1',
      });
      if (res.data?.success && res.data.data) {
        trackingCode = res.data.data.trackingId || res.data.data.trackingCode || trackingCode;
      }
    } catch (e) {
      console.warn('Backend /requests creation fallback to local:', e.message);
    }

    const newReq = {
      id: `REQ-${reqNumber}`,
      trackingId: trackingCode,
      bloodGroup: payload.bloodGroup,
      unitsRequired: parseInt(payload.unitsRequired, 10) || 1,
      urgency: payload.urgency || 'Normal',
      requiredDate: payload.requiredDate || new Date().toISOString().split('T')[0],
      location: payload.location || 'Central Blood Bank Desk',
      patientRef: payload.patientRef || 'Clinical Requisition',
      additionalInstructions: payload.additionalInstructions || 'Standard cross-match requested.',
      status: payload.status || 'Active',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      createdBy: `${staffMember?.name || 'Staff'} (${staffMember?.roleLabel || 'Staff'})`,
    };

    data.requests.unshift(newReq);

    // Sync to public/recipient blood requests store as well
    try {
      const allRequests = getStoredRequests();
      allRequests.unshift({
        ...newReq,
        hospitalName: data.profile?.name || 'Hospital Transfusion Centre',
        hospitalLocation: newReq.location,
        city: data.profile?.city || 'Mumbai',
        distanceKm: '1.2',
        donorResponses: 0,
        acceptedDonors: [],
        timeline: [
          { step: 1, title: 'Request Submitted', time: 'Just now', done: true },
          { step: 2, title: 'Donors Notified', time: 'Active', done: true, detail: 'Hospital requisition broadcasted' },
          { step: 3, title: 'Donor Responses Received', time: 'Awaiting', done: false, detail: 'Collecting donor confirmations' },
          { step: 4, title: 'Hospital Coordination', time: 'Pending', done: false, detail: 'Clinical phlebotomy & storage' },
        ],
      });
      saveStoredRequests(allRequests);
    } catch (syncErr) {
      console.warn('Sync to requests store error:', syncErr.message);
    }

    // Add notification
    data.notifications.unshift({
      id: `hnotif-${Date.now()}`,
      title: `New Blood Request Created (${newReq.bloodGroup})`,
      message: `${newReq.unitsRequired} units requested for ${newReq.location} (${newReq.urgency}).`,
      category: 'Requests',
      priority: newReq.urgency === 'Emergency' ? 'Urgent' : 'Normal',
      read: false,
      timestamp: 'Just now',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });

    // Add audit log
    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: 'Blood Request Created',
      actor: `${staffMember?.name || 'Staff'} (${staffMember?.roleLabel || 'Staff'})`,
      target: `${newReq.id} • ${newReq.bloodGroup} (${newReq.unitsRequired} Units)`,
      time: 'Just now',
    });

    saveStoredHospitalData(data);
    return newReq;
  },

  async updateRequest(id, updates, staffMember) {
    await simulatedDelay(250);
    const data = getStoredHospitalData();
    data.requests = data.requests.map((r) => {
      if (r.id === id) {
        return { ...r, ...updates };
      }
      return r;
    });

    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: 'Blood Request Updated',
      actor: `${staffMember?.name || 'Staff'}`,
      target: `${id} (Status: ${updates.status || 'Updated'})`,
      time: 'Just now',
    });

    saveStoredHospitalData(data);
    return true;
  },

  async closeRequest(id, staffMember) {
    await simulatedDelay(200);
    const data = getStoredHospitalData();
    data.requests = data.requests.map((r) => {
      if (r.id === id) {
        return { ...r, status: 'Closed' };
      }
      return r;
    });

    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: 'Blood Request Closed',
      actor: `${staffMember?.name || 'Staff'}`,
      target: `${id}`,
      time: 'Just now',
    });

    saveStoredHospitalData(data);
    return true;
  },

  // 2. DONOR MANAGEMENT
  async updateDonorResponseStatus(responseId, newStatus, notes, staffMember) {
    await simulatedDelay(200);
    const data = getStoredHospitalData();
    data.donorResponses = data.donorResponses.map((d) => {
      if (d.id === responseId) {
        return {
          ...d,
          responseStatus: newStatus,
          notes: notes !== undefined ? notes : d.notes,
          contactedBy: `${staffMember?.name} (${staffMember?.roleLabel})`,
        };
      }
      return d;
    });

    saveStoredHospitalData(data);
    return true;
  },

  // 3. DONOR ARRIVAL MANAGEMENT
  async updateArrivalStatus(arrivalId, status, checkInTime, notes, staffMember) {
    await simulatedDelay(200);
    const data = getStoredHospitalData();
    data.arrivals = data.arrivals.map((arr) => {
      if (arr.id === arrivalId) {
        return {
          ...arr,
          arrivalStatus: status,
          checkInTime: status === 'Arrived' ? (checkInTime || new Date().toISOString().replace('T', ' ').substring(0, 16)) : arr.checkInTime,
          notes: notes || arr.notes,
        };
      }
      return arr;
    });

    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: `Arrival Status Updated: ${status}`,
      actor: `${staffMember?.name} (${staffMember?.roleLabel})`,
      target: `Arrival #${arrivalId}`,
      time: 'Just now',
    });

    saveStoredHospitalData(data);
    return true;
  },

  // Schedule new arrival
  async scheduleArrival(payload, staffMember) {
    await simulatedDelay(250);
    const data = getStoredHospitalData();
    const newArrival = {
      id: `arr-${Date.now()}`,
      requestId: payload.requestId,
      responseId: payload.responseId || null,
      donorName: payload.donorName,
      bloodGroup: payload.bloodGroup,
      expectedDate: payload.expectedDate,
      expectedTime: payload.expectedTime,
      arrivalStatus: 'Expected',
      receptionPoint: payload.receptionPoint || 'Counter 2 - Transfusion Medicine',
      checkInTime: null,
      notes: payload.notes || 'Appointment scheduled by donor coordinator.',
    };

    data.arrivals.unshift(newArrival);
    saveStoredHospitalData(data);
    return newArrival;
  },

  // 4. DONATION OUTCOME MANAGEMENT (Restricted to Medical Staff)
  async recordDonationOutcome(payload, staffMember) {
    await simulatedDelay(300);
    const data = getStoredHospitalData();

    const isDonated = payload.outcome === 'Donated';
    const units = isDonated ? (parseInt(payload.unitsCollected, 10) || 1) : 0;

    const newDonation = {
      id: `don-${Date.now()}`,
      requestId: payload.requestId,
      arrivalId: payload.arrivalId || null,
      donorName: payload.donorName,
      bloodGroup: payload.bloodGroup,
      outcome: payload.outcome, // Donated | Medically Deferred | No-show | Cancelled
      unitsCollected: units,
      componentType: isDonated ? (payload.componentType || 'Whole Blood (450 mL)') : null,
      donationDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      recordedByStaffId: staffMember?.id || 'staff-4',
      recordedByStaffName: staffMember?.name || 'Dr. Vikram Malhotra',
      recordedByStaffRole: staffMember?.roleLabel || 'Medical Staff',
      screeningMetrics: payload.screeningMetrics || { hb: '13.5 g/dL', bp: '120/80', weight: '65 kg', pulse: '75 bpm' },
      deferralReason: payload.outcome === 'Medically Deferred' ? payload.deferralReason : null,
      medicalNotes: payload.medicalNotes || 'Screening and assessment completed.',
    };

    data.donations.unshift(newDonation);

    // If linked to an arrival, update that arrival's status
    if (payload.arrivalId) {
      data.arrivals = data.arrivals.map((arr) => {
        if (arr.id === payload.arrivalId) {
          return {
            ...arr,
            arrivalStatus: isDonated ? 'Arrived' : (payload.outcome === 'No-show' ? 'No-show' : arr.arrivalStatus),
            donationRecorded: true,
          };
        }
        return arr;
      });
    }

    // Check requirement fulfilment progress
    if (payload.requestId && isDonated) {
      // Calculate total successful units for this request
      const totalSuccessfulUnits = data.donations
        .filter((d) => d.requestId === payload.requestId && d.outcome === 'Donated')
        .reduce((sum, d) => sum + (d.unitsCollected || 1), 0);

      data.requests = data.requests.map((r) => {
        if (r.id === payload.requestId) {
          if (totalSuccessfulUnits >= r.unitsRequired) {
            return { ...r, status: 'Fulfilled' };
          } else if (totalSuccessfulUnits > 0) {
            return { ...r, status: 'Partially Fulfilled' };
          }
        }
        return r;
      });
    }

    // Add Audit log
    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: `Donation Outcome Recorded: ${payload.outcome}`,
      actor: `${staffMember?.name} (${staffMember?.roleLabel})`,
      target: `${payload.donorName} (${payload.bloodGroup}) • ${units} Unit(s)`,
      time: 'Just now',
    });

    saveStoredHospitalData(data);
    return newDonation;
  },

  // 5. REQUIREMENT TRACKING COMPUTATIONS
  getRequirementTracking(requests, arrivals, donations) {
    return requests.map((req) => {
      const required = req.unitsRequired;
      
      // Strict rule from Section 9:
      // "Do not count donor responses or confirmed arrivals as successful donations.
      // Only count recorded successful donations toward fulfilled quantity."
      const successfulDonationsCount = donations
        .filter((d) => d.requestId === req.id && d.outcome === 'Donated')
        .reduce((sum, d) => sum + (d.unitsCollected || 1), 0);

      const confirmedArrivalsCount = arrivals
        .filter((arr) => arr.requestId === req.id && (arr.arrivalStatus === 'Expected' || arr.arrivalStatus === 'Arrived'))
        .length;

      const remaining = Math.max(0, required - successfulDonationsCount);
      const percentage = Math.min(100, Math.round((successfulDonationsCount / required) * 100));

      return {
        ...req,
        requiredUnits: required,
        confirmedDonors: confirmedArrivalsCount,
        successfulDonations: successfulDonationsCount,
        remainingUnits: remaining,
        fulfilmentPercentage: percentage,
      };
    });
  },

  // 6. STAFF MANAGEMENT (Hospital Admin Only)
  async addStaff(payload, currentAdmin) {
    await simulatedDelay(300);
    const data = getStoredHospitalData();

    const roleConfig = STAFF_ROLES[payload.role] || STAFF_ROLES.donor_coordinator;

    const newStaff = {
      id: `staff-${Date.now()}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: payload.role,
      roleLabel: roleConfig.label,
      department: payload.department?.trim() || 'Blood Bank Services',
      phone: payload.phone?.trim() || '+91 98200 00000',
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    };

    data.staff.push(newStaff);

    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: 'Staff Member Invited',
      actor: `${currentAdmin?.name} (Hospital Admin)`,
      target: `${newStaff.name} (${newStaff.roleLabel})`,
      time: 'Just now',
    });

    saveStoredHospitalData(data);
    return newStaff;
  },

  async updateStaffRole(staffId, newRole, currentAdmin) {
    await simulatedDelay(250);
    const data = getStoredHospitalData();
    const roleConfig = STAFF_ROLES[newRole] || STAFF_ROLES.donor_coordinator;

    data.staff = data.staff.map((s) => {
      if (s.id === staffId) {
        return {
          ...s,
          role: newRole,
          roleLabel: roleConfig.label,
        };
      }
      return s;
    });

    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: 'Staff Role Modified',
      actor: `${currentAdmin?.name} (Hospital Admin)`,
      target: `Staff #${staffId} reassigned to ${roleConfig.label}`,
      time: 'Just now',
    });

    saveStoredHospitalData(data);
    return true;
  },

  async toggleStaffStatus(staffId, currentAdmin) {
    await simulatedDelay(200);
    const data = getStoredHospitalData();
    let newStatus = 'active';

    data.staff = data.staff.map((s) => {
      if (s.id === staffId) {
        newStatus = s.status === 'active' ? 'inactive' : 'active';
        return { ...s, status: newStatus };
      }
      return s;
    });

    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: `Staff Account ${newStatus === 'active' ? 'Reactivated' : 'Deactivated'}`,
      actor: `${currentAdmin?.name} (Hospital Admin)`,
      target: `Staff #${staffId}`,
      time: 'Just now',
    });

    saveStoredHospitalData(data);
    return newStatus;
  },

  async removeStaff(staffId, currentAdmin) {
    await simulatedDelay(250);
    const data = getStoredHospitalData();
    const staffMember = data.staff.find((s) => s.id === staffId);
    if (!staffMember) throw new Error('Staff member not found.');

    data.staff = data.staff.filter((s) => s.id !== staffId);

    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: 'Staff Member Removed',
      actor: `${currentAdmin?.name || 'Hospital Admin'} (Hospital Admin)`,
      target: `${staffMember.name} (${staffMember.roleLabel || staffMember.role})`,
      time: 'Just now',
    });

    saveStoredHospitalData(data);
    return true;
  },

  // 7. HOSPITAL PROFILE (Hospital Admin Only)
  async updateProfile(updates, currentAdmin) {
    await simulatedDelay(300);
    const data = getStoredHospitalData();

    // Verification status CANNOT be changed by hospital users (only Super Admin)
    const { verificationStatus, ...allowedUpdates } = updates;

    data.profile = {
      ...data.profile,
      ...allowedUpdates,
    };

    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: 'Hospital Profile Updated',
      actor: `${currentAdmin?.name} (Hospital Admin)`,
      target: data.profile.name,
      time: 'Just now',
    });

    saveStoredHospitalData(data);
    return data.profile;
  },
};
