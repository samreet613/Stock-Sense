import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Layers, Plus, CheckCircle2, Search } from 'lucide-react';
import OperationModal from './OperationModal';
import { toast } from 'sonner';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/operations?type=internal${search ? `&search=${search}` : ''}`);
      setTransfers(data);
    } catch (err) {
      toast.error('Failed to load internal transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [search]);

  const handleValidate = async (id, ref) => {
    try {
      await apiRequest(`/operations/${id}/validate`, 'POST');
      toast.success(`Internal Transfer ${ref} validated! Rack positions updated.`);
      fetchTransfers();
    } catch (err) {
      toast.error(err.message || 'Validation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" /> Internal Transfers
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Relocate stock inside the company: Main Warehouse → Production Floor | Rack A → Rack B
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-cyan-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          + Internal Transfer
        </button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transfer ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading transfer documents...</div>
        ) : transfers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No transfer documents found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-4">Reference No</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-4">Source Location → Target Rack</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Validation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">{t.reference_no}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-semibold">{t.partner_name || 'Internal'}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {t.source_location_name} → <span className="text-cyan-400 font-semibold">{t.dest_location_name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          t.status === 'done'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {t.status !== 'done' && t.status !== 'canceled' ? (
                        <button
                          onClick={() => handleValidate(t.id, t.reference_no)}
                          className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Validate Move
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs italic font-mono">Transferred ✓</span>
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
        defaultType="internal"
        onSuccess={fetchTransfers}
      />
    </div>
  );
}
