import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  ShieldCheck,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  X,
  Edit2,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';

/**
 * Mask phone number helper: "+91 9876543210" -> "+91 ******3210"
 */
const maskPhoneNumber = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  const lastFour = digits.slice(-4);
  const prefix = phone.trim().startsWith('+') ? '+91 ' : '';
  return `${prefix}******${lastFour}`;
};

export default function OtpModal({
  isOpen,
  phone,
  onClose,
  onSuccess,
  onChangePhone,
  onSendOtp,
  onVerifyOtp,
  isSending = false,
  isVerifying = false,
  devOtp = '',
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('Verification code sent via SMS. Valid for 5 minutes.');
  const [expirySeconds, setExpirySeconds] = useState(300); // 5 minutes
  const inputRefs = useRef([]);

  // Auto focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setCountdown(60);
      setCanResend(false);
      setExpirySeconds(300);
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 150);
    }
  }, [isOpen]);

  // Resend cooldown timer (60 seconds)
  useEffect(() => {
    if (!isOpen) return;
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown, isOpen]);

  // Expiry countdown timer (5 minutes = 300 seconds)
  useEffect(() => {
    if (!isOpen) return;
    if (expirySeconds > 0) {
      const timer = setInterval(() => {
        setExpirySeconds((prev) => {
          if (prev <= 1) {
            setErrorMsg('Verification code has expired. Please request a new OTP.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [expirySeconds, isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index, value) => {
    setErrorMsg('');
    const cleanVal = value.replace(/\D/g, '');

    // Handle single digit input
    if (cleanVal.length <= 1) {
      const newDigits = [...digits];
      newDigits[index] = cleanVal;
      setDigits(newDigits);

      // Auto advance to next input if digit entered
      if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }

      // Auto submit when all 6 digits entered
      if (cleanVal && index === 5 && newDigits.every((d) => d !== '')) {
        handleVerify(newDigits.join(''));
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowLeft' && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);

    // Focus last filled or next input
    const nextIdx = Math.min(pastedData.length, 5);
    if (inputRefs.current[nextIdx]) {
      inputRefs.current[nextIdx].focus();
    }

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpToVerify) => {
    const code = otpToVerify || digits.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }
    setErrorMsg('');
    try {
      await onVerifyOtp(code);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.message || 'Incorrect or expired OTP code.';
      setErrorMsg(msg);
      // Select inputs for immediate correction
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }
  };

  const handleResend = async () => {
    if (!canResend || isSending) return;
    setErrorMsg('');
    try {
      await onSendOtp();
      setDigits(['', '', '', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      setExpirySeconds(300);
      setStatusMsg('New verification code sent via SMS. Valid for 5 minutes.');
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch new OTP. Please check gateway connection.');
    }
  };

  const formatExpiryTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-[#C1123F] to-[#9E0E32] px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">Mobile Phone Verification</h3>
                <p className="text-xs text-rose-100/90">LIFORA Secure Donor Network</p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Close verification modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-6 space-y-5">
            {/* Phone Info & Masked Display */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    SMS Sent To
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    {maskPhoneNumber(phone)}
                  </span>
                </div>
              </div>
              {onChangePhone && (
                <button
                  type="button"
                  onClick={onChangePhone}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#C1123F] hover:text-[#9E0E32] px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  Change
                </button>
              )}
            </div>

            {/* Dev Mode Banner (Only shown if local dev/test OTP is present) */}
            {devOtp && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span className="font-mono text-[11px]">
                  <strong>[Local Demo OTP]:</strong> {devOtp}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const otpArr = devOtp.slice(0, 6).split('');
                    setDigits(otpArr);
                    if (inputRefs.current[5]) inputRefs.current[5].focus();
                  }}
                  className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C1123F] flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMsg}</span>
              </motion.div>
            )}

            {/* Status Message */}
            {!errorMsg && statusMsg && (
              <p className="text-xs text-slate-600 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
                <span>Enter the 6-digit verification code delivered to your mobile phone.</span>
              </p>
            )}

            {/* 6-Box OTP Input */}
            <div className="flex justify-center items-center gap-2.5 sm:gap-3" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  autoComplete="one-time-code"
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={isVerifying}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-black rounded-2xl border transition-all focus:outline-none ${
                    digit
                      ? 'border-[#C1123F] bg-rose-50/40 text-[#C1123F] ring-2 ring-[#C1123F]/20'
                      : 'border-slate-200 bg-white text-slate-900 focus:border-[#C1123F] focus:ring-2 focus:ring-[#C1123F]/20'
                  }`}
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>

            {/* Expiry Timer Display */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Code expires in:{' '}
                <strong className={expirySeconds <= 60 ? 'text-[#C1123F]' : 'text-slate-800'}>
                  {formatExpiryTime(expirySeconds)}
                </strong>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={isVerifying || digits.some((d) => d === '')}
                className="w-full py-3.5 px-4 bg-[#C1123F] hover:bg-[#9E0E32] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#C1123F]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying OTP Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend OTP Row */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500">Didn't receive the SMS code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isSending}
                    className="font-bold text-[#C1123F] hover:text-[#9E0E32] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Resend OTP</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-slate-400 font-medium">
                    Resend available in <strong className="font-mono text-slate-600">{countdown}s</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
