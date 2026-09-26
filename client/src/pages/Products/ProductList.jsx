import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  Warehouse,
  Tag,
  Boxes
} from 'lucide-react';
import ProductModal from './ProductModal';
import { toast } from 'sonner';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (categoryFilter) query.append('category', categoryFilter);

      const data = await apiRequest(`/products?${query.toString()}`);
      let filtered = data;

      if (statusFilter === 'low_stock') {
        filtered = filtered.filter((p) => p.total_stock <= p.min_stock);
      } else if (statusFilter === 'optimal') {
        filtered = filtered.filter((p) => p.total_stock > p.min_stock);
      }

      setProducts(filtered);

      const catData = await apiRequest('/products/meta/categories');
      setCategories(catData);
    } catch (err) {
      toast.error('Failed to load products list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, statusFilter]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await apiRequest(`/products/${id}`, 'DELETE');
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" /> Products Catalog & Availability
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage product Master Data, SKU codes, UOM, and multi-location availability
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Create Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Stock Statuses</option>
            <option value="low_stock">⚠️ Low Stock Alerts</option>
            <option value="optimal">✅ Optimal Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading catalog items...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-4">Product & SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Total Stock</th>
                  <th className="py-3.5 px-4">Stock per Location</th>
                  <th className="py-3.5 px-4">Reordering Limits</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Product Name & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{item.name}</div>
                      <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-800/40">
                        {item.sku}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {item.category_name || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Total Stock */}
                    <td className="py-3.5 px-4 font-bold text-sm">
                      <span className={item.total_stock <= item.min_stock ? 'text-rose-400' : 'text-emerald-400'}>
                        {item.total_stock} {item.uom}
                      </span>
                    </td>

                    {/* Stock Availability per Location */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {item.locations && item.locations.length > 0 ? (
                          item.locations.map((loc, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                              <Warehouse className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="truncate max-w-[140px]">{loc.location_name}:</span>
                              <span className="font-bold text-slate-100">{loc.quantity}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No stock in warehouse</span>
                        )}
                      </div>
                    </td>

                    {/* Reordering Rules Limits */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-400 font-mono">
                      Min: <span className="text-amber-400">{item.min_stock}</span> | Max:{' '}
                      <span className="text-slate-300">{item.max_stock}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {item.total_stock <= item.min_stock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60">
                          <AlertTriangle className="w-3 h-3 text-rose-400" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Optimal
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedProduct(item);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-all"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
