import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Warehouse, Plus, MapPin, Building, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Warehouse form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');

  // New Location form
  const [selectedWhId, setSelectedWhId] = useState('');
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/warehouses');
      setWarehouses(data);
      if (data.length && !selectedWhId) {
        setSelectedWhId(data[0].id);
      }
    } catch (err) {
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    try {
      await apiRequest('/warehouses', 'POST', { name, code, address });
      toast.success('Warehouse created successfully');
      setName('');
      setCode('');
      setAddress('');
      fetchWarehouses();
    } catch (err) {
      toast.error(err.message || 'Failed to create warehouse');
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    if (!locName.trim() || !locCode.trim() || !selectedWhId) return;
    try {
      await apiRequest('/locations', 'POST', {
        warehouse_id: parseInt(selectedWhId),
        name: locName,
        code: locCode,
        type: 'internal'
      });
      toast.success('Storage location rack created');
      setLocName('');
      setLocCode('');
      fetchWarehouses();
    } catch (err) {
      toast.error(err.message || 'Failed to create location');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Warehouse className="w-6 h-6 text-indigo-400" /> Multi-Warehouse & Location Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure physical storage facilities, internal racks, shelves, and receiving bays
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Forms (1 col) */}
        <div className="space-y-6">
          {/* Add Warehouse Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Add Warehouse Facility
            </h3>
            <form onSubmit={handleCreateWarehouse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Warehouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WH-MAIN"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="100 Industrial Parkway..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              >
                + Create Warehouse
              </button>
            </form>
          </div>

          {/* Add Rack / Shelf Location Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" /> Add Storage Rack / Location
            </h3>
            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Warehouse</label>
                <select
                  value={selectedWhId}
                  onChange={(e) => setSelectedWhId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Rack Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Store - Rack B"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rack Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WH-MAIN/RACK-B"
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 font-semibold text-white text-xs rounded-xl transition-all shadow-lg shadow-cyan-600/20"
              >
                + Create Location
              </button>
            </form>
          </div>
        </div>

        {/* Existing Warehouses List (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{wh.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-indigo-400 font-semibold">{wh.code}</span>
                      {wh.address && <span>• {wh.address}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {wh.locations ? wh.locations.length : 0} Racks / Racks
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {wh.locations && wh.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{loc.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{loc.code}</div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-900">
                      {loc.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
