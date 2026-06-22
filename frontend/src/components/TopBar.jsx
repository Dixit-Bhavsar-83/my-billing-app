import React, { useState, useEffect } from 'react';
import { Menu, Bell, ChevronDown, Store, User, LogOut, Settings } from 'lucide-react';

export default function TopBar({ setMobileOpen, cartCount }) {
  const [time, setTime]       = useState(new Date());
  const [dropOpen, setDropOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4 sticky top-0 z-20">
      {/* Hamburger */}
      <button
        className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Business name */}
      <div className="flex items-center gap-2 min-w-0">
        <Store size={16} className="text-indigo-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-white truncate hidden sm:block">R.V Creation Store</span>
      </div>

      {/* Clock */}
      <div className="ml-auto hidden md:flex flex-col items-end mr-2">
        <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">{fmt(time)}</span>
        <span className="text-xs text-slate-500">{fmtDate(time)}</span>
      </div>

      {/* Bell */}
      <button className="relative text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
        <Bell size={18} />
        {cartCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </button>

      {/* Profile dropdown */}
      <div className="relative">
        <button
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          onClick={() => setDropOpen(d => !d)}
        >
          <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center">
            <User size={14} className="text-indigo-200" />
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-300">Admin</span>
          <ChevronDown size={14} className="text-slate-500" />
        </button>

        {dropOpen && (
          <div className="absolute right-0 top-12 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
            {[
              { Icon: User,     label: 'Profile'  },
              { Icon: Settings, label: 'Settings' },
              { Icon: LogOut,   label: 'Logout',  danger: true },
            ].map(({ Icon, label, danger }) => (
              <button
                key={label}
                onClick={() => setDropOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${danger ? 'text-red-400 hover:bg-red-900/30' : 'text-slate-300 hover:bg-slate-700'}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
