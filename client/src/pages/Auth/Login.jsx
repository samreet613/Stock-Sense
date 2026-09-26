import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, Lock, Mail, ArrowRight, UserPlus, AlertCircle, X } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';
import { toast } from 'sonner';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Popup Modal state for USER_DOES_NOT_EXIST
  const [errorModal, setErrorModal] = useState({ show: false, message: '', code: '' });

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
      toast.error('Invalid Email Address', {
        description: 'Please enter a valid, active email address (e.g. user@domain.com)'
      });
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to StockSense!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.message.includes('User Does Not Exist') || err.message.includes('No account found')) {
        setErrorModal({
          show: true,
          code: 'USER_DOES_NOT_EXIST',
          message: 'User Does Not Exist! No registered account was found for this email address. Please register / sign up first.'
        });
      } else {
        toast.error('Login Failed', { description: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
            <Boxes className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
            Sign In to StockSense
          </h2>
          <p className="text-xs text-slate-400 mt-1">Modular Inventory Management System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="user@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Forgot Password / OTP?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Register First Prompt */}
        <div className="mt-8 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-center space-y-2">
          <p className="text-xs text-slate-300 font-medium">New user? Please register your account first.</p>
          <Link
            to="/register"
            className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Register / Sign Up First
          </Link>
        </div>
      </div>

      {/* Requirement 3: User Does Not Exist Popup Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/60 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setErrorModal({ show: false, message: '', code: '' })}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-rose-300">User Does Not Exist!</h3>
              <p className="text-xs text-slate-300 mt-2">{errorModal.message}</p>
            </div>

            <button
              onClick={() => navigate('/register')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Register / Sign Up Now
            </button>
          </div>
        </div>
      )}

      <ForgotPasswordModal isOpen={showForgot} onClose={() => setShowForgot(false)} />
    </div>
  );
}
