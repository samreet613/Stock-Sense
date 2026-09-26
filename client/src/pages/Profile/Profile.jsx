import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, ShieldCheck, Mail, Calendar, Shield, UserCheck, LogOut, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user, logout, switchRolePreview } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-3xl text-white shadow-xl shadow-indigo-500/20">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user?.email}</span>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                {user?.role === 'staff' ? 'Warehouse Staff' : 'Inventory Manager'}
              </span>
            </div>
          </div>
        </div>

        {/* Role Privileges Overview */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Active Role Privileges & Capabilities
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                <Shield className="w-4 h-4 text-indigo-400" /> Inventory Manager
              </div>
              <ul className="text-xs text-slate-400 space-y-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Create & edit product catalog & SKUs
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Configure warehouses & internal racks
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Validate stock movements & audit ledger
                </li>
              </ul>
            </div>

            <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                <UserCheck className="w-4 h-4 text-cyan-400" /> Warehouse Staff
              </div>
              <ul className="text-xs text-slate-400 space-y-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Perform internal transfers & shelving
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Pick & pack delivery orders
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Perform physical count adjustments
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Role Toggle */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">Test Role Preview Mode</div>
            <div className="text-[11px] text-slate-400">Switch between Manager and Staff roles instantly</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                switchRolePreview('manager');
                toast.info('Switched preview role to Manager');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                user?.role === 'manager'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Manager
            </button>
            <button
              onClick={() => {
                switchRolePreview('staff');
                toast.info('Switched preview role to Staff');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                user?.role === 'staff'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Staff
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            onClick={logout}
            className="w-full py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out of StockSense
          </button>
        </div>
      </div>
    </div>
  );
}
