import express from 'express';
import { run, get, all } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all products with live stock calculation
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, search, locationId, lowStockOnly } = req.query;

    let sql = `
      SELECT p.id, p.name, p.sku, p.category_id, c.name as category_name,
             p.uom, p.min_stock, p.max_stock, p.created_at,
             COALESCE(SUM(CASE WHEN l.type = 'internal' THEN sl.quantity ELSE 0 END), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      LEFT JOIN locations l ON sl.location_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      sql += ` AND p.category_id = ?`;
      params.push(category);
    }

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.sku LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY p.id ORDER BY p.name ASC`;

    const products = await all(sql, params);

    // Fetch stock breakdown per location for each product
    const stockLevels = await all(`
      SELECT sl.product_id, sl.location_id, sl.quantity, l.name as location_name, w.name as warehouse_name, l.type
      FROM stock_levels sl
      JOIN locations l ON sl.location_id = l.id
      LEFT JOIN warehouses w ON l.warehouse_id = w.id
    `);

    const result = products.map((p) => {
      const pStocks = stockLevels.filter((s) => s.product_id === p.id && s.type === 'internal');
      let status = 'normal';
      if (p.total_stock <= p.min_stock) {
        status = 'low_stock';
      } else if (p.max_stock && p.total_stock >= p.max_stock) {
        status = 'over_stock';
      }

      return {
        ...p,
        reorder_status: status,
        locations: pStocks
      };
    });

    if (lowStockOnly === 'true') {
      const filtered = result.filter((p) => p.total_stock <= p.min_stock);
      return res.json(filtered);
    }

    res.json(result);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await get(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const locations = await all(
      `SELECT sl.quantity, l.id as location_id, l.name as location_name, w.name as warehouse_name
       FROM stock_levels sl
       JOIN locations l ON sl.location_id = l.id
       LEFT JOIN warehouses w ON l.warehouse_id = w.id
       WHERE sl.product_id = ? AND l.type = 'internal'`,
      [product.id]
    );

    const totalStock = locations.reduce((acc, curr) => acc + curr.quantity, 0);

    res.json({ ...product, total_stock: totalStock, locations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// CREATE product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, sku, category_id, uom, min_stock, max_stock, initial_stock, initial_location_id } = req.body;
    if (!name || !sku) {
      return res.status(400).json({ error: 'Product name and SKU are required' });
    }

    const existingSku = await get('SELECT id FROM products WHERE sku = ?', [sku.trim().toUpperCase()]);
    if (existingSku) {
      return res.status(400).json({ error: 'SKU code already exists' });
    }

    const result = await run(
      `INSERT INTO products (name, sku, category_id, uom, min_stock, max_stock) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        sku.trim().toUpperCase(),
        category_id || null,
        uom || 'Units',
        min_stock !== undefined ? parseFloat(min_stock) : 10,
        max_stock !== undefined ? parseFloat(max_stock) : 100
      ]
    );

    const productId = result.lastID;

    // Handle initial stock if specified
    if (initial_stock && parseFloat(initial_stock) > 0 && initial_location_id) {
      const initQty = parseFloat(initial_stock);
      await run(
        `INSERT INTO stock_levels (product_id, location_id, quantity) VALUES (?, ?, ?)`,
        [productId, initial_location_id, initQty]
      );

      // Fetch virtual vendor location for move history reference
      const vendorLoc = await get(`SELECT id FROM locations WHERE type = 'vendor' LIMIT 1`);
      const srcId = vendorLoc ? vendorLoc.id : initial_location_id;

      await run(
        `INSERT INTO stock_moves (reference_no, product_id, source_location_id, dest_location_id, qty, movement_type, created_by)
         VALUES (?, ?, ?, ?, ?, 'receipt', ?)`,
        ['INIT/' + sku, productId, srcId, initial_location_id, initQty, req.user.name]
      );
    }

    res.status(201).json({ id: productId, message: 'Product created successfully' });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// UPDATE product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, sku, category_id, uom, min_stock, max_stock } = req.body;

    const product = await get('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (sku) {
      const existingSku = await get('SELECT id FROM products WHERE sku = ? AND id != ?', [sku.trim().toUpperCase(), req.params.id]);
      if (existingSku) {
        return res.status(400).json({ error: 'SKU code is already used by another product' });
      }
    }

    await run(
      `UPDATE products SET name = ?, sku = ?, category_id = ?, uom = ?, min_stock = ?, max_stock = ? WHERE id = ?`,
      [
        name,
        sku.trim().toUpperCase(),
        category_id || null,
        uom || 'Units',
        parseFloat(min_stock || 0),
        parseFloat(max_stock || 100),
        req.params.id
      ]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// CATEGORIES ENDPOINTS
router.get('/meta/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await all(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/meta/categories', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const result = await run('INSERT INTO categories (name, description) VALUES (?, ?)', [
      name.trim(),
      description ? description.trim() : ''
    ]);
    res.status(201).json({ id: result.lastID, name: name.trim(), description });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category or category name already exists' });
  }
});

export default router;
