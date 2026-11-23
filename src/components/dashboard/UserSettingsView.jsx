import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Shield,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  Radio,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ConfirmationDialog from '../common/ConfirmationDialog';

export default function UserSettingsView() {
  const { user, role, updateProfile } = useAuth();
  const { addToast } = useToast();

  // Notification Preferences
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [emergencyRadius, setEmergencyRadius] = useState(15);

  // Privacy Preferences
  const [privacySafeName, setPrivacySafeName] = useState(true);
  const [hideExactLocation, setHideExactLocation] = useState(true);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Danger Dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    addToast({
      title: 'Preferences Saved',
      message: 'Your notification, privacy, and dispatch settings have been updated.',
      type: 'success',
    });
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast({ title: 'Validation', message: 'Enter your current password.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      addToast({ title: 'Validation', message: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({ title: 'Validation', message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    addToast({
      title: 'Password Updated',
      message: 'Your security credentials have been updated successfully.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Notifications & Alerts Settings */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C1123F] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#172033]">
              Notifications & Emergency Alerts
            </h3>
            <p className="text-xs text-[#64748B]">
              Configure how and when you receive urgent hospital requests
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div>
              <div className="font-bold text-xs text-[#172033]">Instant SMS Alerts</div>
              <div className="text-[11px] text-slate-500">
                Receive immediate SMS text notifications for emergency cross-match broadcasts
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSmsAlerts(!smsAlerts)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                smsAlerts ? 'bg-[#16A36A]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  smsAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div>
              <div className="font-bold text-xs text-[#172033]">Email Digest & Coordination Reports</div>
              <div className="text-[11px] text-slate-500">
                Receive donation certificates and hospital fulfillment summaries via email
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                emailAlerts ? 'bg-[#16A36A]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  emailAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div>
              <div className="font-bold text-xs text-[#172033]">Emergency Audio Alert Chimes</div>
              <div className="text-[11px] text-slate-500">
                Play an audible tone when a critical high-priority surgical emergency arrives
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSoundAlerts(!soundAlerts)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                soundAlerts ? 'bg-[#16A36A]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  soundAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Emergency Alert Radius */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#172033]">
                Maximum Notification Radius:
              </span>
              <span className="text-xs font-extrabold text-[#C1123F]">
                {emergencyRadius} km
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={emergencyRadius}
              onChange={(e) => setEmergencyRadius(Number(e.target.value))}
              className="w-full accent-[#C1123F] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>5 km (Local)</span>
              <span>25 km (Citywide)</span>
              <span>50 km (Metropolitan)</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="px-5 py-2.5 rounded-xl bg-[#C1123F] text-white text-xs font-bold hover:bg-[#9E0E32] transition-colors"
          >
            Save Alert Preferences
          </button>
        </div>
      </div>

      {/* 2. Privacy & Identity Controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#172033]">
              Medical Privacy & Profile Visibility
            </h3>
            <p className="text-xs text-[#64748B]">
              Controls how your identity is displayed to patients and searchers
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div>
              <div className="font-bold text-xs text-[#172033]">Privacy-Safe Display Name</div>
              <div className="text-[11px] text-slate-500">
                Display abbreviated name (e.g. "Dr. Aryan S.") publicly on search cards
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPrivacySafeName(!privacySafeName)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                privacySafeName ? 'bg-[#16A36A]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  privacySafeName ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div>
              <div className="font-bold text-xs text-[#172033]">Shield Exact Residential Address</div>
              <div className="text-[11px] text-slate-500">
                Show only city and broad locality; never expose exact street or building number
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHideExactLocation(!hideExactLocation)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                hideExactLocation ? 'bg-[#16A36A]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  hideExactLocation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Security & Password Update */}
      <form onSubmit={handleUpdatePassword} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#172033]">
              Security & Credentials
            </h3>
            <p className="text-xs text-[#64748B]">
              Update your account password and authentication tokens
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Current Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 chars"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#172033] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Update Password
          </button>
        </div>
      </form>

      {/* 4. Danger Zone */}
      <div className="bg-rose-50/50 rounded-3xl p-6 sm:p-8 border border-rose-200 space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#C1123F]" />
          <div>
            <h4 className="font-bold text-sm text-[#C1123F]">Account Management & Deactivation</h4>
            <p className="text-xs text-slate-600">
              Temporarily pause participation or purge clinical request history
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setConfirmDialogOpen(true)}
            className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-xs font-bold text-[#C1123F] hover:bg-rose-100 transition-colors"
          >
            Deactivate / Pause Account
          </button>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={() => {
          setConfirmDialogOpen(false);
          addToast({
            title: 'Account Paused',
            message: 'Your account is temporarily paused. Re-login at any time to resume.',
            type: 'info',
          });
        }}
        title="Pause LIFORA Account"
        message="Are you sure you want to pause your account? You will not appear in local blood donor searches until you sign back in."
        confirmText="Confirm Pause"
        type="warning"
      />
    </div>
  );
}
