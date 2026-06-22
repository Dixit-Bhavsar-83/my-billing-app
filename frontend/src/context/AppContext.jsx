import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts]     = useState([]);
  const [cart, setCart]             = useState([]);
  const [toasts, setToasts]         = useState([]);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const API = process.env.REACT_APP_API_URL || 'https://my-billing-app-xshn.onrender.com';

  const fetchProducts = useCallback(async (search = '') => {
    try {
      const r = await fetch(`${API}/api/products?search=${encodeURIComponent(search)}`);
      const data = await r.json();
      setProducts(data);
      return data;
    } catch { return []; }
  }, [API]);

  const addProduct = useCallback(async (payload) => {
    const r = await fetch(`${API}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e.error || 'Failed to add product');
    }
    const p = await r.json();
    setProducts(prev => [p, ...prev]);
    return p;
  }, [API]);

  const updateProduct = useCallback(async (id, payload) => {
    const r = await fetch(`${API}/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const p = await r.json();
    setProducts(prev => prev.map(x => x.id === id ? p : x));
    return p;
  }, [API]);

  const deleteProduct = useCallback(async (id) => {
    await fetch(`${API}/api/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(x => x.id !== id));
  }, [API]);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(x => x.id === product.id);
      if (existing) return prev.map(x => x.id === product.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id) => setCart(prev => prev.filter(x => x.id !== id)), []);
  const updateCartQty  = useCallback((id, qty) => setCart(prev =>
    qty < 1 ? prev.filter(x => x.id !== id) : prev.map(x => x.id === id ? { ...x, qty } : x)
  ), []);
  const clearCart = useCallback(() => setCart([]), []);

  const checkout = useCallback(async () => {
    const total = cart.reduce((s, x) => s + x.selling_price * x.qty, 0);
    const r = await fetch(`${API}/api/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, total }),
    });
    if (!r.ok) throw new Error('Checkout failed');
    const bill = await r.json();
    setCart([]);
    await fetchProducts();
    return bill;
  }, [API, cart, fetchProducts]);

  return (
    <AppContext.Provider value={{
      products, setProducts, cart, toasts,
      addToast, fetchProducts, addProduct, updateProduct, deleteProduct,
      addToCart, removeFromCart, updateCartQty, clearCart, checkout,
      API,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
