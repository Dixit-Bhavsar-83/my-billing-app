import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar   from './components/Sidebar';
import TopBar    from './components/TopBar';
import Toasts    from './components/Toasts';
import Dashboard from './pages/Dashboard';
import Scanner   from './pages/Scanner';
import Inventory from './pages/Inventory';
import POS       from './pages/POS';

function Shell() {
  const [page,       setPage]       = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, cart }            = useApp();

  const Page = { dashboard: Dashboard, scanner: Scanner, inventory: Inventory, pos: POS }[page];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar setMobileOpen={setMobileOpen} cartCount={cart.length} />
        <main className="flex-1 overflow-y-auto">
          <Page setPage={setPage} />
        </main>
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
