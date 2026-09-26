import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Filter,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Building2,
  Tag,
  ArrowRight,
  Boxes
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import OperationModal from '../Operations/OperationModal';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    kpis: {
      totalProducts: 0,
      lowStockCount: 0,
      pendingReceipts: 0,
      pendingDeliveries: 0,
      scheduledTransfers: 0
    },
    recentOperations: [],
    categoryDistribution: []
  });

  // Dynamic Filters
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Operations dataset for filtered table
  const [operations, setOperations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('receipt');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/dashboard/stats');
      setStats(data);

      const whData = await apiRequest('/warehouses');
      setWarehouses(whData);

      const catData = await apiRequest('/products/meta/categories');
      setCategories(catData);
    } catch (err) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredOperations = async () => {
    try {
      const query = new URLSearchParams();
      if (docTypeFilter) query.append('type', docTypeFilter);
      if (statusFilter) query.append('status', statusFilter);
      if (warehouseFilter) query.append('warehouse_id', warehouseFilter);
      if (categoryFilter) query.append('category_id', categoryFilter);

      const opData = await apiRequest(`/operations?${query.toString()}`);
      setOperations(opData);
    } catch (err) {
      console.error('Error fetching operations:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchFilteredOperations();
  }, [docTypeFilter, statusFilter, warehouseFilter, categoryFilter]);

  const handleValidateQuick = async (id, ref) => {
    try {
      await apiRequest(`/operations/${id}/validate`, 'POST');
      toast.success(`Validated operation ${ref}`);
      fetchDashboardData();
      fetchFilteredOperations();
    } catch (err) {
      toast.error(err.message || 'Validation failed');
    }
  };

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live Operations Snapshot
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">StockSense Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Digitized inventory management, real-time stock balances & ledger audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setModalType('receipt');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + New Receipt
          </button>
          <button
            onClick={() => {
              setModalType('delivery');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Delivery Order
          </button>
          <button
            onClick={() => {
              setModalType('transfer');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Transfer
          </button>
          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Products */}
        <div
          onClick={() => navigate('/products')}
          className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Products</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats.kpis.totalProducts}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            Active SKUs in catalog <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* KPI 2: Low Stock */}
        <div
          onClick={() => navigate('/reordering')}
          className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Low Stock / Out</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.kpis.lowStockCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-1 flex items-center gap-1">
            Below min stock threshold <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* KPI 3: Pending Receipts */}
        <div
          onClick={() => {
            setDocTypeFilter('receipt');
            navigate('/operations/receipts');
          }}
          className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Pending Receipts</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.kpis.pendingReceipts}</div>
          <div className="text-[10px] text-slate-500 mt-1">Incoming vendor stock</div>
        </div>

        {/* KPI 4: Pending Deliveries */}
        <div
          onClick={() => {
            setDocTypeFilter('delivery');
            navigate('/operations/deliveries');
          }}
          className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Pending Deliveries</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 group-hover:bg-rose-600 group-hover:text-white transition-all">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400">{stats.kpis.pendingDeliveries}</div>
          <div className="text-[10px] text-slate-500 mt-1">Outgoing customer shipments</div>
        </div>

        {/* KPI 5: Scheduled Internal Transfers */}
        <div
          onClick={() => navigate('/operations/transfers')}
          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Internal Transfers</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-600 group-hover:text-white transition-all">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-400">{stats.kpis.scheduledTransfers}</div>
          <div className="text-[10px] text-slate-500 mt-1">Scheduled rack movements</div>
        </div>
      </div>

      {/* Inventory Flow Example Card (Matching Prompt Requirement) */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Inventory Flow Demonstration
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            Double-Entry Ledger Architecture
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 relative">
            <span className="absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-100">
              Step 1: Receipt
            </span>
            <h4 className="text-xs font-bold text-emerald-300 mt-1">Receive Goods</h4>
            <p className="text-[11px] text-slate-300 mt-1 font-medium">Receive 100 kg Steel Rods</p>
            <div className="text-xs font-bold text-emerald-400 mt-2">Stock: +100 kg</div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 relative">
            <span className="absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-800 text-cyan-100">
              Step 2: Internal Transfer
            </span>
            <h4 className="text-xs font-bold text-cyan-300 mt-1 font-medium">Rack Movement</h4>
            <p className="text-[11px] text-slate-300 mt-1 font-medium">Main Store → Production Floor</p>
            <div className="text-xs font-bold text-cyan-400 mt-2">Total unchanged, rack updated</div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40 relative">
            <span className="absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-800 text-rose-100">
              Step 3: Delivery
            </span>
            <h4 className="text-xs font-bold text-rose-300 mt-1 font-medium">Ship Finished Goods</h4>
            <p className="text-[11px] text-slate-300 mt-1 font-medium">Deliver 20 Chairs to Customer</p>
            <div className="text-xs font-bold text-rose-400 mt-2">Stock: –20 Units</div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 relative">
            <span className="absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-800 text-amber-100">
              Step 4: Adjustment
            </span>
            <h4 className="text-xs font-bold text-amber-300 mt-1 font-medium">Physical Mismatch Fix</h4>
            <p className="text-[11px] text-slate-300 mt-1 font-medium">3 kg steel damaged in store</p>
            <div className="text-xs font-bold text-amber-400 mt-2">Stock: –3 kg (Scrapped)</div>
          </div>
        </div>
      </div>

      {/* Dynamic Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Filter className="w-4 h-4" />
            <span>Dynamic Operations Filter</span>
          </div>
          {(docTypeFilter || statusFilter || warehouseFilter || categoryFilter) && (
            <button
              onClick={() => {
                setDocTypeFilter('');
                setStatusFilter('');
                setWarehouseFilter('');
                setCategoryFilter('');
              }}
              className="text-xs text-rose-400 hover:underline font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filter 1: Document Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-400" /> Document Type
            </label>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Document Types</option>
              <option value="receipt">Receipts (Incoming)</option>
              <option value="delivery">Delivery Orders (Outgoing)</option>
              <option value="internal">Internal Transfers</option>
              <option value="adjustment">Adjustments</option>
            </select>
          </div>

          {/* Filter 2: Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" /> Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          {/* Filter 3: Warehouse */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-400" /> Warehouse / Location
            </label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 4: Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-400" /> Product Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Split: Filtered Operations Table & Category Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Snapshot Table (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Operations Snapshot ({operations.length})
            </h3>
            <button
              onClick={() => navigate('/ledger')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              View Full Move History →
            </button>
          </div>

          {operations.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No operations match the selected dynamic filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                    <th className="pb-3 px-2">Ref No</th>
                    <th className="pb-3 px-2">Type</th>
                    <th className="pb-3 px-2">Source → Target</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {operations.slice(0, 8).map((op) => (
                    <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-2 font-mono font-semibold text-slate-200">{op.reference_no}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            op.type === 'receipt'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                              : op.type === 'delivery'
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                              : op.type === 'adjustment'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                              : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50'
                          }`}
                        >
                          {op.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-300 truncate max-w-[200px]">
                        {op.source_location_name} → {op.dest_location_name}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize ${
                            op.status === 'done'
                              ? 'bg-emerald-900/40 text-emerald-300'
                              : op.status === 'canceled'
                              ? 'bg-slate-800 text-slate-500'
                              : 'bg-amber-900/40 text-amber-300 animate-pulse'
                          }`}
                        >
                          {op.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {op.status !== 'done' && op.status !== 'canceled' ? (
                          <button
                            onClick={() => handleValidateQuick(op.id, op.reference_no)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-all shadow-sm"
                          >
                            Validate
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Stock Analytics Chart (1 col) */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              Category Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-4">Stock quantity by product category</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryDistribution}>
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="total_quantity" radius={[6, 6, 0, 0]}>
                  {stats.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <OperationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={modalType}
        onSuccess={() => {
          fetchDashboardData();
          fetchFilteredOperations();
        }}
      />
    </div>
  );
}
