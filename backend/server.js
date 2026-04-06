const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { syncToSheets } = require('./sheets');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'orders',
  user: process.env.DB_USER || 'orderuser',
  password: process.env.DB_PASSWORD
});

let pendingOrders = [];
const BATCH_INTERVAL = 60000; // 1 minute

setInterval(async () => {
  if (pendingOrders.length > 0) {
    await syncToSheets(pendingOrders);
    pendingOrders = [];
  }
}, BATCH_INTERVAL);

app.post('/api/orders', async (req, res) => {
  const { order_id, discord_username, payment_method, referral_code, discord_user_id, status } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO orders (order_id, discord_username, payment_method, referral_code, user_id, username, status, thread_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [order_id, discord_username, payment_method, referral_code || null, discord_user_id, discord_username, status, null]
    );

    pendingOrders.push(result.rows[0]);

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  const { status, notes, mod_verified } = req.body;
  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1, mod_verified = COALESCE($2, mod_verified), updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, mod_verified ?? null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    pendingOrders.push(result.rows[0]);
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
