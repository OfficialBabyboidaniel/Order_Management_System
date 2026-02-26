# Discord Bot Integration Instructions

## How to Integrate Your Existing Bot

Your existing Discord bot needs a small modification to send confirmed orders to the backend API.

### Step 1: Copy Your Bot Files

Copy your existing bot files from the OrderBot repository into the `discord-bot/` folder:

```bash
# Copy these files from your OrderBot repo:
cp /path/to/OrderBot/index.js discord-bot/
cp /path/to/OrderBot/deploy-commands.js discord-bot/
cp -r /path/to/OrderBot/config discord-bot/
cp -r /path/to/OrderBot/models discord-bot/
```

### Step 2: Add node-fetch Dependency

The `package.json` in `discord-bot/` already includes `node-fetch`. Just make sure it's there.

### Step 3: Modify index.js

Add this at the top of `index.js` (after other requires):

```javascript
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://backend:3000';
```

### Step 4: Update the Confirm Handler

Find the section in `index.js` where orders are confirmed (around line 150-180). It looks like:

```javascript
if (action === 'confirm') {
    order.status = 'confirmed';
    // ... existing code
}
```

Add the API call right after `order.status = 'confirmed';`:

```javascript
if (action === 'confirm') {
    order.status = 'confirmed';
    
    // ✅ ADD THIS BLOCK
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: orderId,
                gameName: order.gameName,
                currentPrice: order.currentPrice,
                steamName: order.steamName,
                paymentMethod: order.paymentMethod,
                userId: order.userId,
                username: order.username,
                status: 'confirmed',
                threadId: null
            })
        });
        
        if (!response.ok) {
            console.error('Failed to save order to backend:', await response.text());
        } else {
            console.log(`Order ${orderId} saved to backend successfully`);
        }
    } catch (error) {
        console.error('Error sending order to backend:', error);
    }
    // ✅ END OF NEW BLOCK
    
    // ... rest of existing code (confirmEmbed, etc.)
}
```

### Step 5: Update Thread Creation (Optional)

If you want to save the thread ID to the database, modify the `createOrderThread` function to send an update after creating the thread:

```javascript
// At the end of createOrderThread function, add:
try {
    await fetch(`${BACKEND_API_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: thread.id })
    });
} catch (error) {
    console.error('Failed to update thread ID:', error);
}
```

### Complete Modified Section Example

Here's what the complete confirm handler should look like:

```javascript
if (action === 'confirm') {
    order.status = 'confirmed';
    
    // Send to backend API
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: orderId,
                gameName: order.gameName,
                currentPrice: order.currentPrice,
                steamName: order.steamName,
                paymentMethod: order.paymentMethod,
                userId: order.userId,
                username: order.username,
                status: 'confirmed',
                threadId: null
            })
        });
        
        if (!response.ok) {
            console.error('Failed to save order to backend:', await response.text());
        } else {
            console.log(`Order ${orderId} saved to backend successfully`);
        }
    } catch (error) {
        console.error('Error sending order to backend:', error);
    }
    
    const confirmEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Beställning Bekräftad!')
        .setDescription('Din beställning har bekräftats och kommer att behandlas.\n\n🔒 En privat tråd kommer att skapas för din beställning.')
        .addFields(
            { name: '🎯 Spel', value: order.gameName, inline: true },
            { name: '💰 Pris', value: order.currentPrice, inline: true },
            { name: '🆔 Beställnings-ID', value: orderId, inline: true }
        )
        .setTimestamp();

    await interaction.update({ embeds: [confirmEmbed], components: [] });

    try {
        await createOrderThread(interaction, order, orderId);
    } catch (error) {
        console.error('Fel vid skapande av tråd:', error);
        await interaction.followUp({
            content: '⚠️ Kunde inte skapa privat tråd. Kontakta en admin.',
            ephemeral: true
        });
    }

    console.log(`Beställning ${orderId} bekräftad av ${order.username}`);
}
```

### Testing

After making these changes:

1. Build and start the services:
   ```bash
   docker-compose up -d
   ```

2. Test an order in Discord:
   ```
   beställ: Test Game, 10€, testuser, PayPal
   ```

3. Check the logs:
   ```bash
   docker-compose logs discord-bot
   docker-compose logs backend
   ```

4. Verify in database:
   ```bash
   docker exec -it order-postgres psql -U orderuser -d orders -c "SELECT * FROM orders;"
   ```

5. Check Google Sheets (wait 60 seconds for batch sync)

That's it! Your bot will now save all confirmed orders to PostgreSQL and Google Sheets automatically.
