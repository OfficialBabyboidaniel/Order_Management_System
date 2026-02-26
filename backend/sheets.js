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
    
    const values = orders.map(order => [
      order.order_id,
      order.game_name,
      order.current_price,
      order.steam_name,
      order.payment_method,
      order.username,
      order.status,
      new Date(order.created_at).toISOString()
    ]);

    await api.spreadsheets.values.append({
      spreadsheetId,
      range: 'Orders!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    console.log(`Synced ${orders.length} orders to Google Sheets`);
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error.message);
  }
}

module.exports = { syncToSheets };
