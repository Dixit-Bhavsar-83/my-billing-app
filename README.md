# BillSwift — Billing & Price Lookup Web App
> Built for R.V Creation · Full-Stack (React + Flask) · Barcode Scanner · POS

---

## 📁 Project Structure

```
billing-app/
├── backend/
│   ├── app.py              ← Flask API server
│   ├── requirements.txt    ← Python deps
│   └── inventory.db        ← Auto-created SQLite DB
│
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── App.jsx
    │   ├── index.js / index.css
    │   ├── context/AppContext.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── TopBar.jsx
    │   │   ├── Toasts.jsx
    │   │   └── ManualModal.jsx
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Scanner.jsx
    │       ├── Inventory.jsx
    │       └── POS.jsx
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

---

## ⚡ Quick Setup (Run Locally)

### 1. Backend (Flask)

```bash
cd billing-app/backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
# → Runs on http://localhost:5000
```

**API Endpoints:**
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/scan/<barcode>` | Lookup barcode (local DB → OpenFoodFacts → UPC DB) |
| GET | `/api/products?search=` | List all products |
| POST | `/api/products` | Add new product |
| PUT | `/api/products/<id>` | Update product |
| DELETE | `/api/products/<id>` | Delete product |
| POST | `/api/bills` | Checkout & create bill |
| GET | `/api/stats` | Dashboard statistics |

---

### 2. Frontend (React)

```bash
cd billing-app/frontend

# Install packages
npm install

# Start dev server (proxies /api → localhost:5000)
npm start
# → Opens http://localhost:3000
```

> **Important:** Start the Flask backend FIRST, then the React frontend.

---

## 🌐 Barcode Lookup APIs Used

The backend cascades through these **free** APIs (no key required):

1. **OpenFoodFacts** (`world.openfoodfacts.org`) — food & grocery products
2. **UPC Item DB** (`api.upcitemdb.com/prod/trial`) — general retail products

To add a paid API (Barcodelookup.com, Go-UPC, etc.), edit `app.py`:
```python
def lookup_barcode_paid(barcode):
    url = f"https://api.barcodelookup.com/v3/products?barcode={barcode}&formatted=y&key=YOUR_KEY"
    r = requests.get(url, timeout=6)
    ...
```

---

## 📱 Features

### Dashboard
- Live stats: total products, stock levels, revenue, bills
- Low stock & out-of-stock alerts
- Quick action cards

### Scanner
- Camera viewfinder with animated **laser-line sweep**
- Corner bracket overlay (viewfinder UI)
- Automatic API lookup on scan
- Manual barcode entry fallback
- Manual product entry modal (if barcode not found)
- Input fields for Selling Price, MRP, Initial Stock
- "Add to Inventory" button with ripple effect

### Inventory
- Sortable columns (click header to sort)
- Live search filter
- Inline edit modal
- Delete with confirmation
- Stock badges (Green/Amber/Red)
- "Add to Cart" quick action per row

### POS / Billing
- Product grid with search
- Shopping cart with qty controls
- Savings calculation (MRP vs Selling Price)
- Checkout → bill created → stock decremented
- **Printable receipt** modal with browser print dialog

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `slate-950` (#020617) |
| Card/Glass | `slate-900` + blur |
| Primary | Indigo-600 (#4f46e5) |
| Success/Add | Emerald-600 (#059669) |
| Warning | Amber-600 |
| Danger | Red-600 |
| Text primary | `slate-100` |
| Text muted | `slate-400` |
| Font | Inter (Google Fonts) |

---

## 📦 Production Build

```bash
# Build React to static files
cd frontend && npm run build

# Serve with Flask (optional)
# Copy build/ into backend and add Flask static file serving:
# app = Flask(__name__, static_folder='build', static_url_path='/')
# @app.route('/')
# def index(): return app.send_static_file('index.html')
```

---

## 🔧 Environment Variables

Create `frontend/.env` to override the API base URL:
```
REACT_APP_API_URL=http://localhost:5000
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend UI | React 18, Tailwind CSS 3, Lucide React |
| Barcode Scanner | html5-qrcode |
| Backend API | Python Flask + Flask-CORS |
| Database | SQLite (via Python `sqlite3`) |
| HTTP Client | Python `requests` |
| Barcode APIs | OpenFoodFacts, UPC Item DB |
