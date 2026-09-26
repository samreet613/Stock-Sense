import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, Lock, Mail, Shield, UserCheck, ArrowRight } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';
import { toast } from 'sonner';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to StockSense!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, roleName) => {
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
      toast.success(`Logged in as ${roleName}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient glow */}
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
          <p className="text-xs text-slate-400 mt-1">Modular Inventory Management & Stock Operations</p>
        </div>

        {/* Quick Demo Login Buttons */}
        <div className="mb-6 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
            ⚡ Quick Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('manager@stocksense.com', 'Inventory Manager')}
              className="py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              Manager
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('staff@stocksense.com', 'Warehouse Staff')}
              className="py-2 px-3 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 rounded-xl text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Staff
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="manager@stocksense.com"
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
                Forgot / OTP Reset?
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

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Create Account
          </Link>
        </div>
      </div>

      <ForgotPasswordModal isOpen={showForgot} onClose={() => setShowForgot(false)} />
    </div>
  );
}
