import bcrypt from 'bcryptjs';
import { run, get, all } from './database.js';
import { initSchema } from './schema.js';

export async function seedDatabase() {
  await initSchema();

  // Clear existing records cleanly
  await run('DELETE FROM stock_moves;');
  await run('DELETE FROM operation_items;');
  await run('DELETE FROM operations;');
  await run('DELETE FROM stock_levels;');
  await run('DELETE FROM products;');
  await run('DELETE FROM categories;');
  await run('DELETE FROM locations;');
  await run('DELETE FROM warehouses;');
  await run('DELETE FROM users;');
  await run('DELETE FROM otp_codes;');

  console.log('Seeding initial data...');

  // 1. Users
  const passwordHash = await bcrypt.hash('password123', 10);
  await run(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['Samreet Kaur (Manager)', 'manager@stocksense.com', passwordHash, 'manager']
  );
  await run(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['Alex Rivera (Staff)', 'staff@stocksense.com', passwordHash, 'staff']
  );

  // 2. Warehouses
  const wh1 = await run(
    `INSERT INTO warehouses (name, code, address) VALUES (?, ?, ?)`,
    ['Main Warehouse', 'WH-MAIN', '100 Industrial Parkway, Zone A']
  );
  const wh2 = await run(
    `INSERT INTO warehouses (name, code, address) VALUES (?, ?, ?)`,
    ['Production Plant', 'WH-PROD', '250 Assembly Lane, Zone B']
  );
  const wh3 = await run(
    `INSERT INTO warehouses (name, code, address) VALUES (?, ?, ?)`,
    ['Secondary Store', 'WH-STORE2', '75 Logistics Blvd, Hub 2']
  );

  // 3. Virtual & Real Locations
  // Virtual locations
  const vendorLoc = await run(
    `INSERT INTO locations (warehouse_id, name, code, type) VALUES (NULL, 'Vendors (External)', 'VEND-EXT', 'vendor')`
  );
  const customerLoc = await run(
    `INSERT INTO locations (warehouse_id, name, code, type) VALUES (NULL, 'Customers (External)', 'CUST-EXT', 'customer')`
  );
  const scrapLoc = await run(
    `INSERT INTO locations (warehouse_id, name, code, type) VALUES (NULL, 'Inventory Loss / Scrap', 'SCRAP-VIRT', 'inventory_loss')`
  );

  // Physical Warehouses internal locations
  const mainStoreLoc = await run(
    `INSERT INTO locations (warehouse_id, name, code, type) VALUES (?, 'Main Store - Rack A', 'WH-MAIN/RACK-A', 'internal')`,
    [wh1.lastID]
  );
  const mainRackBLoc = await run(
    `INSERT INTO locations (warehouse_id, name, code, type) VALUES (?, 'Main Store - Rack B', 'WH-MAIN/RACK-B', 'internal')`,
    [wh1.lastID]
  );
  const prodRackLoc = await run(
    `INSERT INTO locations (warehouse_id, name, code, type) VALUES (?, 'Production Floor - Rack 1', 'WH-PROD/RACK-1', 'internal')`,
    [wh2.lastID]
  );
  const store2RackLoc = await run(
    `INSERT INTO locations (warehouse_id, name, code, type) VALUES (?, 'Secondary Warehouse - Shelf 1', 'WH-STORE2/SHELF-1', 'internal')`,
    [wh3.lastID]
  );

  // 4. Categories
  const catRaw = await run(
    `INSERT INTO categories (name, description) VALUES (?, ?)`,
    ['Raw Materials', 'Metals, plastics, raw elements for manufacturing']
  );
  const catFinished = await run(
    `INSERT INTO categories (name, description) VALUES (?, ?)`,
    ['Finished Goods', 'Completed products ready for customer shipment']
  );
  const catHardware = await run(
    `INSERT INTO categories (name, description) VALUES (?, ?)`,
    ['Hardware & Fasteners', 'Bolts, nuts, brackets, and small components']
  );
  const catElectronics = await run(
    `INSERT INTO categories (name, description) VALUES (?, ?)`,
    ['Electronics', 'Motors, sensors, control panels']
  );

  // 5. Products
  const pSteel = await run(
    `INSERT INTO products (name, sku, category_id, uom, min_stock, max_stock) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Steel Rods', 'STEEL-ROD-01', catRaw.lastID, 'kg', 25, 200]
  );
  const pFrame = await run(
    `INSERT INTO products (name, sku, category_id, uom, min_stock, max_stock) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Chair Frame', 'CHAIR-FRM-02', catRaw.lastID, 'Units', 15, 100]
  );
  const pChair = await run(
    `INSERT INTO products (name, sku, category_id, uom, min_stock, max_stock) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Ergonomic Office Chair', 'OFF-CHAIR-10', catFinished.lastID, 'Units', 10, 50]
  );
  const pBolts = await run(
    `INSERT INTO products (name, sku, category_id, uom, min_stock, max_stock) VALUES (?, ?, ?, ?, ?, ?)`,
    ['M8 Hex Bolts', 'BOLT-M8-100', catHardware.lastID, 'Packs', 5, 40]
  );
  const pLowStock = await run(
    `INSERT INTO products (name, sku, category_id, uom, min_stock, max_stock) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Precision Servo Motor', 'ELEC-SRV-99', catElectronics.lastID, 'Units', 12, 30]
  );

  // Set low stock level for low stock item
  await run(
    `INSERT INTO stock_levels (product_id, location_id, quantity) VALUES (?, ?, ?)`,
    [pLowStock.lastID, mainStoreLoc.lastID, 3] // Below min_stock of 12!
  );

  // Helper function to process done operation & stock move
  async function createValidatedOperation({
    ref,
    type,
    partner,
    sourceLocId,
    destLocId,
    productId,
    qty,
    by = 'System Seed'
  }) {
    const op = await run(
      `INSERT INTO operations (reference_no, type, status, partner_name, source_location_id, dest_location_id, created_by)
       VALUES (?, ?, 'done', ?, ?, ?, ?)`,
      [ref, type, partner, sourceLocId, destLocId, by]
    );

    await run(
      `INSERT INTO operation_items (operation_id, product_id, demand_qty, done_qty) VALUES (?, ?, ?, ?)`,
      [op.lastID, productId, qty, qty]
    );

    // Update stock levels double-entry style
    // Decrease source if internal/customer/loss
    const sourceLoc = await get(`SELECT type FROM locations WHERE id = ?`, [sourceLocId]);
    if (sourceLoc && sourceLoc.type === 'internal') {
      const srcStock = await get(
        `SELECT quantity FROM stock_levels WHERE product_id = ? AND location_id = ?`,
        [productId, sourceLocId]
      );
      const currentSrcQty = srcStock ? srcStock.quantity : 0;
      const newSrcQty = currentSrcQty - qty;
      await run(
        `INSERT INTO stock_levels (product_id, location_id, quantity) VALUES (?, ?, ?)
         ON CONFLICT(product_id, location_id) DO UPDATE SET quantity = ?`,
        [productId, sourceLocId, newSrcQty, newSrcQty]
      );
    }

    // Increase dest if internal/customer/loss
    const destLoc = await get(`SELECT type FROM locations WHERE id = ?`, [destLocId]);
    if (destLoc && destLoc.type === 'internal') {
      const destStock = await get(
        `SELECT quantity FROM stock_levels WHERE product_id = ? AND location_id = ?`,
        [productId, destLocId]
      );
      const currentDestQty = destStock ? destStock.quantity : 0;
      const newDestQty = currentDestQty + qty;
      await run(
        `INSERT INTO stock_levels (product_id, location_id, quantity) VALUES (?, ?, ?)
         ON CONFLICT(product_id, location_id) DO UPDATE SET quantity = ?`,
        [productId, destLocId, newDestQty, newDestQty]
      );
    }

    // Log Stock Move
    await run(
      `INSERT INTO stock_moves (operation_id, reference_no, product_id, source_location_id, dest_location_id, qty, movement_type, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [op.lastID, ref, productId, sourceLocId, destLocId, qty, type, by]
    );
  }

  // Step 1: Receive 100 kg Steel Rods from Vendor into Main Store
  await createValidatedOperation({
    ref: 'IN/00001',
    type: 'receipt',
    partner: 'Apex Steel Corp',
    sourceLocId: vendorLoc.lastID,
    destLocId: mainStoreLoc.lastID,
    productId: pSteel.lastID,
    qty: 100
  });

  // Step 2: Internal Transfer 40 kg Steel Rods: Main Store -> Production Floor
  await createValidatedOperation({
    ref: 'INT/00001',
    type: 'internal',
    partner: 'Internal Assembly',
    sourceLocId: mainStoreLoc.lastID,
    destLocId: prodRackLoc.lastID,
    productId: pSteel.lastID,
    qty: 40
  });

  // Also initial chairs receipt & delivery order:
  await createValidatedOperation({
    ref: 'IN/00002',
    type: 'receipt',
    partner: 'Global Furniture Co',
    sourceLocId: vendorLoc.lastID,
    destLocId: mainStoreLoc.lastID,
    productId: pChair.lastID,
    qty: 30
  });

  // Step 3: Deliver 20 Ergonomic Office Chairs to Customer
  await createValidatedOperation({
    ref: 'OUT/00001',
    type: 'delivery',
    partner: 'Acme Enterprises',
    sourceLocId: mainStoreLoc.lastID,
    destLocId: customerLoc.lastID,
    productId: pChair.lastID,
    qty: 20
  });

  // Step 4: Adjust 3 kg damaged steel rods in Main Store
  await createValidatedOperation({
    ref: 'ADJ/00001',
    type: 'adjustment',
    partner: 'Quality Control',
    sourceLocId: mainStoreLoc.lastID,
    destLocId: scrapLoc.lastID,
    productId: pSteel.lastID,
    qty: 3
  });

  // Pending Operations to populate dashboard KPIs
  // Pending Receipt (Ready state)
  const pendingRec = await run(
    `INSERT INTO operations (reference_no, type, status, partner_name, source_location_id, dest_location_id, created_by)
     VALUES ('IN/00003', 'receipt', 'ready', 'MetalWorks Inc', ?, ?, 'Samreet Kaur')`,
    [vendorLoc.lastID, mainStoreLoc.lastID]
  );
  await run(
    `INSERT INTO operation_items (operation_id, product_id, demand_qty, done_qty) VALUES (?, ?, 50, 0)`,
    [pendingRec.lastID, pBolts.lastID]
  );

  // Pending Delivery (Waiting state)
  const pendingDel = await run(
    `INSERT INTO operations (reference_no, type, status, partner_name, source_location_id, dest_location_id, created_by)
     VALUES ('OUT/00002', 'delivery', 'waiting', 'TechCorp Hub', ?, ?, 'Alex Rivera')`,
    [mainStoreLoc.lastID, customerLoc.lastID]
  );
  await run(
    `INSERT INTO operation_items (operation_id, product_id, demand_qty, done_qty) VALUES (?, ?, 5, 0)`,
    [pendingDel.lastID, pFrame.lastID]
  );

  // Scheduled Internal Transfer (Draft state)
  const pendingInt = await run(
    `INSERT INTO operations (reference_no, type, status, partner_name, source_location_id, dest_location_id, created_by)
     VALUES ('INT/00002', 'internal', 'ready', 'Floor Rebalancing', ?, ?, 'Samreet Kaur')`,
    [mainStoreLoc.lastID, store2RackLoc.lastID]
  );
  await run(
    `INSERT INTO operation_items (operation_id, product_id, demand_qty, done_qty) VALUES (?, ?, 10, 0)`,
    [pendingInt.lastID, pChair.lastID]
  );

  console.log('Seeding completed successfully!');
}

// Run directly if invoked from command line
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
