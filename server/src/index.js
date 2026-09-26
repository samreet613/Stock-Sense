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
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;

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

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`\n🚀 StockSense Server running successfully on http://localhost:${port}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is currently in use. Retrying on port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(DEFAULT_PORT);
