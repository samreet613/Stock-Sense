import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import warehouseRoutes from './routes/warehouses.js';
import operationRoutes from './routes/operations.js';
import ledgerRoutes from './routes/ledger.js';
import dashboardRoutes from './routes/dashboard.js';
import { initSchema } from './db/schema.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize DB schema on boot
initSchema().catch((err) => console.error('Error setting up DB schema:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api', warehouseRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'StockSense API', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 StockSense Server running on http://localhost:${PORT}`);
});
