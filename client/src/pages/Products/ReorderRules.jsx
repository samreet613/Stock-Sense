import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { TrendingDown, AlertTriangle, Plus, CheckCircle2, ArrowDownLeft, RefreshCw } from 'lucide-react';
import OperationModal from '../Operations/OperationModal';
import { toast } from 'sonner';

export default function ReorderRules() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReorderItems = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/products');
      setProducts(data);
    } catch (err) {
      toast.error('Failed to load reordering rules data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReorderItems();
  }, []);

  const lowStockItems = products.filter((p) => p.total_stock <= p.min_stock);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-amber-400" /> Reordering Rules & Replenishment
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated stock threshold monitoring and vendor receipt creation
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          + Create Purchase Receipt
        </button>
      </div>

      {/* Low Stock Alert Header Box */}
      <div className="bg-amber-950/30 border border-amber-800/50 p-5 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-300">
              Low Stock Warnings ({lowStockItems.length} items require replenishment)
            </h3>
            <p className="text-xs text-slate-400">
              Items currently at or below minimum safety stock threshold.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading reordering rules...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-4">Product Name & SKU</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Min Stock (Alert)</th>
                  <th className="py-3.5 px-4">Max Stock (Target)</th>
                  <th className="py-3.5 px-4">Suggested Reorder Qty</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {products.map((p) => {
                  const isLow = p.total_stock <= p.min_stock;
                  const suggestedQty = Math.max(0, p.max_stock - p.total_stock);

                  return (
                    <tr
                      key={p.id}
                      className={isLow ? 'bg-amber-950/10 hover:bg-amber-950/20' : 'hover:bg-slate-800/40'}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">{p.name}</div>
                        <span className="font-mono text-[10px] text-indigo-400">{p.sku}</span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-sm">
                        <span className={isLow ? 'text-rose-400' : 'text-emerald-400'}>
                          {p.total_stock} {p.uom}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-amber-400 font-mono font-semibold">
                        {p.min_stock} {p.uom}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {p.max_stock} {p.uom}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                        {suggestedQty > 0 ? `+${suggestedQty} ${p.uom}` : '0 (Optimal)'}
                      </td>

                      <td className="py-3.5 px-4">
                        {isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60">
                            Reorder Required
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                            Stock Optimal
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isLow && (
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1 ml-auto"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" /> Order Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OperationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType="receipt"
        onSuccess={fetchReorderItems}
      />
    </div>
  );
}
