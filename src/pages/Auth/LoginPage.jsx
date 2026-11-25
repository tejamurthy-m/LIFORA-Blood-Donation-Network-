import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, KeyRound } from 'lucide-react';
import LiforaLogo from '../../components/common/LiforaLogo';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('donor@lifora.org');
  const [password, setPassword] = useState('donor123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDemoPortal, setSelectedDemoPortal] = useState('donor');

  // Password Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'confirm'
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const res = await authService.forgotPassword(resetEmail);
      setResetStep('confirm');
      addToast({
        title: 'Reset Code Dispatched',
        message: res.message || 'Instructions and reset code sent to your email.',
        type: 'info',
      });
      if (res.devResetCode) {
        addToast({
          title: 'Development Reset Code',
          message: `Code: ${res.devResetCode}`,
          type: 'warning',
        });
      }
    } catch (err) {
      addToast({
        title: 'Request Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handlePerformReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await authService.resetPassword({
        email: resetEmail,
        resetCode,
        newPassword,
      });
      addToast({
        title: 'Password Reset Successful 🎉',
        message: 'Your password has been changed. Please log in with your new credentials.',
        type: 'success',
      });
      setResetModalOpen(false);
      setResetStep('request');
      setPassword(newPassword);
      setEmail(resetEmail);
      setResetCode('');
      setNewPassword('');
    } catch (err) {
      addToast({
        title: 'Reset Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      addToast({
        title: `Welcome back, ${user.name}!`,
        message: `Signed in as ${user.role.toUpperCase()}. Redirecting to dashboard...`,
        type: 'success',
      });

      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'donor') {
        navigate('/donor/dashboard', { replace: true });
      } else if (user.role === 'recipient') {
        navigate('/recipient/dashboard', { replace: true });
      } else if (user.role === 'hospital') {
        navigate('/hospital/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center bg-[#FAF9F6] relative overflow-hidden">
      {/* Background glow elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C1123F]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <LiforaLogo size="lg" withTagline={true} className="justify-center" />
        <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
          Sign In to LIFORA
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#64748B]">
          Access your donor dashboard or emergency request manager
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-900/5 rounded-3xl border border-slate-200/90 space-y-6">
          {/* Quick Demo Fill Buttons */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Instant Demo Access:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDemoPortal('donor');
                  handleQuickDemo('donor@lifora.org', 'donor123');
                }}
                className={`py-2 px-2 text-[11px] font-semibold rounded-xl border transition-all text-center shadow-2xs cursor-pointer ${
                  selectedDemoPortal === 'donor'
                    ? 'bg-rose-50 border-[#C1123F] text-[#C1123F] font-bold'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                🩸 Donor
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDemoPortal('recipient');
                  handleQuickDemo('recipient@lifora.org', 'recipient123');
                }}
                className={`py-2 px-2 text-[11px] font-semibold rounded-xl border transition-all text-center shadow-2xs cursor-pointer ${
                  selectedDemoPortal === 'recipient'
                    ? 'bg-rose-50 border-[#C1123F] text-[#C1123F] font-bold'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                🏥 Recipient
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDemoPortal('hospital');
                  handleQuickDemo('hospital@lifora.org', 'hospital123');
                }}
                className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all text-center shadow-2xs cursor-pointer ${
                  selectedDemoPortal === 'hospital'
                    ? 'bg-[#C1123F] border-[#C1123F] text-white'
                    : 'bg-rose-50 border-rose-200 text-[#C1123F] hover:bg-rose-100'
                }`}
              >
                🏢 Hospital ▾
              </button>
            </div>

            {/* Expandable Hospital Staff Accounts (RBAC) */}
            {selectedDemoPortal === 'hospital' && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Hospital Staff Roles:</span>
                  <span className="text-[#C1123F] font-semibold">Auto-detects role on sign-in</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-left">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('hospital@lifora.org', 'hospital123')}
                    className={`p-2 rounded-xl border text-[11px] transition-all cursor-pointer ${
                      email === 'hospital@lifora.org'
                        ? 'bg-rose-50 border-[#C1123F] text-[#C1123F] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <span>👑 Admin</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">Dr. Anita Joshi</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('requests@lilavati.org', 'hospital123')}
                    className={`p-2 rounded-xl border text-[11px] transition-all cursor-pointer ${
                      email === 'requests@lilavati.org'
                        ? 'bg-rose-50 border-[#C1123F] text-[#C1123F] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <span>📋 Requisitions</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">Rajesh Kadam</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('coordinator@lilavati.org', 'hospital123')}
                    className={`p-2 rounded-xl border text-[11px] transition-all cursor-pointer ${
                      email === 'coordinator@lilavati.org'
                        ? 'bg-rose-50 border-[#C1123F] text-[#C1123F] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <span>🤝 Coordinator</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">Sneha Fernandez</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('medical@lilavati.org', 'hospital123')}
                    className={`p-2 rounded-xl border text-[11px] transition-all cursor-pointer ${
                      email === 'medical@lilavati.org'
                        ? 'bg-rose-50 border-[#C1123F] text-[#C1123F] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <span>🩺 Clinical Staff</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">Dr. Vikram Malhotra</div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C1123F] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email || '');
                    setResetStep('request');
                    setResetModalOpen(true);
                  }}
                  className="text-xs font-semibold text-[#C1123F] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#C1123F] focus:ring-[#C1123F] border-slate-300 accent-[#C1123F]"
                />
                <span className="text-xs text-slate-600 font-medium">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white font-bold text-sm shadow-md shadow-[#C1123F]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-[#64748B]">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-[#C1123F] hover:underline">
              Register as Donor or Recipient
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Password Reset Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Account Password"
        subtitle="Recover access to your LIFORA account"
        maxWidth="max-w-md"
      >
        {resetStep === 'request' ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter your registered email address. We will dispatch a single-use 6-digit reset code.
            </p>
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="px-5 py-2 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold flex items-center gap-2"
              >
                {resetLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Send Reset Code
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePerformReset} className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter the 6-digit reset code sent to <strong>{resetEmail}</strong> and specify your new password.
            </p>
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">6-Digit Reset Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[8px] text-xl font-bold py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setResetStep('request')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={resetLoading || resetCode.length !== 6 || newPassword.length < 6}
                className="px-5 py-2 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold flex items-center gap-2 disabled:bg-slate-300"
              >
                {resetLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Reset Password
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
