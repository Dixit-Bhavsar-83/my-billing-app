from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import sqlite3
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_PATH = "inventory.db"

# ── Database setup ─────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode       TEXT    UNIQUE,
            name          TEXT    NOT NULL,
            brand         TEXT,
            category      TEXT,
            image_url     TEXT,
            mrp           REAL    DEFAULT 0,
            selling_price REAL    DEFAULT 0,
            stock         INTEGER DEFAULT 0,
            created_at    TEXT    DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS bills (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            items      TEXT NOT NULL,
            total      REAL NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    # Seed some demo products
    demo = [
        ("012345678901", "Parle-G Original Biscuits", "Parle", "Biscuits",
         "https://images.openfoodfacts.org/images/products/890/201/001/0005/front_en.12.full.jpg",
         10, 8, 50),
        ("890123456789", "Amul Butter 100g", "Amul", "Dairy",
         "https://images.openfoodfacts.org/images/products/890/160/010/3041/front_en.27.full.jpg",
         55, 50, 30),
        ("000000000000", "Demo Cola 330ml", "Demo Brand", "Beverages",
         "https://placehold.co/200x200/4f46e5/white?text=Cola",
         40, 35, 100),
    ]
    for d in demo:
        try:
            conn.execute(
                "INSERT OR IGNORE INTO products (barcode,name,brand,category,image_url,mrp,selling_price,stock) VALUES (?,?,?,?,?,?,?,?)",
                d
            )
        except Exception:
            pass
    conn.commit()
    conn.close()

init_db()

# ── Barcode lookup helper ──────────────────────────────────────────────────────
def lookup_barcode_openfoodfacts(barcode: str):
    """Free public API – no key required."""
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        r = requests.get(url, timeout=6)
        if r.status_code != 200:
            return None
        data = r.json()
        if data.get("status") != 1:
            return None
        p = data.get("product", {})
        return {
            "product_name": p.get("product_name") or p.get("product_name_en") or "Unknown Product",
            "brand":        p.get("brands", "").split(",")[0].strip() or "Unknown Brand",
            "category":     p.get("categories", "").split(",")[0].strip() or "General",
            "image_url":    p.get("image_url") or p.get("image_front_url") or "",
        }
    except Exception:
        return None

def lookup_barcode_upcitemdb(barcode: str):
    """Free tier of UPC Item DB."""
    try:
        url = f"https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}"
        r = requests.get(url, timeout=6)
        if r.status_code != 200:
            return None
        data = r.json()
        items = data.get("items", [])
        if not items:
            return None
        item = items[0]
        return {
            "product_name": item.get("title", "Unknown Product"),
            "brand":        item.get("brand", "Unknown Brand"),
            "category":     item.get("category", "General"),
            "image_url":    (item.get("images") or [""])[0],
        }
    except Exception:
        return None

# ── API: Barcode scan ──────────────────────────────────────────────────────────
@app.route("/api/scan/<barcode>", methods=["GET"])
def scan_barcode(barcode):
    # 1) Check local DB first
    conn = get_db()
    row = conn.execute("SELECT * FROM products WHERE barcode=?", (barcode,)).fetchone()
    conn.close()
    if row:
        return jsonify({
            "status": "found_local",
            "barcode": barcode,
            "product_name": row["name"],
            "brand": row["brand"],
            "category": row["category"],
            "image_url": row["image_url"],
            "mrp": row["mrp"],
            "selling_price": row["selling_price"],
            "stock": row["stock"],
        })

    # 2) Try OpenFoodFacts
    info = lookup_barcode_openfoodfacts(barcode)

    # 3) Fallback to UPC Item DB
    if not info:
        info = lookup_barcode_upcitemdb(barcode)

    if info:
        return jsonify({
            "status": "found_api",
            "barcode": barcode,
            **info,
        })

    # 4) Not found anywhere
    return jsonify({"status": "not_found", "barcode": barcode, "message": "Product not found in any database."}), 404

# ── API: Products CRUD ─────────────────────────────────────────────────────────
@app.route("/api/products", methods=["GET"])
def get_products():
    search = request.args.get("search", "").lower()
    conn = get_db()
    rows = conn.execute("SELECT * FROM products ORDER BY id DESC").fetchall()
    conn.close()
    products = [dict(r) for r in rows]
    if search:
        products = [p for p in products if
                    search in p["name"].lower() or
                    search in (p["brand"] or "").lower() or
                    search in (p["barcode"] or "").lower()]
    return jsonify(products)

@app.route("/api/products", methods=["POST"])
def add_product():
    d = request.get_json()
    required = ["name"]
    for f in required:
        if not d.get(f):
            return jsonify({"error": f"'{f}' is required"}), 400
    conn = get_db()
    try:
        cur = conn.execute(
            """INSERT INTO products (barcode,name,brand,category,image_url,mrp,selling_price,stock)
               VALUES (?,?,?,?,?,?,?,?)""",
            (d.get("barcode",""), d["name"], d.get("brand",""), d.get("category",""),
             d.get("image_url",""), float(d.get("mrp",0)), float(d.get("selling_price",0)),
             int(d.get("stock",0)))
        )
        conn.commit()
        row = conn.execute("SELECT * FROM products WHERE id=?", (cur.lastrowid,)).fetchone()
        conn.close()
        return jsonify(dict(row)), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Barcode already exists"}), 409

@app.route("/api/products/<int:pid>", methods=["PUT"])
def update_product(pid):
    d = request.get_json()
    conn = get_db()
    conn.execute(
        """UPDATE products SET name=?,brand=?,category=?,image_url=?,mrp=?,selling_price=?,stock=?
           WHERE id=?""",
        (d.get("name"), d.get("brand"), d.get("category"), d.get("image_url"),
         float(d.get("mrp",0)), float(d.get("selling_price",0)), int(d.get("stock",0)), pid)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(dict(row))

@app.route("/api/products/<int:pid>", methods=["DELETE"])
def delete_product(pid):
    conn = get_db()
    conn.execute("DELETE FROM products WHERE id=?", (pid,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# ── API: Bills ─────────────────────────────────────────────────────────────────
@app.route("/api/bills", methods=["POST"])
def create_bill():
    d = request.get_json()
    items = d.get("items", [])
    total = d.get("total", 0)
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO bills (items, total) VALUES (?,?)",
        (json.dumps(items), float(total))
    )
    # Update stock
    for item in items:
        conn.execute(
            "UPDATE products SET stock = MAX(0, stock - ?) WHERE id=?",
            (item.get("qty", 1), item.get("id"))
        )
    conn.commit()
    bill_id = cur.lastrowid
    conn.close()
    return jsonify({"bill_id": bill_id, "total": total, "items": items}), 201

@app.route("/api/bills", methods=["GET"])
def get_bills():
    conn = get_db()
    rows = conn.execute("SELECT * FROM bills ORDER BY id DESC LIMIT 50").fetchall()
    conn.close()
    bills = []
    for r in rows:
        b = dict(r)
        b["items"] = json.loads(b["items"])
        bills.append(b)
    return jsonify(bills)

# ── API: Dashboard stats ───────────────────────────────────────────────────────
@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db()
    total_products = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    total_stock    = conn.execute("SELECT SUM(stock) FROM products").fetchone()[0] or 0
    low_stock      = conn.execute("SELECT COUNT(*) FROM products WHERE stock <= 5").fetchone()[0]
    out_of_stock   = conn.execute("SELECT COUNT(*) FROM products WHERE stock = 0").fetchone()[0]
    total_bills    = conn.execute("SELECT COUNT(*) FROM bills").fetchone()[0]
    revenue        = conn.execute("SELECT SUM(total) FROM bills").fetchone()[0] or 0
    conn.close()
    return jsonify({
        "total_products": total_products,
        "total_stock":    int(total_stock),
        "low_stock":      low_stock,
        "out_of_stock":   out_of_stock,
        "total_bills":    total_bills,
        "revenue":        round(revenue, 2),
    })


if __name__ == "__main__":
    # Render automatically ek "PORT" environment variable deta hai.
    # Agar wo nahi milega, toh default 5000 port use hoga.
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
