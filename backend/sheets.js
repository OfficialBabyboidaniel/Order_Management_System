const { google } = require('googleapis');
const fs = require('fs');

let sheets = null;
let spreadsheetId = process.env.GOOGLE_SHEET_ID;

async function initSheets() {
  if (sheets) return sheets;

  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const client = await auth.getClient();
  sheets = google.sheets({ version: 'v4', auth: client });
  return sheets;
}

async function syncToSheets(orders) {
  if (!spreadsheetId) {
    console.log('No Google Sheet ID configured, skipping sync');
    return;
  }

  try {
    const api = await initSheets();

    for (const order of orders) {
      // Check if row already exists
      const existing = await api.spreadsheets.values.get({
        spreadsheetId,
        range: 'Orders!A:A'
      });

      const rows = existing.data.values || [];
      const rowIndex = rows.findIndex(r => r[0] === order.order_id);

      if (rowIndex > 0) {
        // Update existing row's status and mod_verified columns only
        await api.spreadsheets.values.update({
          spreadsheetId,
          range: `Orders!E${rowIndex + 1}:F${rowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [[order.status, order.mod_verified ? 'Ja' : 'Nej']] }
        });
      } else {
        // Append new row
        await api.spreadsheets.values.append({
          spreadsheetId,
          range: 'Orders!A:G',
          valueInputOption: 'USER_ENTERED',
          resource: { values: [[
            order.order_id,
            order.discord_username,
            order.payment_method,
            order.referral_code || '',
            order.status,
            order.mod_verified ? 'Ja' : 'Nej',
            new Date(order.created_at).toISOString()
          ]] }
        });
      }
    }

    console.log(`Synced ${orders.length} orders to Google Sheets`);
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error.message);
  }
}

module.exports = { syncToSheets };
