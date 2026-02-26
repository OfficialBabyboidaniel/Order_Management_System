# OrderBot Integration Guide

This guide explains how to integrate your existing OrderBot (https://github.com/OfficialBabyboidaniel/OrderBot) with the Order Management System backend.

## Setup Steps

### 1. Add Backend API URL to OrderBot

Add this to your OrderBot `.env` file:
```env
BACKEND_API_URL=http://localhost:3000
```

If the bot runs on a different server, use the server's IP:
```env
BACKEND_API_URL=http://YOUR_SERVER_IP:3000
```

### 2. Install axios in OrderBot

```bash
cd /path/to/OrderBot
npm install axios
```

### 3. Add API Integration Code

Add this code to your `index.js` after the imports:

```javascript
const axios = require('axios');

// Backend API URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

// Function to send order to backend
async function sendOrderToBackend(orderData) {
    try {
        const response = await axios.post(`${BACKEND_API_URL}/api/orders`, {
            game_name: orderData.gameName,
            steam_price: orderData.currentPrice,
            customer_price: orderData.customerPrice || orderData.currentPrice,
            steam_name: orderData.steamName,
            payment_method: orderData.paymentMethod,
            discord_user_id: orderData.userId,
            discord_username: orderData.username,
            status: orderData.status || 'pending'
        });
        
        console.log('Order sent to backend:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to send order to backend:', error.message);
        return null;
    }
}

// Function to update order status
async function updateOrderStatus(orderId, status, notes = null) {
    try {
        const response = await axios.put(`${BACKEND_API_URL}/api/orders/${orderId}`, {
            status,
            notes
        });
        
        console.log('Order status updated:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to update order status:', error.message);
        return null;
    }
}
```

### 4. Modify Order Confirmation

In the `confirm` action handler (around line 350), add this after `order.status = 'confirmed';`:

```javascript
// Send order to backend
const backendOrder = await sendOrderToBackend(order);
if (backendOrder) {
    order.backendId = backendOrder.id; // Store backend order ID
}
```

### 5. Modify Payment Confirmation

In the payment confirmation handler (around line 280), add this after `order.status = 'payment_pending';`:

```javascript
// Update order status in backend
if (order.backendId) {
    await updateOrderStatus(order.backendId, 'payment_pending', 'Customer confirmed payment');
}
```

## API Endpoints

The backend provides these endpoints:

- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get specific order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

## Data Flow

1. User creates order in Discord → Stored in bot's `activeOrders` Map
2. User confirms order → Sent to backend API → Saved to PostgreSQL + Google Sheets
3. User confirms payment → Status updated in backend
4. Backend automatically syncs to Google Sheets

## Testing

After integration, test by:
1. Creating an order in Discord
2. Confirming the order
3. Check backend logs: `docker-compose logs -f backend`
4. Verify order appears in Google Sheets

## Troubleshooting

- **Connection refused**: Make sure backend is running (`docker-compose ps`)
- **401/403 errors**: Check if backend requires authentication (currently it doesn't)
- **Orders not syncing**: Check backend logs and Google Sheets API credentials
