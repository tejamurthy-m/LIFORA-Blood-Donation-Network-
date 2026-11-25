import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Eye,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  File,
} from 'lucide-react';
import { verificationService } from '../../services/verificationService';
import { useToast } from '../../context/ToastContext';

export default function DonorDocumentVerificationCard({ onStatusUpdate }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showReuploadForm, setShowReuploadForm] = useState(false);

  // Form states
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('Pathology Blood Group Certificate');
  const [docNumber, setDocNumber] = useState('');
  const [notes, setNotes] = useState('');

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const doc = await verificationService.getMyDocument();
      setDocument(doc);
      if (onStatusUpdate && doc?.status) {
        onStatusUpdate(doc.status);
      }
    } catch {
      // Gracefully maintain null
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, []);

  const handleFileSelect = (file) => {
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      addToast({
        title: 'Invalid File Format',
        message: 'Only PDF, PNG, and JPEG documents are supported.',
        type: 'error',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: 'File Too Large',
        message: 'Medical report must be smaller than 5MB.',
        type: 'error',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast({
        title: 'File Required',
        message: 'Please choose a document file to upload.',
        type: 'error',
      });
      return;
    }

    setUploading(true);
    try {
      const res = await verificationService.uploadMedicalReport(selectedFile, {
        docType,
        docNumber: docNumber || undefined,
        notes: notes || undefined,
      });

      addToast({
        title: 'Document Uploaded Successfully',
        message: 'Your blood group report has been sent for authorized medical review.',
        type: 'success',
      });

      setDocument(res);
      setSelectedFile(null);
      setShowReuploadForm(false);
      if (onStatusUpdate) {
        onStatusUpdate('pending');
      }
    } catch (err) {
      addToast({
        title: 'Upload Failed',
        message: err.response?.data?.message || err.message || 'Could not upload document.',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const statusConfig = {
    pending: {
      label: 'Pending Medical Review',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Clock,
      title: 'Under Review by Transfusion Specialists',
      desc: 'Your report has been received and is queued for verification by certified medical staff. This usually takes under 24 hours.',
    },
    approved: {
      label: 'Report Verified & Approved',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      title: 'Verified Blood Group Status',
      desc: 'Your blood report is verified. You are now prioritized in recipient matching and emergency donation calls.',
    },
    verified: {
      label: 'Report Verified & Approved',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      title: 'Verified Blood Group Status',
      desc: 'Your blood report is verified. You are now prioritized in recipient matching and emergency donation calls.',
    },
    clarification_requested: {
      label: 'Clarification Required',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: AlertTriangle,
      title: 'Resubmission Requested by Reviewer',
      desc: document?.clarificationMessage || 'Please provide a clearer photo or a more recent serology test.',
    },
    rejected: {
      label: 'Verification Rejected',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: XCircle,
      title: 'Document Rejected',
      desc: document?.notes || 'The submitted document does not meet clinical standards. Please upload an official pathology certificate.',
    },
  };

  const currentStatus = document?.status ? statusConfig[document.status] || statusConfig.pending : null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C1123F] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-[#172033]">
              Blood Group Medical Report Verification
            </h3>
            <p className="text-xs text-[#64748B]">
              Upload an authorized pathology certificate or blood bank donor card to become a Verified Donor
            </p>
          </div>
        </div>

        {document && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              currentStatus?.badgeClass || 'bg-slate-100 text-slate-700'
            }`}
          >
            {currentStatus && <currentStatus.icon className="w-3.5 h-3.5" />}
            {currentStatus?.label || 'Status Pending'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-3 text-slate-400 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-[#C1123F]" />
          <span>Checking verification records...</span>
        </div>
      ) : document && !showReuploadForm ? (
        /* Existing Document View */
        <div className="space-y-4">
          <div
            className={`p-4 sm:p-5 rounded-2xl border ${
              document.status === 'approved' || document.status === 'verified'
                ? 'bg-emerald-50/60 border-emerald-200'
                : document.status === 'clarification_requested'
                ? 'bg-orange-50/60 border-orange-200'
                : document.status === 'rejected'
                ? 'bg-rose-50/60 border-rose-200'
                : 'bg-amber-50/60 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-3.5">
              {currentStatus && (
                <div
                  className={`p-2 rounded-xl mt-0.5 ${
                    document.status === 'approved' || document.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-700'
                      : document.status === 'clarification_requested'
                      ? 'bg-orange-100 text-orange-700'
                      : document.status === 'rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <currentStatus.icon className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-sm text-[#172033]">{currentStatus?.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{currentStatus?.desc}</p>
                {document.verifiedBy && (
                  <p className="text-[11px] text-slate-500 pt-1">
                    Reviewed by <span className="font-semibold text-slate-700">{document.verifiedBy}</span>
                    {document.verifiedAt ? ` on ${new Date(document.verifiedAt).toLocaleDateString()}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Document Metadata Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Document Type
              </span>
              <span className="font-semibold text-slate-800">{document.docType}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Certificate Number
              </span>
              <span className="font-semibold text-slate-800">{document.docNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Uploaded Date
              </span>
              <span className="font-semibold text-slate-800">
                {document.submittedDate || new Date(document.submittedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              {document.signedUrl && (
                <a
                  href={document.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Private Document</span>
                </a>
              )}
            </div>

            {(document.status === 'rejected' ||
              document.status === 'clarification_requested' ||
              document.status === 'pending') && (
              <button
                type="button"
                onClick={() => setShowReuploadForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#C1123F] bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Replacement Report</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Document Upload Dropzone Form */
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Document Category
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
              >
                <option value="Pathology Blood Group Certificate">Pathology Blood Group Certificate</option>
                <option value="Government Blood Bank Donor Card">Government Blood Bank Donor Card</option>
                <option value="Hospital Immunohematology Lab Report">Hospital Immunohematology Lab Report</option>
                <option value="Clinical Serology / Cross-Match Report">Clinical Serology / Cross-Match Report</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Report / Card Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. MH-PATH-2026-904"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
              />
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#C1123F] bg-rose-50/50'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/40'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            <div className="flex flex-col items-center justify-center space-y-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  selectedFile
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-50 text-[#C1123F]'
                }`}
              >
                {selectedFile ? <FileCheck2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
              </div>

              {selectedFile ? (
                <div>
                  <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Click to browse or drag and drop your blood report
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supported formats: PDF, PNG, JPG (Maximum 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1">
              Notes for Reviewer (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Test conducted at Thyrocare Diagnostic Lab on 15 Nov"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {document && (
              <button
                type="button"
                onClick={() => {
                  setShowReuploadForm(false);
                  setSelectedFile(null);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel Re-upload
              </button>
            )}

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="ml-auto px-6 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-[#C1123F]/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading securely...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Submit for Medical Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Security notice */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" />
        <p>
          Medical reports are stored in private encrypted storage with limited-time access signatures. Only licensed medical review staff can inspect reports for clinical authentication.
        </p>
      </div>
    </div>
  );
}
