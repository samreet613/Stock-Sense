import express from 'express';
import { get, all } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // 1. Total Products Count
    const totalProdRow = await get('SELECT COUNT(*) as count FROM products');
    const totalProducts = totalProdRow.count;

    // 2. Low Stock Count
    const lowStockRows = await all(`
      SELECT p.id, p.min_stock,
             COALESCE(SUM(CASE WHEN l.type = 'internal' THEN sl.quantity ELSE 0 END), 0) as total_stock
      FROM products p
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      LEFT JOIN locations l ON sl.location_id = l.id
      GROUP BY p.id
      HAVING total_stock <= p.min_stock
    `);
    const lowStockCount = lowStockRows.length;

    // 3. Pending Receipts
    const receiptRow = await get(`
      SELECT COUNT(*) as count FROM operations
      WHERE type = 'receipt' AND status IN ('draft', 'waiting', 'ready')
    `);
    const pendingReceipts = receiptRow.count;

    // 4. Pending Deliveries
    const deliveryRow = await get(`
      SELECT COUNT(*) as count FROM operations
      WHERE type = 'delivery' AND status IN ('draft', 'waiting', 'ready')
    `);
    const pendingDeliveries = deliveryRow.count;

    // 5. Internal Transfers Scheduled
    const transferRow = await get(`
      SELECT COUNT(*) as count FROM operations
      WHERE type = 'internal' AND status IN ('draft', 'waiting', 'ready')
    `);
    const scheduledTransfers = transferRow.count;

    // Recent Operations
    const recentOperations = await all(`
      SELECT o.*,
             sl.name as source_location_name, dl.name as dest_location_name
      FROM operations o
      JOIN locations sl ON o.source_location_id = sl.id
      JOIN locations dl ON o.dest_location_id = dl.id
      ORDER BY o.id DESC LIMIT 6
    `);

    // Stock distribution by Category
    const categoryDistribution = await all(`
      SELECT c.name as category, COUNT(p.id) as product_count,
             COALESCE(SUM(sl.quantity), 0) as total_quantity
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      LEFT JOIN locations l ON sl.location_id = l.id AND l.type = 'internal'
      GROUP BY c.id
    `);

    res.json({
      kpis: {
        totalProducts,
        lowStockCount,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers
      },
      recentOperations,
      categoryDistribution
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to compute dashboard statistics' });
  }
});

export default router;
