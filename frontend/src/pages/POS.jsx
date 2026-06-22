import React, { useEffect, useState, useRef } from 'react';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, Package,
  IndianRupee, Printer, CheckCircle, X, Receipt,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

function ReceiptModal({ bill, onClose }) {
  const now = new Date();
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`<html><head><title>Receipt #${bill.bill_id}</title>
      <style>
        body{font-family:monospace;padding:24px;font-size:13px;}
        h2{text-align:center;margin:0 0 4px}
        .center{text-align:center}
        hr{border:none;border-top:1px dashed #999;margin:8px 0}
        table{width:100%;border-collapse:collapse}
        td{padding:2px 0}
        .right{text-align:right}
        .total{font-weight:bold;font-size:15px}
      </style></head><body>${content}</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Receipt size={16} className="text-emerald-400" /> Receipt</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>
        {/* Printable receipt */}
        <div ref={printRef} className="px-5 py-4">
          <div className="text-center mb-3">
            <p className="font-bold text-white text-lg">R.V Creation Store</p>
            <p className="text-xs text-slate-500">Ahmedabad, Gujarat</p>
            <p className="text-xs text-slate-500 mt-1">{now.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-600">Bill #{bill.bill_id}</p>
          </div>
          <div className="border-t border-dashed border-slate-700 my-3" />
          <table className="w-full text-xs text-slate-300 mb-2">
            <thead>
              <tr className="text-slate-500">
                <td>Item</td><td className="text-right">Qty</td><td className="text-right">Price</td><td className="text-right">Total</td>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="py-1 max-w-[120px]"><p className="truncate">{item.name}</p></td>
                  <td className="text-right py-1">{item.qty}</td>
                  <td className="text-right py-1">₹{item.selling_price}</td>
                  <td className="text-right py-1">₹{(item.selling_price * item.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-dashed border-slate-700 my-3" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-white">Total</span>
            <span className="text-lg font-bold text-emerald-400">₹{bill.total.toFixed(2)}</span>
          </div>
          <p className="text-center text-xs text-slate-600 mt-4">Thank you for shopping with us!</p>
        </div>
        <div className="px-5 py-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
            Close
          </button>
          <button onClick={handlePrint}
            className="btn-ripple flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}

export default function POS() {
  const { products, fetchProducts, cart, addToCart, removeFromCart, updateCartQty, clearCart, checkout, addToast } = useApp();
  const [search,   setSearch]   = useState('');
  const [receipt,  setReceipt]  = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => { fetchProducts(); }, []); // eslint-disable-line

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search))
    : products;

  const subtotal  = cart.reduce((s, x) => s + x.selling_price * x.qty, 0);
  const discount  = cart.reduce((s, x) => s + Math.max(0, (x.mrp - x.selling_price)) * x.qty, 0);
  const total     = subtotal;

  const handleCheckout = async () => {
    if (!cart.length) return;
    setChecking(true);
    try {
      const bill = await checkout();
      setReceipt(bill);
      addToast('Bill created!', 'success');
    } catch { addToast('Checkout failed', 'error'); }
    setChecking(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">POS / Billing</h1>
        <p className="text-sm text-slate-400 mt-1">Search & add products, then checkout</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── Products panel (3 cols) ── */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products by name or barcode…"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map(p => {
              const inCart = cart.find(x => x.id === p.id);
              return (
                <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock === 0}
                  className={`glass rounded-xl p-3 text-left hover:border-indigo-500/50 transition-all group relative
                    ${p.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800/40 cursor-pointer'}`}>
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                      {inCart.qty}
                    </span>
                  )}
                  <div className="w-full h-16 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center mb-2">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="h-full w-full object-contain p-1"
                             onError={e => { e.target.style.display='none'; }} />
                      : <Package size={20} className="text-slate-600" />}
                  </div>
                  <p className="text-xs font-semibold text-slate-200 truncate leading-snug">{p.name}</p>
                  <p className="text-xs text-slate-500 truncate">{p.brand}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-bold text-emerald-400">₹{p.selling_price}</span>
                    {p.stock === 0
                      ? <span className="text-[10px] text-red-400">Out</span>
                      : <span className="text-[10px] text-slate-600">{p.stock} left</span>}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-3 py-12 text-center text-slate-600">
                <Package size={28} className="mx-auto mb-2 opacity-40" />
                No products found
              </div>
            )}
          </div>
        </div>

        {/* ── Cart (2 cols) ── */}
        <div className="xl:col-span-2 glass rounded-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <ShoppingCart size={16} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Current Order</h2>
            <span className="ml-auto text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full">{cart.length} items</span>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Clear
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {cart.length === 0 && (
              <div className="py-10 text-center text-slate-600">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Click products to add them</p>
              </div>
            )}
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
                <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.image_url
                    ? <img src={item.image_url} alt="" className="w-full h-full object-contain p-0.5"
                           onError={e => { e.target.style.display='none'; }} />
                    : <Package size={14} className="text-slate-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{item.name}</p>
                  <p className="text-xs text-emerald-400 font-mono">₹{item.selling_price} × {item.qty}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateCartQty(item.id, item.qty - 1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors">
                    <Minus size={10} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-white">{item.qty}</span>
                  <button onClick={() => updateCartQty(item.id, item.qty + 1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors">
                    <Plus size={10} />
                  </button>
                </div>
                <p className="text-sm font-bold text-white w-14 text-right">
                  ₹{(item.selling_price * item.qty).toFixed(2)}
                </p>
                <button onClick={() => removeFromCart(item.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors ml-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary & checkout */}
          <div className="px-5 py-4 border-t border-slate-800 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Savings (MRP)</span>
                  <span className="font-mono">–₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white border-t border-slate-700 pt-2">
                <span className="flex items-center gap-1"><IndianRupee size={14} />Total</span>
                <span className="text-emerald-400 font-mono">₹{total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={!cart.length || checking}
              className="btn-ripple w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-900/40"
            >
              <CheckCircle size={16} />
              {checking ? 'Processing…' : `Checkout  ₹${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {receipt && <ReceiptModal bill={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
