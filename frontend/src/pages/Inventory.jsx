import React, { useEffect, useState, useMemo } from 'react';
import {
  Search, Package, Pencil, Trash2, ChevronUp, ChevronDown,
  Plus, RefreshCw, X, Save, ShoppingCart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

function EditModal({ product, onSave, onClose }) {
  const [form, setForm] = useState({ ...product });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Edit Product</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {[
            { label: 'Name *',    key: 'name'      },
            { label: 'Brand',     key: 'brand'     },
            { label: 'Category',  key: 'category'  },
            { label: 'Image URL', key: 'image_url' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1 font-medium">{label}</label>
              <input value={form[key] || ''} onChange={e => set(key, e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Selling ₹', key: 'selling_price' },
              { label: 'MRP ₹',     key: 'mrp'           },
              { label: 'Stock',     key: 'stock'         },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1 font-medium">{label}</label>
                <input type="number" min="0" value={form[key] || 0} onChange={e => set(key, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(form)}
            className="btn-ripple flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

const COLS = [
  { key: 'name',          label: 'Product'       },
  { key: 'brand',         label: 'Brand'         },
  { key: 'category',      label: 'Category'      },
  { key: 'selling_price', label: 'Price'         },
  { key: 'mrp',           label: 'MRP'           },
  { key: 'stock',         label: 'Stock'         },
];

export default function Inventory({ setPage }) {
  const { products, fetchProducts, updateProduct, deleteProduct, addToCart, addToast } = useApp();
  const [search, setSearch]   = useState('');
  const [sort,   setSort]     = useState({ key: 'id', dir: 'desc' });
  const [editP,  setEditP]    = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setLoading(true); fetchProducts().finally(() => setLoading(false)); }, []); // eslint-disable-line

  const handleSearch = (v) => { setSearch(v); fetchProducts(v); };

  const sorted = useMemo(() => {
    const list = [...products];
    list.sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return list;
  }, [products, sort]);

  const toggleSort = (key) => setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const SortIcon = ({ k }) => (
    sort.key === k
      ? sort.dir === 'asc' ? <ChevronUp size={12} className="text-indigo-400" /> : <ChevronDown size={12} className="text-indigo-400" />
      : <ChevronDown size={12} className="text-slate-700" />
  );

  const handleEdit = async (form) => {
    try {
      await updateProduct(editP.id, form);
      addToast('Product updated!', 'success');
      setEditP(null);
    } catch { addToast('Update failed', 'error'); }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    await deleteProduct(p.id);
    addToast('Product deleted', 'info');
  };

  const stockBadge = (s) => {
    if (s === 0)  return <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-900/40 text-red-300 border border-red-800/30">Out</span>;
    if (s <= 5)   return <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-900/40 text-amber-300 border border-amber-800/30">{s} Low</span>;
    return              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-900/40 text-emerald-300 border border-emerald-800/30">{s}</span>;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-sm text-slate-400 mt-1">{products.length} products in database</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchProducts(search)} className="p-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setPage('scanner')}
            className="btn-ripple flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors">
            <Plus size={16} /> Add via Scanner
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by name, brand, barcode…"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-10">Img</th>
                {COLS.map(c => (
                  <th key={c.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 whitespace-nowrap select-none"
                    onClick={() => toggleSort(c.key)}>
                    <span className="flex items-center gap-1">{c.label} <SortIcon k={c.key} /></span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && (
                <tr><td colSpan={9} className="py-12 text-center text-slate-500">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />Loading…
                </td></tr>
              )}
              {!loading && sorted.length === 0 && (
                <tr><td colSpan={9} className="py-12 text-center text-slate-500">
                  <Package size={32} className="mx-auto mb-2 opacity-30" />
                  No products found.
                </td></tr>
              )}
              {!loading && sorted.map((p, i) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3 text-slate-600 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {p.image_url
                        ? <img src={p.image_url} alt="" className="w-full h-full object-contain p-0.5"
                               onError={e => { e.target.style.display='none'; }} />
                        : <Package size={14} className="text-slate-600" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-200 max-w-[160px] truncate">{p.name}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{p.brand || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-emerald-400 font-mono whitespace-nowrap font-semibold">₹{p.selling_price}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap"><s>₹{p.mrp}</s></td>
                  <td className="px-4 py-3">{stockBadge(p.stock)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => addToCart(p)}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-900/30 transition-colors" title="Add to cart">
                        <ShoppingCart size={14} />
                      </button>
                      <button onClick={() => setEditP(p)}
                        className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-900/30 transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(p)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editP && <EditModal product={editP} onSave={handleEdit} onClose={() => setEditP(null)} />}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function Loader2({ size, className }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}
