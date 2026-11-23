import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Heart,
  Users,
  Building2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import LiforaLogo from '../../components/common/LiforaLogo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hospitalService } from '../../services/hospitalService';
import { getStoredHospitalData, saveStoredHospitalData } from '../../services/hospitalPortalService';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'];

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const [role, setRole] = useState(
    roleParam === 'hospital' ? 'hospital' : roleParam === 'recipient' ? 'recipient' : 'donor'
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [city, setCity] = useState('Mumbai');
  const [area, setArea] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hospital Specific Fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bedCapacity, setBedCapacity] = useState('250');
  const [headName, setHeadName] = useState('');
  const [headQualification, setHeadQualification] = useState('MD (Transfusion Medicine)');

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError(role === 'hospital' ? 'Please enter the hospital / institution name.' : 'Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid official email address.');
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setError('Please provide a valid contact number.');
      return;
    }
    if (role === 'hospital') {
      if (!licenseNumber.trim()) {
        setError('Please provide your state blood bank license number (e.g. BB-LIC-MH-890).');
        return;
      }
      if (!headName.trim()) {
        setError('Please enter the name of the Blood Bank Medical Officer / Head.');
        return;
      }
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service & Transfusion Safety Code.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (role === 'hospital') {
        // 1. Register hospital user account
        const user = await register({
          fullName,
          email,
          phone,
          role: 'hospital',
          staffRole: 'hospital_admin',
          city,
          area: area.trim() || 'Central Healthcare Campus',
          password,
        });

        // 2. Add hospital registration record in hospitalService with Pending status
        const newHospital = await hospitalService.addHospital({
          name: fullName,
          licenseNumber: licenseNumber.trim().toUpperCase(),
          address: area ? `${area}, ${city}` : city,
          city,
          state: 'Maharashtra',
          contactPhone: phone,
          contactEmail: email,
          bedCapacity: Number(bedCapacity) || 200,
          headName,
          headQualification,
          status: 'Pending',
          notes: 'Submitted via portal registration. Awaiting platform operator review.',
        });

        // 3. Initialize current hospital profile with Pending verification status
        const currentData = getStoredHospitalData();
        currentData.profile = {
          ...currentData.profile,
          id: newHospital.id,
          name: fullName,
          licenseNumber: licenseNumber.trim().toUpperCase(),
          registrationNumber: `REG-HOSP-${Date.now().toString().slice(-6)}`,
          address: area ? `${area}, ${city}` : `${city} Healthcare Corridor`,
          city,
          contactPhone: phone,
          officialEmail: email,
          verificationStatus: 'Pending',
          bedCapacity: Number(bedCapacity) || 200,
          bloodBankHead: {
            name: headName,
            qualification: headQualification,
            phone,
            email,
          },
        };
        currentData.auditLogs.unshift({
          id: `log-${Date.now()}`,
          action: 'Hospital Registration Application Submitted',
          actor: `${fullName} (Applicant)`,
          target: `${licenseNumber.trim().toUpperCase()}`,
          time: 'Just now',
          notes: 'Initial registration application submitted. Status set to Pending review.',
        });
        saveStoredHospitalData(currentData);

        addToast({
          title: 'Application Submitted!',
          message: 'Your hospital registration has been received and is Pending platform operator verification.',
          type: 'info',
        });

        navigate('/hospital/dashboard', { replace: true });
      } else {
        const user = await register({
          fullName,
          email,
          phone,
          role,
          bloodGroup: role === 'donor' ? bloodGroup : undefined,
          city,
          area: area.trim() || 'Central',
          password,
        });

        addToast({
          title: 'Account Created Successfully!',
          message: `Welcome to LIFORA, ${user.name}. You are registered as a verified ${role}.`,
          type: 'success',
        });

        if (role === 'donor') {
          navigate('/donor/dashboard', { replace: true });
        } else {
          navigate('/recipient/dashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center bg-[#FAF9F6]">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <LiforaLogo size="lg" withTagline={true} className="justify-center" />
        <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
          Join the LIFORA Lifesaver Network
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#64748B]">
          Every drop connects. Select your portal to begin saving or coordinating blood.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl"
      >
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-900/5 rounded-3xl border border-slate-200/90 space-y-6">
          {/* Role Selection Tabs - Strictly 3 Portals */}
          <div>
            <label className="block text-xs font-bold text-[#172033] mb-2">
              Select Registration Portal:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('donor')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all cursor-pointer ${
                  role === 'donor'
                    ? 'border-[#C1123F] bg-rose-50/70 ring-2 ring-[#C1123F]/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    role === 'donor'
                      ? 'bg-[#C1123F] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#172033]">Blood Donor</div>
                  <div className="text-[10px] text-[#64748B] mt-0.5 leading-snug">
                    Voluntary donor saving nearby lives
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('recipient')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all cursor-pointer ${
                  role === 'recipient'
                    ? 'border-[#C1123F] bg-rose-50/70 ring-2 ring-[#C1123F]/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    role === 'recipient'
                      ? 'bg-[#C1123F] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#172033]">Blood Recipient</div>
                  <div className="text-[10px] text-[#64748B] mt-0.5 leading-snug">
                    Patient or family needing blood
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('hospital')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all cursor-pointer ${
                  role === 'hospital'
                    ? 'border-[#C1123F] bg-rose-50/70 ring-2 ring-[#C1123F]/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    role === 'hospital'
                      ? 'bg-[#C1123F] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#172033]">Hospital / Bank</div>
                  <div className="text-[10px] text-[#64748B] mt-0.5 leading-snug">
                    Clinical centre registration
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C1123F] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name / Hospital Name */}
              <div className={role === 'hospital' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  {role === 'hospital' ? 'Hospital / Institution Name' : 'Full Name'}
                </label>
                <div className="relative">
                  {role === 'hospital' ? (
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  )}
                  <input
                    type="text"
                    required
                    placeholder={role === 'hospital' ? 'e.g. Kokilaben Dhirubhai Ambani Hospital' : 'e.g. Dr. Aryan Sharma'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  />
                </div>
              </div>

              {/* Hospital Specific: Clinical License Number */}
              {role === 'hospital' && (
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Clinical License Number (Form 28-C)
                  </label>
                  <div className="relative">
                    <FileCheck2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. BB-LIC-MH-890"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                    />
                  </div>
                </div>
              )}

              {/* Hospital Specific: Bed Capacity */}
              {role === 'hospital' && (
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Inpatient Bed Capacity
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    placeholder="e.g. 350"
                    value={bedCapacity}
                    onChange={(e) => setBedCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  {role === 'hospital' ? 'Official Blood Bank Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder={role === 'hospital' ? 'bloodbank@hospital.org' : 'name@domain.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  {role === 'hospital' ? 'Blood Bank Emergency Desk Phone' : 'Phone Number (Protected)'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  />
                </div>
              </div>
            </div>

            {/* Hospital Specific: Medical Officer Details */}
            {role === 'hospital' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Blood Bank Medical In-Charge
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Kadam"
                    value={headName}
                    onChange={(e) => setHeadName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Medical Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MD (Transfusion Medicine)"
                    value={headQualification}
                    onChange={(e) => setHeadQualification(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  />
                </div>
              </div>
            )}

            {/* Blood Group for Donors / Recipients */}
            {role !== 'hospital' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    {role === 'donor' ? 'Blood Group' : 'Target / Known Blood Type'}
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* City */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area / Pin */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  {role === 'hospital' ? 'Facility Campus / Street Address' : 'Area / Locality'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={role === 'hospital' ? 'e.g. Bandra Reclamation West' : 'e.g. Bandra West or Indiranagar'}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                  />
                </div>
              </div>
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#64748B]">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#C1123F] focus:ring-[#C1123F] border-slate-300 accent-[#C1123F]"
                />
                <span>
                  I agree to the <a href="#" className="font-semibold text-[#172033] underline">Terms of Service</a>, voluntary donation charter, and <a href="#" className="font-semibold text-[#172033] underline">Privacy Policy</a>.
                  {role === 'hospital' && ' We acknowledge that clinical portal access remains Pending until licensed by a LIFORA Platform Operator.'}
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white font-bold text-sm shadow-md shadow-[#C1123F]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {role === 'hospital'
                      ? 'Submit Hospital Registration Application'
                      : `Create ${role === 'donor' ? 'Donor' : 'Recipient'} Account`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-[#64748B]">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-[#C1123F] hover:underline">
              Sign in to your portal
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
