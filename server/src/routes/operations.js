import express from 'express';
import { run, get, all } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate next reference number
async function generateRef(type) {
  const prefixMap = {
    receipt: 'IN',
    delivery: 'OUT',
    internal: 'INT',
    adjustment: 'ADJ'
  };
  const prefix = prefixMap[type] || 'OP';
  const countRow = await get(
    `SELECT COUNT(*) as cnt FROM operations WHERE type = ?`,
    [type]
  );
  const nextNum = (countRow.cnt + 1).toString().padStart(5, '0');
  return `${prefix}/${nextNum}`;
}

// GET operations list with dynamic filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, status, warehouse_id, category_id, search } = req.query;

    let sql = `
      SELECT o.*,
             sl.name as source_location_name, sl.code as source_location_code, sl.type as source_type,
             dl.name as dest_location_name, dl.code as dest_location_code, dl.type as dest_type,
             COUNT(oi.id) as item_count
      FROM operations o
      JOIN locations sl ON o.source_location_id = sl.id
      JOIN locations dl ON o.dest_location_id = dl.id
      LEFT JOIN operation_items oi ON o.id = oi.operation_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      sql += ` AND o.type = ?`;
      params.push(type);
    }
    if (status) {
      sql += ` AND o.status = ?`;
      params.push(status);
    }
    if (warehouse_id) {
      sql += ` AND (sl.warehouse_id = ? OR dl.warehouse_id = ?)`;
      params.push(warehouse_id, warehouse_id);
    }
    if (category_id) {
      sql += ` AND p.category_id = ?`;
      params.push(category_id);
    }
    if (search) {
      sql += ` AND (o.reference_no LIKE ? OR o.partner_name LIKE ? OR p.name LIKE ? OR p.sku LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY o.id ORDER BY o.id DESC`;

    const operations = await all(sql, params);
    res.json(operations);
  } catch (err) {
    console.error('Fetch operations error:', err);
    res.status(500).json({ error: 'Failed to fetch operations' });
  }
});

// GET single operation detail with items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const operation = await get(
      `SELECT o.*,
              sl.name as source_location_name, sl.code as source_location_code,
              dl.name as dest_location_name, dl.code as dest_location_code
       FROM operations o
       JOIN locations sl ON o.source_location_id = sl.id
       JOIN locations dl ON o.dest_location_id = dl.id
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (!operation) {
      return res.status(404).json({ error: 'Operation document not found' });
    }

    const items = await all(
      `SELECT oi.*, p.name as product_name, p.sku, p.uom, p.min_stock, p.max_stock,
              COALESCE((SELECT quantity FROM stock_levels WHERE product_id = p.id AND location_id = o.source_location_id), 0) as available_qty
       FROM operation_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN operations o ON oi.operation_id = o.id
       WHERE oi.operation_id = ?`,
      [operation.id]
    );

    res.json({ ...operation, items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch operation details' });
  }
});

// CREATE operation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, partner_name, source_location_id, dest_location_id, items, notes } = req.body;
    if (!type || !source_location_id || !dest_location_id || !items || !items.length) {
      return res.status(400).json({ error: 'Type, source location, target location, and at least one item are required' });
    }

    const ref = await generateRef(type);

    const result = await run(
      `INSERT INTO operations (reference_no, type, status, partner_name, source_location_id, dest_location_id, created_by, notes)
       VALUES (?, ?, 'draft', ?, ?, ?, ?, ?)`,
      [
        ref,
        type,
        partner_name || '',
        source_location_id,
        dest_location_id,
        req.user.name,
        notes || ''
      ]
    );

    const opId = result.lastID;

    for (const item of items) {
      const demand = parseFloat(item.demand_qty || item.qty || 0);
      const done = parseFloat(item.done_qty || 0);
      await run(
        `INSERT INTO operation_items (operation_id, product_id, demand_qty, done_qty) VALUES (?, ?, ?, ?)`,
        [opId, item.product_id, demand, done]
      );
    }

    res.status(201).json({ id: opId, reference_no: ref, message: 'Operation document created in draft' });
  } catch (err) {
    console.error('Create operation error:', err);
    res.status(500).json({ error: 'Failed to create operation document' });
  }
});

// UPDATE operation status or items
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, partner_name, notes, items } = req.body;
    const op = await get('SELECT * FROM operations WHERE id = ?', [req.params.id]);

    if (!op) {
      return res.status(404).json({ error: 'Operation document not found' });
    }

    if (op.status === 'done' || op.status === 'canceled') {
      return res.status(400).json({ error: 'Cannot modify an operation that is already Done or Canceled' });
    }

    if (status) {
      await run('UPDATE operations SET status = ? WHERE id = ?', [status, req.params.id]);
    }
    if (partner_name !== undefined || notes !== undefined) {
      await run(
        'UPDATE operations SET partner_name = COALESCE(?, partner_name), notes = COALESCE(?, notes) WHERE id = ?',
        [partner_name, notes, req.params.id]
      );
    }

    if (items && items.length) {
      // Update done quantities
      for (const item of items) {
        if (item.id) {
          await run(
            'UPDATE operation_items SET demand_qty = ?, done_qty = ? WHERE id = ?',
            [parseFloat(item.demand_qty), parseFloat(item.done_qty), item.id]
          );
        }
      }
    }

    res.json({ message: 'Operation document updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update operation' });
  }
});

// VALIDATE operation (Done state + double-entry stock updates + immutable ledger insertion)
router.post('/:id/validate', authenticateToken, async (req, res) => {
  try {
    const op = await get('SELECT * FROM operations WHERE id = ?', [req.params.id]);
    if (!op) {
      return res.status(404).json({ error: 'Operation document not found' });
    }

    if (op.status === 'done') {
      return res.status(400).json({ error: 'Operation is already validated and Done' });
    }
    if (op.status === 'canceled') {
      return res.status(400).json({ error: 'Cannot validate a canceled operation' });
    }

    const items = await all('SELECT * FROM operation_items WHERE operation_id = ?', [op.id]);
    if (!items.length) {
      return res.status(400).json({ error: 'Cannot validate an operation with no items' });
    }

    const sourceLoc = await get('SELECT * FROM locations WHERE id = ?', [op.source_location_id]);
    const destLoc = await get('SELECT * FROM locations WHERE id = ?', [op.dest_location_id]);

    for (const item of items) {
      // If done_qty was 0, set done_qty = demand_qty automatically upon validation
      const finalQty = item.done_qty > 0 ? item.done_qty : item.demand_qty;

      await run('UPDATE operation_items SET done_qty = ? WHERE id = ?', [finalQty, item.id]);

      // 1. Update Source location if internal
      if (sourceLoc.type === 'internal') {
        const srcStock = await get(
          'SELECT quantity FROM stock_levels WHERE product_id = ? AND location_id = ?',
          [item.product_id, op.source_location_id]
        );
        const currentQty = srcStock ? srcStock.quantity : 0;
        const newQty = currentQty - finalQty;
        await run(
          `INSERT INTO stock_levels (product_id, location_id, quantity) VALUES (?, ?, ?)
           ON CONFLICT(product_id, location_id) DO UPDATE SET quantity = ?`,
          [item.product_id, op.source_location_id, newQty, newQty]
        );
      }

      // 2. Update Destination location if internal
      if (destLoc.type === 'internal') {
        const destStock = await get(
          'SELECT quantity FROM stock_levels WHERE product_id = ? AND location_id = ?',
          [item.product_id, op.dest_location_id]
        );
        const currentQty = destStock ? destStock.quantity : 0;
        const newQty = currentQty + finalQty;
        await run(
          `INSERT INTO stock_levels (product_id, location_id, quantity) VALUES (?, ?, ?)
           ON CONFLICT(product_id, location_id) DO UPDATE SET quantity = ?`,
          [item.product_id, op.dest_location_id, newQty, newQty]
        );
      }

      // 3. Record move in immutable ledger
      await run(
        `INSERT INTO stock_moves (operation_id, reference_no, product_id, source_location_id, dest_location_id, qty, movement_type, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          op.id,
          op.reference_no,
          item.product_id,
          op.source_location_id,
          op.dest_location_id,
          finalQty,
          op.type,
          req.user.name
        ]
      );
    }

    // Mark status as done
    await run("UPDATE operations SET status = 'done' WHERE id = ?", [op.id]);

    res.json({ message: `Operation ${op.reference_no} validated successfully! Inventory balances updated.` });
  } catch (err) {
    console.error('Validate operation error:', err);
    res.status(500).json({ error: 'Failed to validate operation' });
  }
});

// CANCEL operation
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const op = await get('SELECT * FROM operations WHERE id = ?', [req.params.id]);
    if (!op) {
      return res.status(404).json({ error: 'Operation document not found' });
    }
    if (op.status === 'done') {
      return res.status(400).json({ error: 'Cannot cancel an operation that has already been validated' });
    }

    await run("UPDATE operations SET status = 'canceled' WHERE id = ?", [op.id]);
    res.json({ message: `Operation ${op.reference_no} canceled.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel operation' });
  }
});

export default router;
