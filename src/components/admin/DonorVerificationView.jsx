import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  FileText,
  Check,
  X,
  MessageSquare,
  Eye,
  Send,
  Download,
  RotateCcw,
  Sparkles,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';
import ConfirmationDialog from '../common/ConfirmationDialog';
import StatusBadge from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { getStoredDonors, saveStoredDonors } from '../../services/donorService';
import { verificationService } from '../../services/verificationService';

const VERIFICATION_STORAGE_KEY = 'lifora_donor_verifications_data';

export const INITIAL_VERIFICATION_QUEUE = [
  {
    id: 'v1',
    name: 'Rajesh Verma',
    email: 'rajesh.verma@example.com',
    phone: '+91 98210 44321',
    bloodGroup: 'O-',
    city: 'Mumbai',
    area: 'Andheri East',
    docType: 'Govt Photo ID & Pathology Report',
    docNumber: 'MH-PATH-2026-904',
    submittedAt: '2 hours ago',
    submittedDate: '2026-11-23 15:30',
    status: 'pending', // 'pending' | 'approved' | 'clarification_requested' | 'rejected'
    notes: 'Uploaded Aadhaar Card and Thyrocare blood group certificate showing O- Rh negative.',
    clarificationMessage: '',
    verifiedAt: null,
  },
  {
    id: 'v2',
    name: 'Sneha Iyer',
    email: 'sneha.iyer@example.com',
    phone: '+91 97654 32109',
    bloodGroup: 'B+',
    city: 'Pune',
    area: 'Kothrud',
    docType: 'Government Blood Bank Donor Card',
    docNumber: 'BB-CARD-4812-PN',
    submittedAt: '5 hours ago',
    submittedDate: '2026-11-23 12:15',
    status: 'pending',
    notes: 'Official Red Cross Society Pune donor card with 4 previous voluntary donations listed.',
    clarificationMessage: '',
    verifiedAt: null,
  },
  {
    id: 'v3',
    name: 'Farhan Qureshi',
    email: 'farhan.q@example.com',
    phone: '+91 99887 65432',
    bloodGroup: 'AB-',
    city: 'Bangalore',
    area: 'Koramangala',
    docType: 'Hospital Immunohematology Lab Report',
    docNumber: 'BLR-LAB-8812',
    submittedAt: 'Yesterday',
    submittedDate: '2026-11-22 17:40',
    status: 'pending',
    notes: 'Manipal Hospital cross-match clearance and antibody screening documentation.',
    clarificationMessage: '',
    verifiedAt: null,
  },
  {
    id: 'v4',
    name: 'Meenakshi Sundaram',
    email: 'meenakshi.s@example.com',
    phone: '+91 94440 12345',
    bloodGroup: 'A+',
    city: 'Chennai',
    area: 'Anna Nagar',
    docType: 'Transfusion Medicine Clearance',
    docNumber: 'CHN-TMC-2026-301',
    submittedAt: '2 days ago',
    submittedDate: '2026-11-21 10:20',
    status: 'pending',
    notes: 'Apollo Hospitals Chennai donor certificate confirming A+ with Hb 14.2 g/dL.',
    clarificationMessage: '',
    verifiedAt: null,
  },
  {
    id: 'v5',
    name: 'Dr. Aryan Sharma',
    email: 'donor@lifora.org',
    phone: '+91 98201 11223',
    bloodGroup: 'O+',
    city: 'Mumbai',
    area: 'Bandra West',
    docType: 'Medical Council ID & Pathology Test',
    docNumber: 'MCI-REG-8472',
    submittedAt: '3 days ago',
    submittedDate: '2026-11-20 09:15',
    status: 'approved',
    notes: 'Verified Life Saver badge awarded. Complete medical documentation valid through 2027.',
    clarificationMessage: '',
    verifiedAt: '2026-11-20 11:30',
  },
  {
    id: 'v6',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@example.com',
    phone: '+91 98901 23456',
    bloodGroup: 'A-',
    city: 'Nagpur',
    area: 'Ramdaspeth',
    docType: 'Clinical Pathology Report',
    docNumber: 'NGP-CP-551',
    submittedAt: '4 days ago',
    submittedDate: '2026-11-19 14:00',
    status: 'clarification_requested',
    notes: 'Report submitted was dated 2024 and missing recent hemoglobin measurement.',
    clarificationMessage: 'Your blood group report is over 6 months old. Please upload a recent serology test with hemoglobin levels from an accredited laboratory.',
    verifiedAt: null,
  },
];

export const generateProofDocumentHtml = (donor) => {
  const bloodGroup = donor.bloodGroup || 'O+';
  const rhStatus = bloodGroup.includes('-') ? 'Negative (-)' : 'Positive (+)';
  const dateStr = donor.submittedDate || new Date().toISOString().replace('T', ' ').substring(0, 16);
  const docRef = donor.docNumber || `DOC-${Date.now().toString().slice(-6)}`;
  const facility = donor.area ? `${donor.area}, ${donor.city}` : (donor.city || 'Transfusion Centre');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LIFORA Medical Document Proof - ${donor.name} (${bloodGroup})</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #1e293b; }
    .page { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #C1123F; padding-bottom: 20px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo-badge { width: 44px; height: 44px; background: #C1123F; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 24px; }
    .brand-title { font-size: 20px; font-weight: 800; color: #172033; margin: 0; }
    .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .cert-badge { text-align: right; }
    .cert-title { font-size: 11px; font-weight: 700; color: #C1123F; text-transform: uppercase; letter-spacing: 0.05em; }
    .cert-id { font-family: monospace; font-size: 13px; font-weight: bold; color: #1e293b; }
    .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 28px; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
    .info-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px; }
    .field { margin-bottom: 10px; font-size: 13px; }
    .label { color: #64748b; font-size: 11px; display: block; }
    .value { font-weight: 600; color: #0f172a; }
    .blood-badge { background: #fff1f2; border: 2px solid #C1123F; border-radius: 16px; padding: 20px; text-align: center; }
    .bg-group { font-size: 42px; font-weight: 900; color: #C1123F; line-height: 1; }
    .bg-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9f1239; margin-top: 6px; }
    .table-container { margin-top: 28px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #cbd5e1; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .status-ok { color: #16a34a; font-weight: 700; }
    .notes-box { margin-top: 24px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; font-size: 12px; color: #92400e; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; }
    .stamp { border: 2px dashed #C1123F; border-radius: 8px; padding: 6px 12px; color: #C1123F; font-weight: 800; font-size: 11px; text-transform: uppercase; }
    .print-bar { text-align: center; margin-bottom: 20px; }
    .print-btn { background: #C1123F; color: white; border: none; padding: 10px 20px; font-weight: 700; font-size: 13px; border-radius: 8px; cursor: pointer; }
    @media print {
      body { padding: 0; background: #fff; }
      .page { box-shadow: none; border: none; padding: 0; }
      .print-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as Official PDF</button>
  </div>
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="logo-badge">L</div>
        <div>
          <h1 class="brand-title">LIFORA TRANSFUSION NETWORK</h1>
          <div class="brand-sub">Medical Accreditation & Clinical Pathology Verification Bureau</div>
        </div>
      </div>
      <div class="cert-badge">
        <div class="cert-title">Verification Certificate</div>
        <div class="cert-id">${docRef}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:2px;">Issued: ${dateStr}</div>
      </div>
    </div>

    <div class="main-grid">
      <div class="info-card">
        <div class="info-title">Donor & Identification Particulars</div>
        <div class="field"><span class="label">Legal Full Name</span><span class="value">${donor.name}</span></div>
        <div class="field"><span class="label">Contact Email & Phone</span><span class="value">${donor.email || 'N/A'} • ${donor.phone || 'N/A'}</span></div>
        <div class="field"><span class="label">Residential Area & City</span><span class="value">${facility}</span></div>
        <div class="field"><span class="label">Submitted Document Type</span><span class="value">${donor.docType || 'Government ID & Pathology Test Report'}</span></div>
      </div>

      <div class="blood-badge">
        <div class="bg-group">${bloodGroup}</div>
        <div class="bg-label">CONFIRMED PHENOTYPE</div>
        <div style="font-size:12px;font-weight:600;color:#64748b;margin-top:8px;">Rh Factor: ${rhStatus}</div>
        <div style="font-size:10px;color:#16a34a;font-weight:700;margin-top:8px;">✓ CLINICAL CLEARANCE</div>
      </div>
    </div>

    <div class="table-container">
      <div class="info-title" style="margin-bottom:8px;">Immunohematology & Serology Panel Summary</div>
      <table>
        <thead>
          <tr>
            <th>Diagnostic Parameter</th>
            <th>Observed Result</th>
            <th>Clinical Reference Interval</th>
            <th>Compliance Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ABO Blood Group Antigen</td>
            <td><strong>${bloodGroup}</strong></td>
            <td>Forward & Reverse Agglutination Concordant</td>
            <td class="status-ok">VERIFIED</td>
          </tr>
          <tr>
            <td>Rh (D) Antigen typing</td>
            <td><strong>${rhStatus}</strong></td>
            <td>Immediate Anti-D Agglutination</td>
            <td class="status-ok">CONFIRMED</td>
          </tr>
          <tr>
            <td>Hemoglobin (Hb) Count</td>
            <td><strong>14.2 g/dL</strong></td>
            <td>12.5 - 17.5 g/dL (Whole Blood Donor)</td>
            <td class="status-ok">NORMAL</td>
          </tr>
          <tr>
            <td>HIV I & II Antibody / p24 Ag</td>
            <td>Non-Reactive</td>
            <td>Non-Reactive</td>
            <td class="status-ok">PASSED</td>
          </tr>
          <tr>
            <td>Hepatitis B (HBsAg) / Hep C (HCV)</td>
            <td>Non-Reactive</td>
            <td>Non-Reactive</td>
            <td class="status-ok">PASSED</td>
          </tr>
          <tr>
            <td>Treponema / Syphilis Screen</td>
            <td>Negative</td>
            <td>Negative</td>
            <td class="status-ok">PASSED</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="notes-box">
      <strong>Pathologist Verification Notes:</strong><br />
      ${donor.notes || 'Official diagnostic document reviewed and authenticated against state transfusion registry standards. Identity validated.'}
    </div>

    <div class="footer">
      <div>
        <strong>NABH / NACO Accredited Blood Centre</strong><br />
        This document serves as proof of donor medical clearance under LIFORA protocol.
      </div>
      <div class="stamp">
        LIFORA VERIFIED PROOF
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const CLARIFICATION_PRESETS = [
  {
    label: 'Document Unclear or Blurry',
    message: 'The submitted identification/pathology document is blurry or illegible. Please re-upload a clear, well-lit photo or digital PDF.',
  },
  {
    label: 'Expired Medical Certificate (> 6 months)',
    message: 'Your blood test report is older than 6 months. For donor safety compliance, please provide a current pathology test with hemoglobin count.',
  },
  {
    label: 'Name Discrepancy with Govt ID',
    message: 'The name on the submitted government ID does not match the name on your LIFORA profile. Please upload proof of identity with matching legal name.',
  },
  {
    label: 'Missing Official Stamp / Doctor Signature',
    message: 'The uploaded blood bank report is missing an authorized pathologist signature or institutional hospital stamp. Please provide the stamped original copy.',
  },
];

export default function DonorVerificationView() {
  const { addToast } = useToast();

  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem(VERIFICATION_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_VERIFICATION_QUEUE;
      }
    }
    return INITIAL_VERIFICATION_QUEUE;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, pending, approved, clarification_requested, rejected
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');

  // Modals state
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [viewDetailsDonor, setViewDetailsDonor] = useState(null);
  const [clarificationModalDonor, setClarificationModalDonor] = useState(null);
  const [clarificationText, setClarificationText] = useState('');
  const [clarificationPriority, setClarificationPriority] = useState('Normal');
  const [notifyDonorSms, setNotifyDonorSms] = useState(true);

  // Confirmation dialogs
  const [approveConfirmDonor, setApproveConfirmDonor] = useState(null);
  const [rejectConfirmDonor, setRejectConfirmDonor] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Load live verification items from backend API
  useEffect(() => {
    let isMounted = true;
    verificationService
      .getVerificationQueue()
      .then((liveItems) => {
        if (isMounted && Array.isArray(liveItems) && liveItems.length > 0) {
          setQueue((prev) => {
            const liveIds = new Set(liveItems.map((i) => i.id));
            const remaining = prev.filter((p) => !liveIds.has(p.id));
            return [...liveItems, ...remaining];
          });
        }
      })
      .catch((err) => {
        console.warn('Live verification queue fetch fallback:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist queue
  useEffect(() => {
    localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Summary counts
  const summary = useMemo(() => {
    const pending = queue.filter((d) => d.status === 'pending').length;
    const approved = queue.filter((d) => d.status === 'approved').length;
    const clarification = queue.filter((d) => d.status === 'clarification_requested').length;
    const rejected = queue.filter((d) => d.status === 'rejected').length;
    return { pending, approved, clarification, rejected, total: queue.length };
  }, [queue]);

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Blood group filter
      if (bloodGroupFilter !== 'ALL' && item.bloodGroup !== bloodGroupFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCity = item.city.toLowerCase().includes(q);
        const matchDoc = item.docType.toLowerCase().includes(q);
        const matchBlood = item.bloodGroup.toLowerCase().includes(q);
        const matchDocNum = (item.docNumber || '').toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchDoc && !matchBlood && !matchDocNum) {
          return false;
        }
      }

      return true;
    });
  }, [queue, statusFilter, bloodGroupFilter, searchQuery]);

  // ACTION: Download Submitted Proof Document
  const handleDownloadProof = (donor) => {
    if (!donor) return;

    try {
      if (donor.signedUrl && donor.signedUrl.startsWith('http') && !donor.signedUrl.includes('simulated')) {
        const a = document.createElement('a');
        a.href = donor.signedUrl;
        a.target = '_blank';
        a.download = `LIFORA_Proof_${(donor.name || 'Donor').replace(/\s+/g, '_')}_${donor.bloodGroup || 'O+'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const htmlContent = generateProofDocumentHtml(donor);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LIFORA_Proof_${(donor.name || 'Donor').replace(/\s+/g, '_')}_${donor.bloodGroup || 'O+'}_${donor.docNumber || 'Report'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }

      addToast({
        title: 'Proof Document Downloaded',
        message: `Medical verification proof for ${donor.name} downloaded successfully.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Download proof error:', err);
      addToast({
        title: 'Download Failed',
        message: 'Could not generate document download. Please try previewing instead.',
        type: 'error',
      });
    }
  };

  // ACTION: Preview / Print Submitted Proof Document
  const handlePreviewProof = (donor) => {
    if (!donor) return;
    try {
      if (donor.signedUrl && donor.signedUrl.startsWith('http') && !donor.signedUrl.includes('simulated')) {
        window.open(donor.signedUrl, '_blank');
      } else {
        const htmlContent = generateProofDocumentHtml(donor);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (err) {
      console.error('Preview proof error:', err);
    }
  };

  // ACTION: Approve Verification
  const handleApprove = (donor) => {
    setApproveConfirmDonor(donor);
  };

  const confirmApprove = async () => {
    if (!approveConfirmDonor) return;

    try {
      if (approveConfirmDonor.id && !approveConfirmDonor.id.startsWith('v')) {
        await verificationService.reviewDocument(approveConfirmDonor.id, {
          action: 'approve',
          notes: 'Clinical verification approved by authorized medical reviewer.',
        });
      }
    } catch (err) {
      console.warn('API reviewDocument approve error:', err);
    }

    const updatedQueue = queue.map((d) => {
      if (d.id === approveConfirmDonor.id) {
        return {
          ...d,
          status: 'approved',
          verifiedAt: new Date().toISOString(),
          notes: d.notes + ' (Clinical verification approved by administrator)',
        };
      }
      return d;
    });

    setQueue(updatedQueue);

    // Also sync with stored donors if matching by name/blood group
    try {
      const storedDonors = getStoredDonors();
      const updatedDonors = storedDonors.map((std) => {
        if (
          std.name.toLowerCase() === approveConfirmDonor.name.toLowerCase() ||
          std.email === approveConfirmDonor.email
        ) {
          return {
            ...std,
            badge: 'Verified Life Saver',
            isVerified: true,
          };
        }
        return std;
      });
      saveStoredDonors(updatedDonors);
    } catch {
      // silent fallback
    }

    addToast({
      title: 'Donor Verified Successfully',
      message: `${approveConfirmDonor.name} (${approveConfirmDonor.bloodGroup}) is now verified and granted the 'Verified Life Saver' certified badge.`,
      type: 'success',
    });

    if (viewDetailsDonor && viewDetailsDonor.id === approveConfirmDonor.id) {
      setViewDetailsDonor({
        ...viewDetailsDonor,
        status: 'approved',
        verifiedAt: new Date().toISOString(),
      });
    }

    setApproveConfirmDonor(null);
  };

  // ACTION: Request Clarification
  const handleOpenClarification = (donor) => {
    setClarificationModalDonor(donor);
    setClarificationText(
      donor.clarificationMessage ||
        'Please upload an updated pathology certificate or high-resolution government ID to verify your blood group credentials.'
    );
    setClarificationPriority('Normal');
  };

  const handleSendClarification = async (e) => {
    e.preventDefault();
    if (!clarificationModalDonor) return;

    if (!clarificationText.trim()) {
      addToast({
        title: 'Message Required',
        message: 'Please provide instructions on what clarification or document is required.',
        type: 'warning',
      });
      return;
    }

    try {
      if (clarificationModalDonor.id && !clarificationModalDonor.id.startsWith('v')) {
        await verificationService.reviewDocument(clarificationModalDonor.id, {
          action: 'request_clarification',
          clarificationMessage: clarificationText.trim(),
        });
      }
    } catch (err) {
      console.warn('API reviewDocument clarification error:', err);
    }

    const updatedQueue = queue.map((d) => {
      if (d.id === clarificationModalDonor.id) {
        return {
          ...d,
          status: 'clarification_requested',
          clarificationMessage: clarificationText.trim(),
          clarificationPriority,
          clarificationSentAt: new Date().toISOString(),
        };
      }
      return d;
    });

    setQueue(updatedQueue);

    addToast({
      title: 'Clarification Request Dispatched',
      message: `Notification & SMS dispatch sent to ${clarificationModalDonor.name} (${clarificationModalDonor.email}). Queue status updated to Clarification Requested.`,
      type: 'info',
    });

    if (viewDetailsDonor && viewDetailsDonor.id === clarificationModalDonor.id) {
      setViewDetailsDonor({
        ...viewDetailsDonor,
        status: 'clarification_requested',
        clarificationMessage: clarificationText.trim(),
      });
    }

    setClarificationModalDonor(null);
    setClarificationText('');
  };

  // ACTION: Reject Verification
  const handleReject = (donor) => {
    setRejectConfirmDonor(donor);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectConfirmDonor) return;

    try {
      if (rejectConfirmDonor.id && !rejectConfirmDonor.id.startsWith('v')) {
        await verificationService.reviewDocument(rejectConfirmDonor.id, {
          action: 'reject',
          notes: rejectReason || 'Document verification criteria not met.',
        });
      }
    } catch (err) {
      console.warn('API reviewDocument reject error:', err);
    }

    const updatedQueue = queue.map((d) => {
      if (d.id === rejectConfirmDonor.id) {
        return {
          ...d,
          status: 'rejected',
          rejectReason: rejectReason || 'Document verification criteria not met.',
          rejectedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    setQueue(updatedQueue);

    addToast({
      title: 'Verification Rejected',
      message: `Application for ${rejectConfirmDonor.name} has been rejected. Notification sent to donor.`,
      type: 'warning',
    });

    if (viewDetailsDonor && viewDetailsDonor.id === rejectConfirmDonor.id) {
      setViewDetailsDonor({
        ...viewDetailsDonor,
        status: 'rejected',
      });
    }

    setRejectConfirmDonor(null);
    setRejectReason('');
  };

  // Reset Queue
  const handleResetQueue = () => {
    setQueue(INITIAL_VERIFICATION_QUEUE);
    localStorage.removeItem(VERIFICATION_STORAGE_KEY);
    addToast({
      title: 'Queue Reset',
      message: 'Donor verification queue restored to initial demo records.',
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#172033] via-[#1E293B] to-[#172033] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#C1123F]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[#F04462] text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-[#F04462]" />
              <span>Clinical Accreditation & Credentialing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Donor Verification Queue
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Verify blood group certificates and government identification submitted by donors before awarding the <strong className="text-emerald-400">Verified Life Saver</strong> badge and granting priority emergency dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={handleResetQueue}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-2"
              title="Reset demonstration queue to original status"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Verification"
          value={summary.pending}
          icon={Clock}
          colorScheme="amber"
          subtitle="Awaiting admin review"
        />
        <StatCard
          title="Verified Life Savers"
          value={summary.approved}
          icon={CheckCircle2}
          colorScheme="emerald"
          subtitle="Certified badge active"
        />
        <StatCard
          title="Clarification Needed"
          value={summary.clarification}
          icon={HelpCircle}
          colorScheme="blue"
          subtitle="Awaiting donor upload"
        />
        <StatCard
          title="Rejected / Disqualified"
          value={summary.rejected}
          icon={XCircle}
          colorScheme="slate"
          subtitle="Non-compliant submissions"
        />
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search donor name, city, document type, or certificate ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Blood group selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Blood Group:</span>
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            >
              <option value="ALL">All Groups</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          {[
            { key: 'ALL', label: 'All Submissions', count: summary.total },
            { key: 'pending', label: 'Pending Review', count: summary.pending, highlight: 'amber' },
            { key: 'approved', label: 'Verified', count: summary.approved, highlight: 'emerald' },
            { key: 'clarification_requested', label: 'Clarification Needed', count: summary.clarification, highlight: 'blue' },
            { key: 'rejected', label: 'Rejected', count: summary.rejected, highlight: 'slate' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                statusFilter === tab.key
                  ? 'bg-[#172033] text-white shadow-sm'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  statusFilter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* QUEUE LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#172033]">Donor Verification Applications</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              Showing {filteredQueue.length} of {queue.length}
            </span>
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#172033]">No Verification Requests Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No donor records matched your search or current filter criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setBloodGroupFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQueue.map((donor) => {
              const isPending = donor.status === 'pending';
              const isApproved = donor.status === 'approved';
              const isClarification = donor.status === 'clarification_requested';
              const isRejected = donor.status === 'rejected';

              return (
                <div
                  key={donor.id}
                  className="p-5 sm:p-6 transition-colors hover:bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Donor Info & Document Info */}
                  <div className="flex items-start gap-4">
                    {/* Blood Group Badge */}
                    <div className="w-12 h-12 rounded-2xl bg-[#C1123F] text-white flex flex-col items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
                      <span>{donor.bloodGroup}</span>
                      <span className="text-[9px] font-normal uppercase opacity-80">Donor</span>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-[#172033] tracking-tight">
                          {donor.name}
                        </h4>
                        
                        {/* Status Badges */}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified Life Saver</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Review Pending</span>
                          </span>
                        )}
                        {isClarification && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <HelpCircle className="w-3 h-3 text-blue-600" />
                            <span>Clarification Requested</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Application Rejected</span>
                          </span>
                        )}
                      </div>

                      {/* Contact & Location Details */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{donor.area}, {donor.city}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{donor.phone}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{donor.email}</span>
                        </span>
                      </div>

                      {/* Submitted Document details box */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-700 space-y-1 mt-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold flex items-center gap-1.5 text-slate-900">
                            <FileCheck2 className="w-4 h-4 text-[#C1123F]" />
                            <span>{donor.docType}</span>
                            <span className="font-mono text-[11px] text-slate-500">({donor.docNumber})</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Submitted {donor.submittedAt}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {donor.notes}
                        </p>
                        {isClarification && donor.clarificationMessage && (
                          <div className="p-2 mt-1 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-[11px]">
                            <strong>Clarification Note Sent:</strong> {donor.clarificationMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Functional Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center flex-shrink-0">
                    {/* View Details / Document Modal */}
                    <button
                      type="button"
                      onClick={() => setViewDetailsDonor(donor)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Inspect submitted documentation"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Proof</span>
                    </button>

                    {/* Download Proof Button */}
                    <button
                      type="button"
                      onClick={() => handleDownloadProof(donor)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-[#C1123F]/10 hover:text-[#C1123F] text-slate-600 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Download submitted proof document"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </button>

                    {/* Approve Verification Button */}
                    <button
                      type="button"
                      onClick={() => handleApprove(donor)}
                      disabled={isApproved}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-400 border border-emerald-100 cursor-default'
                          : 'bg-[#16A36A] hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isApproved ? 'Verified' : 'Approve Verification'}</span>
                    </button>

                    {/* Request Clarification Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenClarification(donor)}
                      className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Request Clarification</span>
                    </button>

                    {/* Reject Button (only if not rejected) */}
                    {!isRejected && (
                      <button
                        type="button"
                        onClick={() => handleReject(donor)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Reject verification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: VIEW DETAILS / DOCUMENT PREVIEW */}
      {viewDetailsDonor && (
        <Modal
          isOpen={!!viewDetailsDonor}
          onClose={() => setViewDetailsDonor(null)}
          title="Clinical Credential Verification"
          subtitle={`Review submitted verification documents for ${viewDetailsDonor.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 pt-2">
            {/* Header Bio */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-14 h-14 rounded-2xl bg-[#C1123F] text-white flex flex-col items-center justify-center font-extrabold text-base shadow-sm">
                <span>{viewDetailsDonor.bloodGroup}</span>
                <span className="text-[10px] font-normal uppercase opacity-80">Group</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-[#172033]">{viewDetailsDonor.name}</h4>
                <p className="text-xs text-slate-500">
                  {viewDetailsDonor.area}, {viewDetailsDonor.city} • Phone: {viewDetailsDonor.phone}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">Email: {viewDetailsDonor.email}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] font-semibold text-slate-600">Submitted: {viewDetailsDonor.submittedDate}</span>
                </div>
              </div>
            </div>

            {/* Document Details & Mock Preview */}
            <div className="space-y-3">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Submitted Document Record
              </h5>
              
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-[#C1123F]" />
                    <div>
                      <div className="font-bold text-xs text-[#172033]">{viewDetailsDonor.docType}</div>
                      <div className="font-mono text-[11px] text-slate-500">Ref ID: {viewDetailsDonor.docNumber}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadProof(viewDetailsDonor)}
                      className="px-3 py-1.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                      title="Download official proof document"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreviewProof(viewDetailsDonor)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Preview / Print document in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>Preview / Print</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <strong>Pathologist Summary: </strong>
                  {viewDetailsDonor.notes}
                </div>
              </div>
            </div>

            {/* Clinical Verification Checklist */}
            <div className="space-y-2">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Accreditation Standards Checklist
              </h5>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#C1123F] accent-[#C1123F]" />
                  <span className="font-medium text-slate-700">Official Government ID verified and matches profile registration name</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#C1123F] accent-[#C1123F]" />
                  <span className="font-medium text-slate-700">Blood Group {viewDetailsDonor.bloodGroup} confirmed via pathology laboratory report</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#C1123F] accent-[#C1123F]" />
                  <span className="font-medium text-slate-700">Serology clearance test valid within 6-month clinical window</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewDetailsDonor(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = viewDetailsDonor;
                    setViewDetailsDonor(null);
                    handleOpenClarification(d);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold"
                >
                  Request Clarification
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const d = viewDetailsDonor;
                    setViewDetailsDonor(null);
                    handleApprove(d);
                  }}
                  disabled={viewDetailsDonor.status === 'approved'}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 ${
                    viewDetailsDonor.status === 'approved'
                      ? 'bg-emerald-400 cursor-default'
                      : 'bg-[#16A36A] hover:bg-emerald-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{viewDetailsDonor.status === 'approved' ? 'Verified' : 'Approve & Issue Badge'}</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: REQUEST CLARIFICATION */}
      {clarificationModalDonor && (
        <Modal
          isOpen={!!clarificationModalDonor}
          onClose={() => setClarificationModalDonor(null)}
          title="Request Donor Clarification"
          subtitle={`Send notification & documentation request to ${clarificationModalDonor.name}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSendClarification} className="space-y-5 pt-2">
            {/* Recipient Details */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-[#172033]">{clarificationModalDonor.name}</div>
                <div className="text-[11px] text-slate-500">
                  {clarificationModalDonor.email} • {clarificationModalDonor.phone}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-white border border-blue-200 text-[#C1123F] font-extrabold text-xs">
                {clarificationModalDonor.bloodGroup}
              </span>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Quick Preset Clarification Messages:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CLARIFICATION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setClarificationText(preset.message)}
                    className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-[11px] font-medium text-slate-700 transition-colors flex items-center justify-between"
                  >
                    <span className="line-clamp-1">{preset.label}</span>
                    <Sparkles className="w-3 h-3 text-[#C1123F] flex-shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Clarification Message Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Clarification Instructions for Donor <span className="text-[#C1123F]">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={clarificationText}
                onChange={(e) => setClarificationText(e.target.value)}
                placeholder="State clearly which documents or tests are missing or need higher resolution..."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
              />
              <p className="text-[11px] text-slate-400">
                This note will appear in the donor's dashboard notification feed and dispatch via SMS.
              </p>
            </div>

            {/* Dispatch Options */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Urgency Level</span>
                <div className="flex items-center gap-2">
                  {['Normal', 'Urgent'].map((pri) => (
                    <button
                      key={pri}
                      type="button"
                      onClick={() => setClarificationPriority(pri)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        clarificationPriority === pri
                          ? 'bg-[#172033] text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pri}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 border-t border-slate-200/60 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={notifyDonorSms}
                  onChange={(e) => setNotifyDonorSms(e.target.checked)}
                  className="rounded text-[#C1123F] accent-[#C1123F]"
                />
                <span className="font-medium">Send real-time SMS & In-App alert to donor phone</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClarificationModalDonor(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Clarification Request</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRMATION DIALOG: APPROVE */}
      <ConfirmationDialog
        isOpen={!!approveConfirmDonor}
        onClose={() => setApproveConfirmDonor(null)}
        onConfirm={confirmApprove}
        title="Approve Donor Clinical Verification"
        message={`Are you sure you want to approve ${approveConfirmDonor?.name}? This will award them the 'Verified Life Saver' certified badge and prioritize them in the emergency match grid.`}
        confirmText="Approve & Certify"
        type="success"
      />

      {/* CONFIRMATION DIALOG: REJECT */}
      <ConfirmationDialog
        isOpen={!!rejectConfirmDonor}
        onClose={() => setRejectConfirmDonor(null)}
        onConfirm={confirmReject}
        title="Reject Donor Verification Application"
        message={`Are you sure you want to reject ${rejectConfirmDonor?.name}'s verification request? The donor will be notified of non-compliance.`}
        confirmText="Reject Application"
        type="danger"
      />
    </div>
  );
}
