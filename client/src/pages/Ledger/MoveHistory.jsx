import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { History, Search, ArrowDownLeft, ArrowUpRight, Layers, SlidersHorizontal, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

export default function MoveHistory() {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchMoveHistory = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/ledger${search ? `?search=${search}` : ''}`);
      setMoves(data);
    } catch (err) {
      toast.error('Failed to load move history ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoveHistory();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" /> Stock Ledger & Move History
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable double-entry stock audit trail logging every inventory movement with timestamps.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reference, product, SKU, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit ledger logs...</div>
        ) : moves.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No stock move history recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Ref Document</th>
                  <th className="py-3.5 px-4">Product & SKU</th>
                  <th className="py-3.5 px-4">Source Location</th>
                  <th className="py-3.5 px-4">Target Location</th>
                  <th className="py-3.5 px-4">Quantity Moved</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4 text-right">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {moves.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{m.reference_no}</td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{m.product_name}</div>
                      <span className="font-mono text-[10px] text-indigo-400">{m.product_sku}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{m.source_location_name}</div>
                      {m.source_warehouse_name && (
                        <div className="text-[10px] text-slate-500">{m.source_warehouse_name}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{m.dest_location_name}</div>
                      {m.dest_warehouse_name && (
                        <div className="text-[10px] text-slate-500">{m.dest_warehouse_name}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-sm font-mono text-slate-100">
                      {m.qty} {m.product_uom}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          m.movement_type === 'receipt'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                            : m.movement_type === 'delivery'
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                            : m.movement_type === 'adjustment'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                            : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50'
                        }`}
                      >
                        {m.movement_type === 'receipt' && <ArrowDownLeft className="w-3 h-3" />}
                        {m.movement_type === 'delivery' && <ArrowUpRight className="w-3 h-3" />}
                        {m.movement_type === 'internal' && <Layers className="w-3 h-3" />}
                        {m.movement_type === 'adjustment' && <SlidersHorizontal className="w-3 h-3" />}
                        {m.movement_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400 font-medium text-[11px]">
                      <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-md text-slate-300">
                        <User className="w-3 h-3 text-slate-400" />
                        {m.created_by || 'System'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
