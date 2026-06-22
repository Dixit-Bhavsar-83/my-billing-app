import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import {
  Camera, CameraOff, Package, Loader2, CheckCircle, AlertCircle,
  Plus, IndianRupee, Boxes, RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ManualModal from '../components/ManualModal';

const SCAN_DELAY = 2000; // ms between scans

export default function Scanner() {
  const { addProduct, addToast } = useApp();

  const [camOn,      setCamOn]      = useState(false);
  const [scanning,   setScanning]   = useState(false); // API fetch in progress
  const [product,    setProduct]    = useState(null);  // fetched product info
  const [status,     setStatus]     = useState('idle'); // idle | loading | found | not_found | error
  const [scannedCode, setScannedCode] = useState('');
  const [showManual, setShowManual]  = useState(false);
  const [form,       setForm]        = useState({ selling_price: '', mrp: '', stock: '' });

  const scannerRef    = useRef(null);
  const scannerObjRef = useRef(null);
  const cooldownRef   = useRef(false);

  // ── Start scanner ──────────────────────────────────────────────────────────
  const startScanner = useCallback(() => {
    if (scannerObjRef.current) return;
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 260, height: 140 },
        aspectRatio: 1.5,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      false
    );
    scanner.render(
      (code) => { if (!cooldownRef.current) handleScan(code); },
      (err) => { /* silent */ }
    );
    scannerObjRef.current = scanner;
  }, []); // eslint-disable-line

  const stopScanner = useCallback(() => {
    if (scannerObjRef.current) {
      scannerObjRef.current.clear().catch(() => {});
      scannerObjRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (camOn) startScanner();
    else stopScanner();
    return () => stopScanner();
  }, [camOn]); // eslint-disable-line

  // ── Handle a scanned barcode ───────────────────────────────────────────────
  const handleScan = async (code) => {
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, SCAN_DELAY);

    setScannedCode(code);
    setStatus('loading');
    setProduct(null);
    setForm({ selling_price: '', mrp: '', stock: '' });

    try {
      const r = await fetch(`/api/scan/${encodeURIComponent(code)}`);
      const data = await r.json();
      if (r.ok) {
        setProduct(data);
        setStatus(data.status === 'found_local' ? 'found_local' : 'found');
        if (data.status === 'found_local') {
          setForm({ selling_price: data.selling_price, mrp: data.mrp, stock: data.stock });
        }
      } else {
        setStatus('not_found');
      }
    } catch {
      setStatus('error');
    }
  };

  const handleManualScan = () => {
    const code = window.prompt('Enter barcode number:');
    if (code?.trim()) handleScan(code.trim());
  };

  // ── Add to inventory ───────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!product) return;
    try {
      await addProduct({
        barcode:       scannedCode,
        name:          product.product_name,
        brand:         product.brand   || '',
        category:      product.category || '',
        image_url:     product.image_url || '',
        selling_price: parseFloat(form.selling_price) || 0,
        mrp:           parseFloat(form.mrp)           || 0,
        stock:         parseInt(form.stock)            || 0,
      });
      addToast('Product added to inventory!', 'success');
      setStatus('idle');
      setProduct(null);
      setScannedCode('');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleManualSave = async (formData) => {
    try {
      await addProduct({
        ...formData,
        selling_price: parseFloat(formData.selling_price) || 0,
        mrp:           parseFloat(formData.mrp)           || 0,
        stock:         parseInt(formData.stock)            || 0,
      });
      addToast('Product added!', 'success');
      setShowManual(false);
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Product Scanner</h1>
        <p className="text-sm text-slate-400 mt-1">Scan a barcode to look up product info and add it to inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Camera ── */}
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Camera size={16} className="text-indigo-400" /> Camera Viewfinder
            </h2>
            {/* Toggle */}
            <button
              onClick={() => setCamOn(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all btn-ripple
                ${camOn ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
            >
              {camOn ? <><CameraOff size={14} /> Turn Off</> : <><Camera size={14} /> Turn On</>}
            </button>
          </div>

          {/* Viewfinder box */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700"
               style={{ minHeight: 240 }}>
            {/* Scanner element */}
            <div id="reader" ref={scannerRef} className="w-full" />

            {/* Corner brackets */}
            {camOn && <>
              <div className="corner-tl" /><div className="corner-tr" />
              <div className="corner-bl" /><div className="corner-br" />
              <div className="laser-line" />
            </>}

            {/* Idle placeholder */}
            {!camOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-600">
                <CameraOff size={40} />
                <p className="text-sm">Camera is off</p>
                <p className="text-xs text-slate-700">Toggle the switch to start scanning</p>
              </div>
            )}
          </div>

          {/* Manual input */}
          <div className="flex gap-2">
            <button
              onClick={handleManualScan}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <RefreshCw size={14} /> Enter Barcode Manually
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Plus size={14} /> Manual Entry
            </button>
          </div>

          {/* Scanned code badge */}
          {scannedCode && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-xs text-slate-500">Last Scan:</span>
              <span className="text-xs font-mono text-indigo-300">{scannedCode}</span>
            </div>
          )}
        </div>

        {/* ── Right: Response card ── */}
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Package size={16} className="text-emerald-400" /> Live Response
          </h2>

          {/* States */}
          {status === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 text-slate-600">
              <Package size={44} strokeWidth={1} />
              <p className="text-sm">Awaiting scan…</p>
              <p className="text-xs text-slate-700 text-center">Point the camera at a barcode or enter one manually</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-900" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-t-indigo-500 animate-spin" />
              </div>
              <p className="text-sm text-slate-300 font-medium">Looking up product…</p>
              <p className="text-xs text-slate-500 font-mono">{scannedCode}</p>
            </div>
          )}

          {status === 'not_found' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">
              <AlertCircle size={40} className="text-amber-400" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Product Not Found</p>
                <p className="text-xs text-slate-500 mt-1">Barcode: <span className="font-mono text-indigo-300">{scannedCode}</span></p>
              </div>
              <button
                onClick={() => setShowManual(true)}
                className="btn-ripple flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-sm font-semibold text-white transition-colors"
              >
                <Plus size={14} /> Enter Details Manually
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10 text-red-400">
              <AlertCircle size={36} />
              <p className="text-sm">Connection error. Check backend.</p>
            </div>
          )}

          {(status === 'found' || status === 'found_local') && product && (
            <div className="flex-1 flex flex-col gap-4 animate-slide-up">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">
                  {status === 'found_local' ? 'Found in Local DB' : 'Found via API'}
                </span>
                <span className="ml-auto text-xs font-mono text-slate-500">{scannedCode}</span>
              </div>

              {/* Product info */}
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {product.image_url
                    ? <img src={product.image_url} alt={product.product_name} className="w-full h-full object-contain p-1"
                           onError={e => { e.target.style.display='none'; }} />
                    : <Package size={28} className="text-slate-500" />}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-white leading-snug">{product.product_name}</p>
                  {product.brand    && <p className="text-xs text-slate-400 mt-1">Brand: <span className="text-slate-300">{product.brand}</span></p>}
                  {product.category && <p className="text-xs text-slate-400">Category: <span className="text-slate-300">{product.category}</span></p>}
                </div>
              </div>

              {/* Price & stock inputs */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Selling Price ₹', key: 'selling_price', Icon: IndianRupee },
                  { label: 'MRP ₹',           key: 'mrp',           Icon: IndianRupee },
                  { label: 'Stock (units)',    key: 'stock',         Icon: Boxes       },
                ].map(({ label, key, Icon }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">{label}</label>
                    <div className="relative">
                      <Icon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="number" min="0"
                        value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-2 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add button */}
              {status !== 'found_local' && (
                <button
                  onClick={handleAdd}
                  className="btn-ripple w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-900/40 mt-auto"
                >
                  <Plus size={16} /> Add to Inventory
                </button>
              )}

              {status === 'found_local' && (
                <div className="py-2 px-3 rounded-xl bg-indigo-900/30 border border-indigo-700/40 text-xs text-indigo-300 text-center">
                  ✓ This product is already in your inventory
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showManual && (
        <ManualModal
          barcode={scannedCode}
          onSave={handleManualSave}
          onClose={() => setShowManual(false)}
        />
      )}
    </div>
  );
}
