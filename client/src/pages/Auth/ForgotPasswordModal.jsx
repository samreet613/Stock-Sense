import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, KeyRound, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const { requestOTP, resetPassword } = useAuth();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [email, setEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await requestOTP(email);
      setGeneratedCode(res.code);
      setStep(2);
      toast.success(`OTP Code generated: ${res.code}`, {
        description: 'Simulated OTP delivered to your email/screen!'
      });
    } catch (err) {
      toast.error(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      toast.success('Password reset successfully!');
      onClose();
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">OTP Password Reset</h3>
            <p className="text-xs text-slate-400">Step {step} of 2 - Verify identity via 6-digit OTP</p>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="manager@stocksense.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              {loading ? 'Sending OTP...' : 'Generate 6-Digit OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {/* Live Developer OTP Display box */}
            {generatedCode && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-700/50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Simulated OTP Code:</span>
                </div>
                <span className="font-mono font-bold text-lg text-emerald-400 tracking-wider">
                  {generatedCode}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Enter 6-Digit OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-mono px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold text-white rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20"
            >
              {loading ? 'Verifying...' : 'Reset Password & Update'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
