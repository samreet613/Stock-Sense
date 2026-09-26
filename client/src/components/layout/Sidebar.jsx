import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  History,
  Settings,
  User,
  LogOut,
  Layers,
  ShieldCheck,
  TrendingDown,
  Warehouse
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard
    },
    {
      title: 'Products',
      path: '/products',
      icon: Package,
      submenu: [
        { title: 'All Products', path: '/products' },
        { title: 'Categories', path: '/categories' },
        { title: 'Reordering Rules', path: '/reordering' }
      ]
    },
    {
      title: 'Operations',
      path: '/operations/receipts',
      icon: Boxes,
      submenu: [
        { title: 'Receipts (Incoming)', path: '/operations/receipts', icon: ArrowDownLeft },
        { title: 'Delivery Orders (Outgoing)', path: '/operations/deliveries', icon: ArrowUpRight },
        { title: 'Inventory Adjustment', path: '/operations/adjustments', icon: SlidersHorizontal },
        { title: 'Internal Transfers', path: '/operations/transfers', icon: Layers },
        { title: 'Move History', path: '/ledger', icon: History }
      ]
    },
    {
      title: 'Settings',
      path: '/settings/warehouses',
      icon: Settings,
      submenu: [
        { title: 'Warehouses & Locations', path: '/settings/warehouses', icon: Warehouse }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              StockSense
            </h1>
            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/50">
              Inventory OS
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]">
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Main Menu
            </p>
            <div className="space-y-1">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
            </div>
          </div>

          {/* Products Group */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Catalog
            </p>
            <div className="space-y-1">
              <NavLink
                to="/products"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Package className="w-4 h-4" />
                <span>Products & Stock</span>
              </NavLink>
              <NavLink
                to="/categories"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Layers className="w-4 h-4" />
                <span>Categories</span>
              </NavLink>
              <NavLink
                to="/reordering"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <TrendingDown className="w-4 h-4" />
                <span>Reordering Rules</span>
              </NavLink>
            </div>
          </div>

          {/* Operations Group */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Stock Operations
            </p>
            <div className="space-y-1">
              <NavLink
                to="/operations/receipts"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>1. Receipts</span>
              </NavLink>
              <NavLink
                to="/operations/deliveries"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                <span>2. Delivery Orders</span>
              </NavLink>
              <NavLink
                to="/operations/adjustments"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>3. Adjustments</span>
              </NavLink>
              <NavLink
                to="/operations/transfers"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>4. Internal Transfers</span>
              </NavLink>
              <NavLink
                to="/ledger"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <History className="w-4 h-4 text-indigo-400" />
                <span>5. Move History</span>
              </NavLink>
            </div>
          </div>

          {/* Settings */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              System
            </p>
            <div className="space-y-1">
              <NavLink
                to="/settings/warehouses"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Warehouse className="w-4 h-4" />
                <span>Warehouses</span>
              </NavLink>
            </div>
          </div>
        </nav>
      </div>

      {/* Profile Menu (Left Sidebar Footer) */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'User'}</h4>
              <span className="inline-flex items-center gap-1 text-[10px] text-indigo-300 capitalize">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                {user?.role === 'staff' ? 'Warehouse Staff' : 'Inventory Manager'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/profile')}
              title="My Profile"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-md transition-all"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-md transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
