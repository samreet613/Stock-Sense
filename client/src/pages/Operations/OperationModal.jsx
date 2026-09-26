import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { X, Boxes, Plus, Trash2, ArrowDownLeft, ArrowUpRight, Layers, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';

export default function OperationModal({ isOpen, onClose, defaultType = 'receipt', onSuccess }) {
  const [type, setType] = useState(defaultType);
  const [partnerName, setPartnerName] = useState('');
  const [sourceLocId, setSourceLocId] = useState('');
  const [destLocId, setDestLocId] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState([
    { product_id: '', demand_qty: 10 }
  ]);

  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setType(defaultType);
  }, [defaultType, isOpen]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const prodData = await apiRequest('/products');
        setProducts(prodData);
        if (prodData.length && items.length === 1 && !items[0].product_id) {
          setItems([{ product_id: prodData[0].id, demand_qty: 10 }]);
        }

        const locData = await apiRequest('/locations');
        setLocations(locData);
      } catch (err) {
        console.error(err);
      }
    }
    if (isOpen) {
      loadMeta();
    }
  }, [isOpen]);

  // Set intelligent default source/dest locations based on operation type
  useEffect(() => {
    if (!locations.length) return;

    const vendorLoc = locations.find((l) => l.type === 'vendor');
    const customerLoc = locations.find((l) => l.type === 'customer');
    const scrapLoc = locations.find((l) => l.type === 'inventory_loss');
    const internalLocs = locations.filter((l) => l.type === 'internal');

    if (type === 'receipt') {
      if (vendorLoc) setSourceLocId(vendorLoc.id);
      if (internalLocs.length) setDestLocId(internalLocs[0].id);
      setPartnerName('Apex Steel Corp');
    } else if (type === 'delivery') {
      if (internalLocs.length) setSourceLocId(internalLocs[0].id);
      if (customerLoc) setDestLocId(customerLoc.id);
      setPartnerName('Acme Enterprises');
    } else if (type === 'internal') {
      if (internalLocs.length >= 2) {
        setSourceLocId(internalLocs[0].id);
        setDestLocId(internalLocs[1].id);
      } else if (internalLocs.length === 1) {
        setSourceLocId(internalLocs[0].id);
        setDestLocId(internalLocs[0].id);
      }
      setPartnerName('Internal Assembly');
    } else if (type === 'adjustment') {
      if (internalLocs.length) setSourceLocId(internalLocs[0].id);
      if (scrapLoc) setDestLocId(scrapLoc.id);
      setPartnerName('Quality Control');
    }
  }, [type, locations]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (products.length) {
      setItems([...items, { product_id: products[0].id, demand_qty: 5 }]);
    }
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceLocId || !destLocId) {
      toast.error('Please select valid source and target locations');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/operations', 'POST', {
        type,
        partner_name: partnerName,
        source_location_id: parseInt(sourceLocId),
        dest_location_id: parseInt(destLocId),
        notes,
        items: items.map((i) => ({
          product_id: parseInt(i.product_id),
          demand_qty: parseFloat(i.demand_qty)
        }))
      });

      toast.success(`Created operation ${res.reference_no} in Draft state!`);

      // Ask if user wants to auto-validate right away
      if (window.confirm(`Document ${res.reference_no} created! Would you like to Validate & Apply Stock updates immediately?`)) {
        await apiRequest(`/operations/${res.id}/validate`, 'POST');
        toast.success(`Validated ${res.reference_no}! Stock levels updated.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create operation document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            {type === 'receipt' && <ArrowDownLeft className="w-5 h-5 text-emerald-400" />}
            {type === 'delivery' && <ArrowUpRight className="w-5 h-5 text-rose-400" />}
            {type === 'internal' && <Layers className="w-5 h-5 text-cyan-400" />}
            {type === 'adjustment' && <SlidersHorizontal className="w-5 h-5 text-amber-400" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 capitalize">
              New {type} Operation Document
            </h3>
            <p className="text-xs text-slate-400">Step 1: Draft document → Step 2: Validate stock ledger move</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Operation Type</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('receipt')}
                className={`py-2 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  type === 'receipt' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Receipt
              </button>
              <button
                type="button"
                onClick={() => setType('delivery')}
                className={`py-2 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  type === 'delivery' ? 'bg-rose-600/20 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => setType('internal')}
                className={`py-2 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  type === 'internal' ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Internal
              </button>
              <button
                type="button"
                onClick={() => setType('adjustment')}
                className={`py-2 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  type === 'adjustment' ? 'bg-amber-600/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Adjustment
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {type === 'receipt' ? 'Supplier / Vendor Name' : type === 'delivery' ? 'Customer Name' : 'Reference Partner / Reason'}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Steel Corp"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Source Location</label>
              <select
                value={sourceLocId}
                onChange={(e) => setSourceLocId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Location</label>
              <select
                value={destLocId}
                onChange={(e) => setDestLocId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                Operation Line Items & Quantities
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                + Add Item Line
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={item.product_id}
                  onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - {p.total_stock} {p.uom} available
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Qty"
                  value={item.demand_qty}
                  onChange={(e) => handleItemChange(idx, 'demand_qty', e.target.value)}
                  className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right font-mono"
                />

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 font-semibold text-white text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/25"
            >
              {loading ? 'Creating Document...' : `Create ${type} Document`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
