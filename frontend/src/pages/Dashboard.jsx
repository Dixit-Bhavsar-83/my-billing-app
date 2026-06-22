import React, { useEffect, useState } from 'react';
import { Package, Layers, AlertTriangle, XOctagon, Receipt, IndianRupee, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="glass rounded-2xl p-5 flex items-start gap-4 hover:border-indigo-500/40 transition-colors">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard({ setPage }) {
  const { fetchProducts, products, API } = useApp();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetch(`${API}/api/stats`).then(r => r.json()).then(setStats);
  }, []); // eslint-disable-line

  const lowStock  = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outStock  = products.filter(p => p.stock === 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Welcome back, Admin · Here's your store overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Package}       label="Products"    value={stats?.total_products}                   color="bg-indigo-600"  />
        <StatCard icon={Layers}        label="Total Stock" value={stats?.total_stock}                      color="bg-violet-600"  />
        <StatCard icon={AlertTriangle} label="Low Stock"   value={stats?.low_stock}    sub="≤5 units"      color="bg-amber-600"   />
        <StatCard icon={XOctagon}      label="Out of Stock" value={stats?.out_of_stock}                   color="bg-red-600"     />
        <StatCard icon={Receipt}       label="Bills Today" value={stats?.total_bills}                      color="bg-cyan-600"    />
        <StatCard icon={IndianRupee}   label="Revenue"     value={`₹${(stats?.revenue||0).toLocaleString('en-IN')}`} color="bg-emerald-600" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Scan a Product', desc: 'Add new item via barcode camera', page: 'scanner', color: 'from-indigo-600 to-violet-700' },
          { label: 'View Inventory', desc: 'Browse, edit or delete products', page: 'inventory', color: 'from-emerald-600 to-teal-700' },
          { label: 'Open POS',       desc: 'Create bills & checkout cart',    page: 'pos',       color: 'from-amber-600  to-orange-700' },
        ].map(({ label, desc, page, color }) => (
          <button
            key={page}
            onClick={() => setPage(page)}
            className={`btn-ripple text-left p-5 rounded-2xl bg-gradient-to-br ${color} shadow-lg hover:opacity-90 transition-opacity group`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Quick Action</span>
              <ArrowUpRight size={16} className="text-white/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-lg font-bold text-white">{label}</p>
            <p className="text-sm text-white/70 mt-1">{desc}</p>
          </button>
        ))}
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Low Stock Alerts</h2>
            <span className="ml-auto text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full">{lowStock.length} items</span>
          </div>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {p.image_url
                    ? <img src={p.image_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                    : <Package size={14} className="text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.barcode}</p>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full">{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Out of stock */}
      {outStock.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <XOctagon size={16} className="text-red-400" />
            <h2 className="text-sm font-semibold text-white">Out of Stock</h2>
            <span className="ml-auto text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full">{outStock.length} items</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {outStock.map(p => (
              <span key={p.id} className="text-xs bg-red-900/30 text-red-300 border border-red-800/40 px-3 py-1 rounded-full">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent products */}
      {products.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" /> Recently Added
            </h2>
            <button onClick={() => setPage('inventory')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  {['Product','Brand','Price','Stock'].map(h => (
                    <th key={h} className="pb-2 text-xs text-slate-500 font-medium pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.slice(0, 5).map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-slate-200 whitespace-nowrap max-w-[160px] truncate">{p.name}</td>
                    <td className="py-2.5 pr-4 text-slate-400 whitespace-nowrap">{p.brand || '—'}</td>
                    <td className="py-2.5 pr-4 text-emerald-400 whitespace-nowrap font-mono">₹{p.selling_price}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                        ${p.stock === 0  ? 'bg-red-900/40 text-red-300' :
                          p.stock <= 5   ? 'bg-amber-900/40 text-amber-300' :
                                           'bg-emerald-900/40 text-emerald-300'}`}>
                        {p.stock === 0 ? 'Out' : p.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
