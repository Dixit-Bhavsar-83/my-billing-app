import React from 'react';
import {
  LayoutDashboard, ScanLine, PackageSearch, ShoppingCart, Zap, X,
} from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { id: 'scanner',   label: 'Scanner',    Icon: ScanLine        },
  { id: 'inventory', label: 'Inventory',  Icon: PackageSearch   },
  { id: 'pos',       label: 'POS / Billing', Icon: ShoppingCart },
];

export default function Sidebar({ page, setPage, mobileOpen, setMobileOpen }) {
  const NavItem = ({ id, label, Icon }) => (
    <button
      onClick={() => { setPage(id); setMobileOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
        ${page === id
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
    >
      <Icon size={18} className={page === id ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400 transition-colors'} />
      <span>{label}</span>
      {page === id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
    </button>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col
        bg-slate-900 border-r border-slate-800
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-auto lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">BillSwift</p>
              <p className="text-xs text-slate-500 mt-0.5">R.V Creation</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-4 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Main Menu</p>
          {NAV.map(n => <NavItem key={n.id} {...n} />)}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-600 text-center">v1.0 · BillSwift</p>
        </div>
      </aside>
    </>
  );
}
