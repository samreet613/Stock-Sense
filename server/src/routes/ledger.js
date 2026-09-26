import express from 'express';
import { all } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, location_id, search, limit } = req.query;

    let sql = `
      SELECT sm.*,
             p.name as product_name, p.sku as product_sku, p.uom as product_uom,
             sl.name as source_location_name, sl.code as source_location_code, sl.type as source_type,
             sw.name as source_warehouse_name,
             dl.name as dest_location_name, dl.code as dest_location_code, dl.type as dest_type,
             dw.name as dest_warehouse_name
      FROM stock_moves sm
      JOIN products p ON sm.product_id = p.id
      JOIN locations sl ON sm.source_location_id = sl.id
      LEFT JOIN warehouses sw ON sl.warehouse_id = sw.id
      JOIN locations dl ON sm.dest_location_id = dl.id
      LEFT JOIN warehouses dw ON dl.warehouse_id = dw.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      sql += ` AND sm.product_id = ?`;
      params.push(product_id);
    }
    if (location_id) {
      sql += ` AND (sm.source_location_id = ? OR sm.dest_location_id = ?)`;
      params.push(location_id, location_id);
    }
    if (search) {
      sql += ` AND (sm.reference_no LIKE ? OR p.name LIKE ? OR p.sku LIKE ? OR sm.created_by LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY sm.id DESC`;

    if (limit) {
      sql += ` LIMIT ?`;
      params.push(parseInt(limit, 10));
    }

    const moves = await all(sql, params);
    res.json(moves);
  } catch (err) {
    console.error('Fetch ledger error:', err);
    res.status(500).json({ error: 'Failed to fetch stock move history' });
  }
});

export default router;
