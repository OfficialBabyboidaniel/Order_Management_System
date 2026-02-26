// ============================================
// ADD THIS CODE TO YOUR OrderBot index.js
// ============================================

// 1. Add after the require statements at the top (around line 3):
const axios = require('axios');

// 2. Add after the client initialization (around line 12):
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

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
            status: orderData.status || 'pending',
            order_id: orderData.orderId
        });
        
        console.log('✅ Order sent to backend:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to send order to backend:', error.message);
        return null;
    }
}

async function updateOrderStatus(backendId, status, notes = null) {
    try {
        const response = await axios.put(`${BACKEND_API_URL}/api/orders/${backendId}`, {
            status,
            notes
        });
        
        console.log('✅ Order status updated in backend:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to update order status:', error.message);
        return null;
    }
}

// 3. MODIFY the confirm action handler (find "if (action === 'confirm')" around line 350)
// REPLACE this section:
/*
    if (action === 'confirm') {
        order.status = 'confirmed';
*/

// WITH:
    if (action === 'confirm') {
        order.status = 'confirmed';
        order.orderId = orderId; // Add order ID to data
        
        // Send order to backend
        const backendOrder = await sendOrderToBackend(order);
        if (backendOrder) {
            order.backendId = backendOrder.id;
            console.log(`Order ${orderId} saved to backend with ID ${backendOrder.id}`);
        }

// 4. MODIFY the payment confirmation handler (find "if (customId.startsWith('payment_confirmed_')" around line 280)
// ADD this after "order.status = 'payment_pending';":
        
        // Update backend
        if (order.backendId) {
            await updateOrderStatus(order.backendId, 'payment_pending', 'Customer confirmed payment via Discord');
        }

// ============================================
// INSTALLATION STEPS:
// ============================================
// 1. npm install axios
// 2. Add BACKEND_API_URL=http://localhost:3000 to your .env file
// 3. Apply the code changes above
// 4. Restart your bot
// ============================================
