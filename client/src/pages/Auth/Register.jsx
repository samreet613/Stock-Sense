import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, Lock, Mail, User, Shield, UserCheck, ArrowRight, AlertCircle, X, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [loading, setLoading] = useState(false);

  // Popup Modal state for validation issues
  const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '', code: '' });

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Syntax validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setErrorModal({
        show: true,
        title: 'Invalid Email Address',
        code: 'INVALID_EMAIL',
        message: 'Please enter a valid, active email address format (e.g. name@domain.com).'
      });
      return;
    }

    if (password.length < 6) {
      toast.error('Password too short', { description: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, role);
      toast.success('Account created successfully! Welcome to StockSense.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.message.includes('User Already Exists') || err.message.includes('already registered')) {
        setErrorModal({
          show: true,
          title: 'User Already Exists!',
          code: 'USER_ALREADY_EXISTS',
          message: 'An account with this email address is already registered in StockSense. Please sign in instead.'
        });
      } else if (err.message.includes('Invalid Email') || err.message.includes('does not exist')) {
        setErrorModal({
          show: true,
          title: 'Invalid Email Address!',
          code: 'INVALID_EMAIL',
          message: err.message
        });
      } else {
        toast.error('Registration Error', { description: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
            <Boxes className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
            User Registration
          </h2>
          <p className="text-xs text-slate-400 mt-1">Register first to access StockSense Inventory System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Samreet Kaur"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Valid Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="user@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Required for OTP verification and password recovery.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('manager')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  role === 'manager'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                <Shield className="w-4 h-4" />
                Inventory Manager
              </button>
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  role === 'staff'
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Warehouse Staff
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Validating & Registering...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Sign In Here
          </Link>
        </div>
      </div>

      {/* Requirement 1 & 2: Error Popup Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setErrorModal({ show: false, title: '', message: '', code: '' })}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
              errorModal.code === 'USER_ALREADY_EXISTS'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className={`text-lg font-bold ${
                errorModal.code === 'USER_ALREADY_EXISTS' ? 'text-amber-300' : 'text-rose-300'
              }`}>
                {errorModal.title}
              </h3>
              <p className="text-xs text-slate-300 mt-2">{errorModal.message}</p>
            </div>

            {errorModal.code === 'USER_ALREADY_EXISTS' ? (
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" /> Go to Sign In
              </button>
            ) : (
              <button
                onClick={() => setErrorModal({ show: false, title: '', message: '', code: '' })}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 text-xs rounded-xl transition-all"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
