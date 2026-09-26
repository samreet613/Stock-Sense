import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, Lock, Mail, User, Shield, UserCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password, role);
      toast.success('Account created! Welcome to StockSense.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
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
            Create Account
          </h2>
          <p className="text-xs text-slate-400 mt-1">Join StockSense Inventory System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Samreet Kaur"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">User Role</label>
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
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
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
            {loading ? 'Creating Account...' : 'Sign Up'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
