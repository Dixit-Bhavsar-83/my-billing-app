import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

export default function ManualModal({ barcode, onSave, onClose }) {
  const [form, setForm] = useState({
    barcode: barcode || '',
    name: '', brand: '', category: '', image_url: '',
    selling_price: '', mrp: '', stock: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Add Product Manually</h2>
            {barcode && <p className="text-xs text-slate-500 mt-0.5">Barcode: <span className="font-mono text-indigo-300">{barcode}</span></p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {[
            { label: 'Product Name *', key: 'name',       placeholder: 'e.g. Parle-G Biscuits' },
            { label: 'Brand',          key: 'brand',      placeholder: 'e.g. Parle' },
            { label: 'Category',       key: 'category',   placeholder: 'e.g. Biscuits' },
            { label: 'Image URL',      key: 'image_url',  placeholder: 'https://...' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1 font-medium">{label}</label>
              <input
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          ))}

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Selling Price (₹)', key: 'selling_price', placeholder: '0' },
              { label: 'MRP (₹)',           key: 'mrp',           placeholder: '0' },
              { label: 'Initial Stock',     key: 'stock',         placeholder: '0' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1 font-medium">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
            className="btn-ripple flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
