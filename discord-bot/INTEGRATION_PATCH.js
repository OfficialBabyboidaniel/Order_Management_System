// Add this near the top with other requires
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://backend:3000';

// Replace the confirm action handler in the interactionCreate event
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

    // Create private thread
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
