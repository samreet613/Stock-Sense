import { exec } from './database.js';

export async function initSchema() {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'manager',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warehouse_id INTEGER,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'internal',
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category_id INTEGER,
      uom TEXT NOT NULL DEFAULT 'Units',
      min_stock REAL DEFAULT 10,
      max_stock REAL DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS stock_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
      UNIQUE(product_id, location_id)
    );

    CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_no TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL, -- 'receipt', 'delivery', 'internal', 'adjustment'
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'waiting', 'ready', 'done', 'canceled'
      partner_name TEXT, -- Supplier or Customer name
      source_location_id INTEGER NOT NULL,
      dest_location_id INTEGER NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_location_id) REFERENCES locations(id),
      FOREIGN KEY (dest_location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS operation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      demand_qty REAL NOT NULL DEFAULT 0,
      done_qty REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stock_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_id INTEGER,
      reference_no TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      source_location_id INTEGER NOT NULL,
      dest_location_id INTEGER NOT NULL,
      qty REAL NOT NULL,
      movement_type TEXT NOT NULL, -- 'receipt', 'delivery', 'internal', 'adjustment'
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE SET NULL,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (source_location_id) REFERENCES locations(id),
      FOREIGN KEY (dest_location_id) REFERENCES locations(id)
    );
  `;

  await exec(schemaSql);
  console.log('Database schema initialized successfully.');
}
