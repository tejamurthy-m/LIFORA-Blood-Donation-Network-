import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Copy,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Phone,
  User,
} from 'lucide-react';
import { requestService } from '../../services/requestService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'];

export default function CreateRequestPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Form Fields
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalLocation, setHospitalLocation] = useState('');
  const [city, setCity] = useState(user?.city || 'Mumbai');
  const [requiredDate, setRequiredDate] = useState('Immediate / Today');
  const [urgency, setUrgency] = useState('Urgent'); // 'Normal', 'Urgent', 'Emergency'
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [contactPerson, setContactPerson] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [agreed, setAgreed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientName.trim()) {
      addToast({ title: 'Validation', message: 'Please enter patient name.', type: 'error' });
      return;
    }
    if (!hospitalName.trim()) {
      addToast({ title: 'Validation', message: 'Please provide hospital name.', type: 'error' });
      return;
    }
    if (!contactPhone.trim()) {
      addToast({ title: 'Validation', message: 'Please provide emergency contact number.', type: 'error' });
      return;
    }
    if (!agreed) {
      addToast({ title: 'Required', message: 'Please confirm the medical advisory acknowledgment.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestService.createRequest({
        patientName,
        bloodGroup,
        unitsRequired,
        hospitalName,
        hospitalLocation: hospitalLocation.trim() || `${hospitalName}, ${city}`,
        city,
        requiredDate,
        urgency,
        additionalInstructions,
        contactPerson: contactPerson.trim() || 'Care Coordinator',
        contactPhone,
        requesterId: user?.id || 'guest_user',
      });

      setCreatedRequest(result);
      addToast({
        title: 'Blood Request Successfully Created!',
        message: `Tracking ID: ${result.trackingId}. Broadcasting to nearby compatible donors.`,
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Submission Error',
        message: 'Could not create blood request.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTrackingId = () => {
    if (createdRequest?.trackingId) {
      navigator.clipboard.writeText(createdRequest.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      addToast({
        title: 'Copied to Clipboard',
        message: `Tracking ID ${createdRequest.trackingId} copied.`,
        type: 'info',
      });
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* If Request Created Successfully: Show Confirmation Screen */}
      {createdRequest ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-[#16A36A] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033]">
              Request Dispatched to Nearby Donors
            </h2>
            <p className="text-sm text-[#64748B] max-w-lg mx-auto">
              Your request for {createdRequest.unitsRequired} Units of {createdRequest.bloodGroup} at {createdRequest.hospitalName} has been broadcasted.
            </p>
          </div>

          {/* Tracking ID Badge */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 inline-flex flex-col sm:flex-row items-center gap-4 mx-auto">
            <div className="text-left">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Official Tracking ID
              </span>
              <span className="text-2xl font-black text-[#C1123F] tracking-wide">
                {createdRequest.trackingId}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyTrackingId}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* 4-Step Tracker Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left pt-4">
            {createdRequest.timeline?.map((step) => (
              <div
                key={step.step}
                className={`p-3 rounded-xl border text-xs ${
                  step.done
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>Stage 0{step.step}</span>
                  {step.done ? <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" /> : <Clock className="w-3.5 h-3.5 text-slate-300" />}
                </div>
                <div className="font-bold text-xs">{step.title}</div>
              </div>
            ))}
          </div>

          {/* Medical Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-left">
            <strong>Medical Notice:</strong> LIFORA facilitates communication between donors, recipients, and hospitals. Final blood compatibility, infectious disease screening, and transfusion decisions remain strictly with licensed hospital blood bank medical specialists.
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/find-donors"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white font-bold text-xs transition-colors"
            >
              Browse Matching Donors Directly
            </Link>
            <Link
              to="/recipient/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Go to Recipient Dashboard
            </Link>
          </div>
        </motion.div>
      ) : (
        /* Form Screen */
        <div className="space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h1 className="text-3xl font-extrabold text-[#172033] tracking-tight">
              Create a Blood Donation Request
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Submit patient and hospital details to alert voluntary donors within your vicinity.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-6">
            {/* Section 1: Patient & Blood Group */}
            <div>
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider text-[#C1123F] mb-4">
                1. Patient & Required Blood
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Patient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kulkarni"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Required Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#C1123F] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Units Required
                  </label>
                  <select
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value={1}>1 Unit (approx. 450 ml)</option>
                    <option value={2}>2 Units</option>
                    <option value={3}>3 Units</option>
                    <option value={4}>4+ Units</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Urgency Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Normal', 'Urgent', 'Emergency'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setUrgency(lvl)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                          urgency === lvl
                            ? lvl === 'Emergency'
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-[#C1123F] text-white border-[#C1123F] shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Hospital Details */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider text-[#C1123F] mb-4">
                2. Hospital & Location Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lilavati Hospital & Research Centre"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Hospital Location / Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bandra Reclamation, Ward 4"
                    value={hospitalLocation}
                    onChange={(e) => setHospitalLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Required By (Date / Time)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Today by 8:00 PM"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Contact & Clinical Notes */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider text-[#C1123F] mb-4">
                3. Attending Contact & Medical Notes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Mehta or Relative Name"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Emergency Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Clinical Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Pre-cross match required at hospital blood bank 2nd floor before 9 PM."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                />
              </div>
            </div>

            {/* Medical Disclaimer Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#64748B]">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#C1123F] focus:ring-[#C1123F] border-slate-300 accent-[#C1123F]"
                />
                <span>
                  I acknowledge that LIFORA connects voluntary donors with recipients and hospitals; medical transfusion compatibility decisions remain exclusively with licensed healthcare professionals.
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#C1123F] hover:bg-[#9E0E32] text-white font-bold text-sm shadow-md shadow-[#C1123F]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit & Broadcast Blood Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
