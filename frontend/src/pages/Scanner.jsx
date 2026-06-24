import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera, CameraOff, Package, CheckCircle, AlertCircle,
  Plus, IndianRupee, Boxes, RefreshCw, ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ManualModal from '../components/ManualModal';

// Minimum ms between two successful scans (debounce)
const SCAN_COOLDOWN = 2500;

export default function Scanner() {
  const { addProduct, addToast } = useApp();

  const [camOn,       setCamOn]      = useState(false);
  const [product,     setProduct]    = useState(null);
  const [status,      setStatus]     = useState('idle'); // idle|requesting|loading|found|found_local|not_found|error|denied
  const [scannedCode, setScannedCode] = useState('');
  const [showManual,  setShowManual]  = useState(false);
  const [form,        setForm]        = useState({ selling_price: '', mrp: '', stock: '' });
  const [camError,    setCamError]    = useState('');

  // Refs — never trigger re-renders
  const html5QrRef   = useRef(null);  // Html5Qrcode instance
  const cooldownRef  = useRef(false);
  const streamRef    = useRef(null);  // raw MediaStream for guaranteed cleanup
  const readerDivRef = useRef(null);  // the <div id="qr-reader"> DOM node

  // ─── Stop camera completely ────────────────────────────────────────────────
  const stopCamera = useCallback(async () => {
    // 1. Stop the html5-qrcode engine
    if (html5QrRef.current) {
      try {
        const state = html5QrRef.current.getState();
        // State 2 = SCANNING, state 3 = PAUSED
        if (state === 2 || state === 3) {
          await html5QrRef.current.stop();
        }
      } catch (_) { /* already stopped */ }
      try { html5QrRef.current.clear(); } catch (_) { /* ignore */ }
      html5QrRef.current = null;
    }

    // 2. Kill the raw MediaStream tracks so the browser camera indicator light goes off
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    // 3. Scrub any <video> / <canvas> elements html5-qrcode injected
    if (readerDivRef.current) {
      readerDivRef.current.innerHTML = '';
    }
  }, []);

  // ─── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (html5QrRef.current) return; // already running
    if (!readerDivRef.current) return;

    setCamError('');
    setStatus('requesting');

    // First verify the browser supports getUserMedia at all
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError('Camera API not supported. Use Chrome/Firefox over HTTPS or localhost.');
      setStatus('denied');
      setCamOn(false);
      return;
    }

    // Request permission explicitly so we get a clear error if denied,
    // and capture the stream so we can kill it ourselves later.
    try {
      const constraints = {
        video: {
          facingMode:  { ideal: 'environment' }, // rear cam on mobile
          width:       { ideal: 1280 },
          height:      { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      // Extract the camera device ID from the live stream so html5-qrcode
      // uses the EXACT same camera (avoids a second permission prompt).
      const videoTrack = stream.getVideoTracks()[0];
      const deviceId   = videoTrack?.getSettings()?.deviceId;

      // Instantiate the low-level Html5Qrcode (NOT Html5QrcodeScanner)
      // so we have full control over start/stop without any built-in UI.
      const qr = new Html5Qrcode('qr-reader', {
        formatsToSupport: undefined, // scan all formats (QR + all 1D barcodes)
        verbose: false,
      });
      html5QrRef.current = qr;

      const config = {
        fps: 12,
        qrbox: (vw, vh) => {
          // Responsive scan box: 70% of the shorter edge, min 200 max 350
          const side = Math.round(Math.min(vw, vh) * 0.70);
          const clamped = Math.max(200, Math.min(350, side));
          // Wide rectangle is better for 1D barcodes
          return { width: Math.round(clamped * 1.6), height: clamped };
        },
        aspectRatio: 16 / 9,
        // Use rear camera via device ID when possible, else fall back to facingMode
        ...(deviceId
          ? { videoConstraints: { deviceId: { exact: deviceId } } }
          : { videoConstraints: { facingMode: { ideal: 'environment' } } }),
      };

      await qr.start(
        // Pass the device ID directly — most reliable cross-browser approach
        deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } },
        config,
        (decodedText) => {
          if (cooldownRef.current) return;
          cooldownRef.current = true;
          setTimeout(() => { cooldownRef.current = false; }, SCAN_COOLDOWN);
          handleScan(decodedText);
        },
        () => { /* per-frame decode errors are normal — ignore */ },
      );

      setStatus('idle');
    } catch (err) {
      await stopCamera();
      setCamOn(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCamError('Camera permission denied. Please allow camera access in your browser settings and try again.');
        setStatus('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCamError('No camera found on this device.');
        setStatus('denied');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCamError('Camera is in use by another app. Close other apps and try again.');
        setStatus('denied');
      } else if (err.name === 'OverconstrainedError') {
        setCamError('Camera constraints not supported. Trying fallback…');
        // Retry without constraints
        retryWithFallback();
      } else {
        setCamError(`Camera error: ${err.message || err.name}`);
        setStatus('denied');
      }
    }
  }, [stopCamera]); // eslint-disable-line

  // Fallback: retry with minimal constraints if OverconstrainedError
  const retryWithFallback = useCallback(async () => {
    if (!readerDivRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      const qr = new Html5Qrcode('qr-reader', { verbose: false });
      html5QrRef.current = qr;
      await qr.start(
        { facingMode: 'user' },
        { fps: 10, qrbox: { width: 280, height: 180 } },
        (text) => {
          if (cooldownRef.current) return;
          cooldownRef.current = true;
          setTimeout(() => { cooldownRef.current = false; }, SCAN_COOLDOWN);
          handleScan(text);
        },
        () => {},
      );
      setStatus('idle');
      setCamError('');
    } catch (e) {
      setCamError('Could not access camera. ' + (e.message || ''));
      setStatus('denied');
      setCamOn(false);
    }
  }, []); // eslint-disable-line

  // ─── Toggle effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (camOn) {
      // Small delay to ensure the #qr-reader div is painted in the DOM
      const t = setTimeout(startCamera, 80);
      return () => clearTimeout(t);
    } else {
      stopCamera();
      if (status === 'requesting') setStatus('idle');
    }
  }, [camOn]); // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // ─── Barcode lookup ─────────────────────────────────────────────────────────
  const handleScan = async (code) => {
    setScannedCode(code);
    setStatus('loading');
    setProduct(null);
    setForm({ selling_price: '', mrp: '', stock: '' });

    try {
      const r    = await fetch(`/api/scan/${encodeURIComponent(code)}`);
      const data = await r.json();
      if (r.ok) {
        setProduct(data);
        if (data.status === 'found_local') {
          setForm({ selling_price: data.selling_price, mrp: data.mrp, stock: data.stock });
          setStatus('found_local');
        } else {
          setStatus('found');
        }
      } else {
        setStatus('not_found');
      }
    } catch {
      setStatus('error');
    }
  };

  const handleManualBarcodePrompt = () => {
    const code = window.prompt('Enter barcode number:');
    if (code?.trim()) handleScan(code.trim());
  };

  // ─── Add to inventory ───────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!product) return;
    try {
      await addProduct({
        barcode:       scannedCode,
        name:          product.product_name,
        brand:         product.brand    || '',
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
        stock:         parseInt(formData.stock)           || 0,
      });
      addToast('Product added!', 'success');
      setShowManual(false);
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const isActive = camOn && status !== 'denied';

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Product Scanner</h1>
        <p className="text-sm text-slate-400 mt-1">
          Scan a barcode to look up product info and add it to inventory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT: Camera panel ── */}
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          {/* Header + toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Camera size={16} className="text-indigo-400" /> Camera Viewfinder
            </h2>
            <button
              onClick={() => { setCamError(''); setCamOn(v => !v); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all btn-ripple
                ${camOn
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
            >
              {camOn
                ? <><CameraOff size={14} /> Turn Off</>
                : <><Camera    size={14} /> Turn On</>}
            </button>
          </div>

          {/* Viewfinder container — always in DOM so the div#qr-reader exists */}
          <div
            className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700"
            style={{ minHeight: 260 }}
          >
            {/* html5-qrcode mounts its <video> inside this div */}
            <div
              id="qr-reader"
              ref={readerDivRef}
              className="w-full"
              style={{ minHeight: isActive ? 240 : 0 }}
            />

            {/* Animated overlay — only shown when camera is active */}
            {isActive && status !== 'requesting' && (
              <>
                <div className="corner-tl" />
                <div className="corner-tr" />
                <div className="corner-bl" />
                <div className="corner-br" />
                <div className="laser-line" />
              </>
            )}

            {/* Requesting permission spinner */}
            {status === 'requesting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80">
                <div className="w-10 h-10 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin" />
                <p className="text-xs text-slate-400">Requesting camera…</p>
              </div>
            )}

            {/* Permission denied / error */}
            {status === 'denied' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <ShieldAlert size={36} className="text-red-400" />
                <p className="text-sm font-semibold text-red-300">Camera Access Failed</p>
                <p className="text-xs text-slate-500 leading-relaxed">{camError}</p>
                <button
                  onClick={() => { setCamError(''); setCamOn(true); }}
                  className="mt-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Camera off placeholder */}
            {!camOn && status !== 'denied' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-600">
                <CameraOff size={40} />
                <p className="text-sm">Camera is off</p>
                <p className="text-xs text-slate-700">Toggle the switch above to start scanning</p>
              </div>
            )}
          </div>

          {/* HTTPS notice for non-localhost */}
          {!window.isSecureContext && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-900/20 border border-amber-800/40">
              <ShieldAlert size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-300">
                Camera requires <strong>HTTPS</strong> (or localhost). Your current URL is not
                secure — the camera will be blocked by the browser.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleManualBarcodePrompt}
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

          {/* Last scanned badge */}
          {scannedCode && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-xs text-slate-500">Last Scan:</span>
              <span className="text-xs font-mono text-indigo-300">{scannedCode}</span>
            </div>
          )}
        </div>

        {/* ── RIGHT: Response card ── */}
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Package size={16} className="text-emerald-400" /> Live Response
          </h2>

          {/* idle */}
          {(status === 'idle' || status === 'requesting' || status === 'denied') && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 text-slate-600">
              <Package size={44} strokeWidth={1} />
              <p className="text-sm">Awaiting scan…</p>
              <p className="text-xs text-slate-700 text-center">
                Point the camera at a barcode or enter one manually
              </p>
            </div>
          )}

          {/* loading */}
          {status === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-900" />
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
              </div>
              <p className="text-sm text-slate-300 font-medium">Looking up product…</p>
              <p className="text-xs text-slate-500 font-mono">{scannedCode}</p>
            </div>
          )}

          {/* not found */}
          {status === 'not_found' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">
              <AlertCircle size={40} className="text-amber-400" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Product Not Found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Barcode: <span className="font-mono text-indigo-300">{scannedCode}</span>
                </p>
              </div>
              <button
                onClick={() => setShowManual(true)}
                className="btn-ripple flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-sm font-semibold text-white transition-colors"
              >
                <Plus size={14} /> Enter Details Manually
              </button>
            </div>
          )}

          {/* backend error */}
          {status === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10 text-red-400">
              <AlertCircle size={36} />
              <p className="text-sm">Backend connection error.</p>
              <p className="text-xs text-slate-500">Make sure Flask is running on port 5000.</p>
            </div>
          )}

          {/* found / found_local */}
          {(status === 'found' || status === 'found_local') && product && (
            <div className="flex-1 flex flex-col gap-4 animate-slide-up">
              {/* Badge */}
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
                    ? <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-full h-full object-contain p-1"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    : <Package size={28} className="text-slate-500" />}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-white leading-snug">{product.product_name}</p>
                  {product.brand    && <p className="text-xs text-slate-400 mt-1">Brand: <span className="text-slate-300">{product.brand}</span></p>}
                  {product.category && <p className="text-xs text-slate-400">Category: <span className="text-slate-300">{product.category}</span></p>}
                </div>
              </div>

              {/* Price / stock inputs */}
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
                        type="number"
                        min="0"
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
