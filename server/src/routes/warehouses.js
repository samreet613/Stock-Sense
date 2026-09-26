import express from 'express';
import { run, get, all } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all warehouses with locations
router.get('/warehouses', authenticateToken, async (req, res) => {
  try {
    const warehouses = await all('SELECT * FROM warehouses ORDER BY name ASC');
    const locations = await all('SELECT * FROM locations ORDER BY name ASC');

    const result = warehouses.map((wh) => ({
      ...wh,
      locations: locations.filter((loc) => loc.warehouse_id === wh.id)
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

// CREATE warehouse
router.post('/warehouses', authenticateToken, async (req, res) => {
  try {
    const { name, code, address } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Warehouse name and code are required' });
    }

    const whResult = await run(
      'INSERT INTO warehouses (name, code, address) VALUES (?, ?, ?)',
      [name.trim(), code.trim().toUpperCase(), address || '']
    );

    // Create default Main Rack location inside newly created warehouse
    const locResult = await run(
      `INSERT INTO locations (warehouse_id, name, code, type) VALUES (?, ?, ?, 'internal')`,
      [whResult.lastID, `${name.trim()} - Storage Rack 1`, `${code.trim().toUpperCase()}/RACK-1`]
    );

    res.status(201).json({ id: whResult.lastID, message: 'Warehouse created with default storage rack' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create warehouse (Code must be unique)' });
  }
});

// GET all locations (internal & virtual)
router.get('/locations', authenticateToken, async (req, res) => {
  try {
    const { type, warehouse_id } = req.query;
    let sql = `
      SELECT l.*, w.name as warehouse_name
      FROM locations l
      LEFT JOIN warehouses w ON l.warehouse_id = w.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      sql += ` AND l.type = ?`;
      params.push(type);
    }
    if (warehouse_id) {
      sql += ` AND l.warehouse_id = ?`;
      params.push(warehouse_id);
    }

    sql += ` ORDER BY l.type ASC, l.name ASC`;

    const locations = await all(sql, params);
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// CREATE location inside warehouse
router.post('/locations', authenticateToken, async (req, res) => {
  try {
    const { warehouse_id, name, code, type } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Location name and code are required' });
    }

    const result = await run(
      'INSERT INTO locations (warehouse_id, name, code, type) VALUES (?, ?, ?, ?)',
      [warehouse_id || null, name.trim(), code.trim().toUpperCase(), type || 'internal']
    );

    res.status(201).json({ id: result.lastID, message: 'Location created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create location (Code must be unique)' });
  }
});

export default router;
