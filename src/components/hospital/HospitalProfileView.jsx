import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Edit,
  Save,
  Check,
  Lock,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function HospitalProfileView({ profile, onUpdateProfile }) {
  const { user, staffRole } = useAuth();
  const { addToast } = useToast();

  const isHospitalAdmin = staffRole === 'hospital_admin';

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name,
    licenseNumber: profile.licenseNumber,
    registrationNumber: profile.registrationNumber,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    pincode: profile.pincode,
    contactPhone: profile.contactPhone,
    officialEmail: profile.officialEmail,
    bedCapacity: profile.bedCapacity,
    headName: profile.bloodBankHead?.name || '',
    headPhone: profile.bloodBankHead?.phone || '',
    headEmail: profile.bloodBankHead?.email || '',
    headQualification: profile.bloodBankHead?.qualification || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isHospitalAdmin) {
      addToast({
        title: 'Permission Denied',
        message: 'Only Hospital Admin can modify hospital registration details.',
        type: 'error',
      });
      return;
    }

    try {
      await onUpdateProfile({
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        contactPhone: formData.contactPhone,
        officialEmail: formData.officialEmail,
        bedCapacity: parseInt(formData.bedCapacity, 10),
        bloodBankHead: {
          name: formData.headName,
          phone: formData.headPhone,
          email: formData.headEmail,
          qualification: formData.headQualification,
        },
      });

      setIsEditing(false);
      addToast({
        title: 'Profile Updated',
        message: 'Hospital information and blood bank accreditation details saved.',
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not update profile.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* PROFILE HEADER CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#C1123F] flex-shrink-0 shadow-xs">
              <Building2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
                  {profile.name}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{profile.verificationStatus} Partner</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Blood Bank License: <strong className="text-slate-800">{profile.licenseNumber}</strong> • Reg: {profile.registrationNumber}
              </p>
              <p className="text-xs text-emerald-800 font-semibold">
                {profile.accreditation}
              </p>
            </div>
          </div>

          {isHospitalAdmin && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          )}
        </div>

        {/* RESTRICTED VERIFICATION NOTICE */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Platform Verification Authority:</strong> Hospital accreditation status (<span className="text-emerald-700 font-bold">Verified Partner</span>) and official state blood bank license number are locked and audited by LIFORA Super Admin. Hospitals cannot self-certify or approve their own license.
          </p>
        </div>

        {/* DETAILS FORM / VIEW */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Institution Details */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Hospital Information
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white disabled:bg-slate-50 disabled:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Address</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] bg-white disabled:bg-slate-50 disabled:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Phone</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={formData.officialEmail}
                    onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Bed Capacity</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={formData.bedCapacity}
                  onChange={(e) => setFormData({ ...formData, bedCapacity: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-50 font-mono"
                />
              </div>
            </div>

            {/* Blood Bank Officer Details */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Blood Bank In-Charge / Coordinator
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Officer Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.headName}
                  onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-50 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qualification</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.headQualification}
                  onChange={(e) => setFormData({ ...formData, headQualification: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Officer Phone</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.headPhone}
                    onChange={(e) => setFormData({ ...formData, headPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Officer Email</label>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={formData.headEmail}
                    onChange={(e) => setFormData({ ...formData, headEmail: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Component Facilities */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Accredited Component Separation Facilities
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.facilities.map((fac, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                      <span>{fac}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Updates</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
