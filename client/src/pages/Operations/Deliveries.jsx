import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { ArrowUpRight, Plus, CheckCircle2, Search, PackageCheck } from 'lucide-react';
import OperationModal from './OperationModal';
import { toast } from 'sonner';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/operations?type=delivery${search ? `&search=${search}` : ''}`);
      setDeliveries(data);
    } catch (err) {
      toast.error('Failed to load delivery orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [search]);

  const handleValidate = async (id, ref) => {
    try {
      await apiRequest(`/operations/${id}/validate`, 'POST');
      toast.success(`Delivery Order ${ref} validated & shipped! Stock decremented automatically.`);
      fetchDeliveries();
    } catch (err) {
      toast.error(err.message || 'Validation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-rose-400" /> Delivery Orders (Outgoing Goods)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pick & Pack items for customer shipment → Validate to automatically decrease stock levels.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          + Delivery Order
        </button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search delivery ref or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading delivery orders...</div>
        ) : deliveries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No delivery documents found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-4">Reference No</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Source → Target Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Pack & Validate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">{d.reference_no}</td>
                    <td className="py-3.5 px-4 text-slate-200 font-semibold">{d.partner_name || 'Customer'}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="text-slate-200 font-semibold">{d.source_location_name}</span> → {d.dest_location_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          d.status === 'done'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {d.status !== 'done' && d.status !== 'canceled' ? (
                        <button
                          onClick={() => handleValidate(d.id, d.reference_no)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1"
                        >
                          <PackageCheck className="w-3.5 h-3.5" /> Validate (-Stock)
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs italic font-mono">Shipped ✓</span>
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
        defaultType="delivery"
        onSuccess={fetchDeliveries}
      />
    </div>
  );
}
