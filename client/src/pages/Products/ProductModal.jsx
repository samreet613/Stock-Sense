import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { X, Package, Tag, Warehouse } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductModal({ isOpen, onClose, product, onSuccess }) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [uom, setUom] = useState('Units');
  const [minStock, setMinStock] = useState(10);
  const [maxStock, setMaxStock] = useState(100);
  const [initialStock, setInitialStock] = useState(0);
  const [initialLocationId, setInitialLocationId] = useState('');

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const cats = await apiRequest('/products/meta/categories');
        setCategories(cats);
        const locs = await apiRequest('/locations?type=internal');
        setLocations(locs);
        if (locs.length && !initialLocationId) {
          setInitialLocationId(locs[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setCategoryId(product.category_id || '');
      setUom(product.uom || 'Units');
      setMinStock(product.min_stock !== undefined ? product.min_stock : 10);
      setMaxStock(product.max_stock !== undefined ? product.max_stock : 100);
    } else {
      setName('');
      setSku('');
      setCategoryId('');
      setUom('Units');
      setMinStock(10);
      setMaxStock(100);
      setInitialStock(0);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product) {
        await apiRequest(`/products/${product.id}`, 'PUT', {
          name,
          sku,
          category_id: categoryId ? parseInt(categoryId) : null,
          uom,
          min_stock: parseFloat(minStock),
          max_stock: parseFloat(maxStock)
        });
        toast.success('Product updated successfully!');
      } else {
        await apiRequest('/products', 'POST', {
          name,
          sku,
          category_id: categoryId ? parseInt(categoryId) : null,
          uom,
          min_stock: parseFloat(minStock),
          max_stock: parseFloat(maxStock),
          initial_stock: parseFloat(initialStock),
          initial_location_id: initialLocationId ? parseInt(initialLocationId) : null
        });
        toast.success('Product created successfully!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {product ? 'Edit Product Catalog Item' : 'Create New Product'}
            </h3>
            <p className="text-xs text-slate-400">Specify SKU code, category, UOM, and stock limits</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Steel Rods 12mm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SKU / Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. STEEL-ROD-01"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measure (UOM)</label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Units">Units</option>
                <option value="kg">kg (Kilograms)</option>
                <option value="Meters">Meters</option>
                <option value="Packs">Packs</option>
                <option value="Liters">Liters</option>
                <option value="Boxes">Boxes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-400" /> Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reordering rules threshold */}
          <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
            <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
              Reordering Rules & Safety Stock Limits
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Min Stock Alert Limit</label>
                <input
                  type="number"
                  step="0.01"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Max Stock Target Limit</label>
                <input
                  type="number"
                  step="0.01"
                  value={maxStock}
                  onChange={(e) => setMaxStock(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Initial Stock (Only for new product creation) */}
          {!product && (
            <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
              <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                Initial Opening Stock (Optional)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Warehouse className="w-3 h-3 text-emerald-400" /> Storage Location
                  </label>
                  <select
                    value={initialLocationId}
                    onChange={(e) => setInitialLocationId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20"
            >
              {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product Catalog Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
