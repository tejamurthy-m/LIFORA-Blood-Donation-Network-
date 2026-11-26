import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  ShieldCheck,
  Calendar,
  Save,
  CheckCircle2,
  Sparkles,
  Camera,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import DonorDocumentVerificationCard from '../donor/DonorDocumentVerificationCard';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'];

export default function UserProfileView() {
  const { user, updateProfile, role } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98201 11223');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [city, setCity] = useState(user?.city || 'Mumbai');
  const [area, setArea] = useState(user?.area || 'Bandra West');
  const [bio, setBio] = useState(
    user?.bio ||
      'Dedicated voluntary donor committed to emergency hospital assistance and pediatric care.'
  );
  const [isSaving, setIsSaving] = useState(false);

  // Phone OTP Verification Modal State
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneStep, setPhoneStep] = useState('send'); // 'send' | 'verify'

  // Email Verification Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStep, setEmailStep] = useState('send'); // 'send' | 'verify'

  const handleSendPhoneOtp = async () => {
    setPhoneLoading(true);
    try {
      const res = await authService.sendPhoneOtp(phone);
      setPhoneStep('verify');
      addToast({
        title: 'OTP Dispatched',
        message: res.message || 'Verification code sent to your phone number.',
        type: 'info',
      });
    } catch (err) {
      addToast({
        title: 'OTP Dispatch Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    setPhoneLoading(true);
    try {
      await authService.verifyPhoneOtp(phone, phoneOtp);
      await updateProfile({ isPhoneVerified: true });
      addToast({
        title: 'Phone Verified 🎉',
        message: 'Your phone number has been successfully verified.',
        type: 'success',
      });
      setPhoneModalOpen(false);
      setPhoneStep('send');
      setPhoneOtp('');
    } catch (err) {
      addToast({
        title: 'Verification Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSendEmailVerification = async () => {
    setEmailLoading(true);
    try {
      const res = await authService.sendEmailVerification(email);
      setEmailStep('verify');
      addToast({
        title: 'Email Code Dispatched',
        message: res.message || '6-digit verification code sent to your inbox.',
        type: 'info',
      });
    } catch (err) {
      addToast({
        title: 'Dispatch Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailCode = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await authService.verifyEmailCode(email, emailCode);
      await updateProfile({ isEmailVerified: true });
      addToast({
        title: 'Email Verified 🎉',
        message: 'Your email address has been verified.',
        type: 'success',
      });
      setEmailModalOpen(false);
      setEmailStep('send');
      setEmailCode('');
    } catch (err) {
      addToast({
        title: 'Verification Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        phone,
        bloodGroup: role === 'donor' ? bloodGroup : user?.bloodGroup,
        city,
        area,
        bio,
      });

      addToast({
        title: 'Profile Saved',
        message: 'Your personal information and credentials have been updated.',
        type: 'success',
      });
    } catch {
      addToast({
        title: 'Error',
        message: 'Failed to update profile.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Profile Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#C1123F] to-[#F04462] text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
                {user?.bloodGroup || user?.name?.charAt(0) || 'U'}
              </div>
              <button
                type="button"
                onClick={() =>
                  addToast({
                    title: 'Avatar Upload',
                    message: 'Image upload connected to medical profile avatar.',
                    type: 'info',
                  })
                }
                className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-600 transition-colors"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033]">
                  {user?.name}
                </h2>
                <StatusBadge status={user?.badge || 'Verified Member'} type="badge" size="sm" />
              </div>
              <p className="text-xs text-[#64748B] mt-1 flex items-center gap-2">
                <span className="capitalize font-semibold text-[#C1123F]">{role} Account</span>
                <span>•</span>
                <span>{user?.city || 'Mumbai'}, India</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Verification
              </span>
              <span className="text-xs font-bold text-[#16A36A] flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Identity Confirmed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Donor Blood Report Verification Section */}
      {role === 'donor' && (
        <DonorDocumentVerificationCard
          onStatusUpdate={(newStatus) => {
            if (newStatus === 'verified' || newStatus === 'approved') {
              updateProfile({ badge: 'Verified Donor' });
            }
          }}
        />
      )}

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#172033]">Personal Credentials & Contact</h3>
            <p className="text-xs text-[#64748B]">
              Keep your contact details up to date for emergency hospital matching
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Protected by HIPAA Privacy</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#172033]">Email Address</label>
              {user?.isEmailVerified ? (
                <span className="text-[11px] font-semibold text-[#16A36A] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEmailModalOpen(true);
                    setEmailStep('send');
                  }}
                  className="text-[11px] font-bold text-[#C1123F] hover:underline"
                >
                  Verify Email →
                </button>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#172033]">Phone Number</label>
              {user?.isPhoneVerified ? (
                <span className="text-[11px] font-semibold text-[#16A36A] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPhoneModalOpen(true);
                    setPhoneStep('send');
                  }}
                  className="text-[11px] font-bold text-[#C1123F] hover:underline"
                >
                  Verify via SMS OTP →
                </button>
              )}
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
              />
            </div>
          </div>

          {role === 'donor' && (
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">Blood Group</label>
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
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">City</label>
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

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">Locality / Area</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#172033] mb-1.5">
            Donor Bio / Healthcare Notes
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white font-bold text-xs shadow-sm shadow-[#C1123F]/20 flex items-center gap-2 transition-all"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Phone OTP Modal */}
      <Modal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        title="Verify Mobile Phone Number"
        subtitle={`Secure phone verification for ${phone}`}
        maxWidth="max-w-md"
      >
        {phoneStep === 'send' ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              We will send a 6-digit one-time password (OTP) to your phone number via secure SMS.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#C1123F]" />
              <span>{phone}</span>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setPhoneModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendPhoneOtp}
                disabled={phoneLoading}
                className="px-5 py-2 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold flex items-center gap-2"
              >
                {phoneLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Send 6-Digit OTP
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter the 6-digit verification code sent to <strong>{phone}</strong>.
            </p>
            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[8px] text-xl font-bold py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={handleSendPhoneOtp}
                disabled={phoneLoading}
                className="text-[#C1123F] font-semibold hover:underline"
              >
                Resend code
              </button>
              <span>Expires in 10 mins</span>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setPhoneModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={phoneLoading || phoneOtp.length !== 6}
                className="px-5 py-2 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold flex items-center gap-2 disabled:bg-slate-300"
              >
                {phoneLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirm & Verify
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Email Verification Modal */}
      <Modal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Verify Email Address"
        subtitle={`Verify ownership of ${email}`}
        maxWidth="max-w-md"
      >
        {emailStep === 'send' ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              We will send a 6-digit verification code to your registered email address.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#C1123F]" />
              <span>{email}</span>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmailVerification}
                disabled={emailLoading}
                className="px-5 py-2 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold flex items-center gap-2"
              >
                {emailLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Send Verification Code
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerifyEmailCode} className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter the 6-digit verification code sent to <strong>{email}</strong>.
            </p>
            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[8px] text-xl font-bold py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={handleSendEmailVerification}
                disabled={emailLoading}
                className="text-[#C1123F] font-semibold hover:underline"
              >
                Resend code
              </button>
              <span>Expires in 15 mins</span>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={emailLoading || emailCode.length !== 6}
                className="px-5 py-2 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold flex items-center gap-2 disabled:bg-slate-300"
              >
                {emailLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirm & Verify
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
