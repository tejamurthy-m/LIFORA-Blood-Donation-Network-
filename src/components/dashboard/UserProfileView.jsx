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
import StatusBadge from '../common/StatusBadge';

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
            <label className="block text-xs font-bold text-[#172033] mb-1.5">Email Address</label>
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
            <label className="block text-xs font-bold text-[#172033] mb-1.5">Phone Number</label>
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
    </div>
  );
}
