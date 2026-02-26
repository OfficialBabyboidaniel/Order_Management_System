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
  const { order_id, game_name, steam_price, customer_price, steam_name, payment_method, discord_user_id, discord_username, status } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO orders (order_id, game_name, current_price, steam_name, payment_method, user_id, username, status, thread_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [order_id, game_name, steam_price, steam_name, payment_method, discord_user_id, discord_username, status, null]
    );

    pendingOrders.push(result.rows[0]);

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error saving order:', error);
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
