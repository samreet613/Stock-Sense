import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../services/api';
import { Search, Bell, AlertTriangle, ShieldCheck, Sun, Moon, Shield, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkLowStock() {
      try {
        const data = await apiRequest('/products?lowStockOnly=true');
        setLowStockCount(data.length);
        setLowStockItems(data);
      } catch (err) {
        console.error('Failed to load low stock count', err);
      }
    }
    checkLowStock();
  }, []);

  const isManager = user?.role === 'manager';

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="relative w-72">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search products, SKU, reference..."
          onClick={() => navigate('/products')}
          className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* User Authentic Role Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs">
          {isManager ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400">
              <Shield className="w-3.5 h-3.5 text-indigo-400" /> Inventory Manager
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Warehouse Staff
            </span>
          )}
        </div>

        {/* Light Mode / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 text-slate-300 hover:bg-slate-800 rounded-xl transition-all border border-slate-700/60 flex items-center gap-1.5 text-xs font-semibold"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-slate-300">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline text-slate-700">Dark</span>
            </>
          )}
        </button>

        {/* Low Stock Alerts Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 text-slate-300 hover:bg-slate-800 rounded-xl transition-all border border-slate-700/60"
          >
            <Bell className="w-4 h-4" />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                {lowStockCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Low Stock Warnings ({lowStockCount})</span>
                </div>
              </div>

              {lowStockItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">All stock levels are optimal.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowAlerts(false);
                        navigate('/reordering');
                      }}
                      className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{item.name}</div>
                        <div className="text-[10px] text-slate-400">SKU: {item.sku}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-rose-400">
                          {item.total_stock} {item.uom}
                        </span>
                        <div className="text-[10px] text-slate-500">Min: {item.min_stock}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setShowAlerts(false);
                  navigate('/reordering');
                }}
                className="w-full mt-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium rounded-lg text-center transition-all border border-indigo-500/30"
              >
                View Reordering Rules
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
