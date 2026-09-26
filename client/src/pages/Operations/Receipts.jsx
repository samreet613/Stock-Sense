import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ArrowDownLeft, Plus, CheckCircle2, Search, Lock } from 'lucide-react';
import OperationModal from './OperationModal';
import { toast } from 'sonner';

export default function Receipts() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/operations?type=receipt${search ? `&search=${search}` : ''}`);
      setReceipts(data);
    } catch (err) {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [search]);

  const handleValidate = async (id, ref) => {
    if (!isManager) {
      toast.error('Access Denied: Only Inventory Managers can validate receipts and increment stock');
      return;
    }
    try {
      await apiRequest(`/operations/${id}/validate`, 'POST');
      toast.success(`Receipt ${ref} validated! Vendor stock added to inventory.`);
      fetchReceipts();
    } catch (err) {
      toast.error(err.message || 'Validation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowDownLeft className="w-6 h-6 text-emerald-400" /> Receipts (Incoming Goods)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Receive raw materials & finished goods from vendors → Validate to automatically increment stock.
          </p>
        </div>

        {isManager ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Create Receipt
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-400 rounded-xl text-xs font-medium border border-slate-700">
            <Lock className="w-3.5 h-3.5 text-amber-400" /> Validation Restricted (Manager Only)
          </div>
        )}
      </div>

      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt ref or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading receipt operations...</div>
        ) : receipts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No receipt documents found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-4">Reference No</th>
                  <th className="py-3.5 px-4">Supplier / Vendor</th>
                  <th className="py-3.5 px-4">Source → Target Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Validation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">{r.reference_no}</td>
                    <td className="py-3.5 px-4 text-slate-200 font-semibold">{r.partner_name || 'Vendor'}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {r.source_location_name} → <span className="text-emerald-400 font-semibold">{r.dest_location_name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          r.status === 'done'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status !== 'done' && r.status !== 'canceled' ? (
                        isManager ? (
                          <button
                            onClick={() => handleValidate(r.id, r.reference_no)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Validate (+Stock)
                          </button>
                        ) : (
                          <span className="text-amber-400 text-[11px] font-medium italic">Manager Approval Required</span>
                        )
                      ) : (
                        <span className="text-slate-500 text-xs italic font-mono">Stock Updated ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OperationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType="receipt"
        onSuccess={fetchReceipts}
      />
    </div>
  );
}
