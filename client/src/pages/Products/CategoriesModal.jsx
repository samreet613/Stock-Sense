import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Layers, Plus, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function CategoriesModal() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/products/meta/categories');
      setCategories(data);
    } catch (err) {
      toast.error('Failed to load categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await apiRequest('/products/meta/categories', 'POST', { name, description });
      toast.success('Category created');
      setName('');
      setDescription('');
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-400" /> Product Categories
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Organize items into modular operational categories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Category Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl h-fit">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" /> Create New Category
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Raw Materials"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Brief description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              {loading ? 'Creating...' : 'Add Category'}
            </button>
          </form>
        </div>

        {/* Existing Categories List (2 cols) */}
        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Active Product Categories ({categories.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-slate-200 text-sm">{c.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{c.description || 'No description provided'}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {c.product_count} SKUs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
