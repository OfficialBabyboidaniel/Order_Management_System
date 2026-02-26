# Order Management System

Complete order management system with PostgreSQL database, Google Sheets sync, and Discord bot integration.

## Architecture

- **PostgreSQL** - Persistent order storage
- **Backend API** (Node.js + Express) - REST API for order management
- **Google Sheets** - Live dashboard with batched updates
- **Discord Bot** - Order intake interface

## Features

- ✅ Handles 500-1,000 orders/day
- ✅ Batched Google Sheets updates (every 60 seconds)
- ✅ Persistent PostgreSQL storage
- ✅ Docker-based deployment
- ✅ Automatic restarts
- ✅ Secure database access

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd order-management-system
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` and fill in:

```env
DB_PASSWORD=your_secure_password
GOOGLE_SHEET_ID=your_sheet_id
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
SWISH_NUMBER=your_swish_number
PAYPAL_LINK=https://www.paypal.com/paypalme/yourusername
```

### 3. Setup Google Sheets API

#### Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Sheets API**
4. Go to **IAM & Admin** > **Service Accounts**
5. Click **Create Service Account**
6. Name it `order-bot-sheets`
7. Click **Create and Continue**
8. Skip role assignment (click Continue)
9. Click **Done**

#### Generate Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Download the key file
6. Save it as `backend/service-account.json`

#### Share Google Sheet

1. Create a new Google Sheet
2. Name the first sheet tab **"Orders"**
3. Add headers in row 1:
   ```
   Order ID | Game Name | Price | Steam Name | Payment Method | Username | Status | Created At
   ```
4. Copy the Sheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```
5. Share the sheet with the service account email (found in the JSON file):
   ```
   order-bot-sheets@your-project.iam.gserviceaccount.com
   ```
6. Give it **Editor** permissions

### 4. Deploy with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 5. Verify Deployment

```bash
# Check backend health
curl http://localhost:3000/health

# Check database
docker exec -it order-postgres psql -U orderuser -d orders -c "SELECT * FROM orders;"

# View logs
docker-compose logs discord-bot
docker-compose logs backend
```

## Usage

### Discord Commands

Users can create orders in Discord:

```
beställ: Cyberpunk 2077, 59.99€, mysteamname, PayPal
```

The bot will:
1. Parse the order
2. Show confirmation buttons
3. Send to backend API when confirmed
4. Create private thread for payment

### API Endpoints

- `POST /api/orders` - Create new order
- `GET /api/orders` - List all orders
- `GET /health` - Health check

## File Structure

```
order-management-system/
├── backend/
│   ├── server.js              # Express API
│   ├── sheets.js              # Google Sheets integration
│   ├── package.json
│   ├── Dockerfile
│   └── service-account.json   # Google service account key (add this)
├── database/
│   └── init.sql               # PostgreSQL schema
├── discord-bot/               # Copy your existing bot here
│   ├── index.js               # Modified to send to API
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env                       # Your config (create from .env.example)
└── README.md
```

## Database Schema

```sql
orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE,
  game_name VARCHAR(255),
  current_price VARCHAR(50),
  steam_name VARCHAR(100),
  payment_method VARCHAR(50),
  user_id VARCHAR(50),
  username VARCHAR(100),
  status VARCHAR(50),
  thread_id VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Google Sheets Sync

- Batches updates every **60 seconds**
- Stays under API limits (100 requests/100 seconds)
- Can handle 1,000+ orders/day safely
- Automatic retry on failure

## Troubleshooting

### Backend can't connect to database

```bash
# Check if postgres is running
docker ps | grep postgres

# Check logs
docker-compose logs postgres
```

### Google Sheets not updating

```bash
# Check backend logs
docker-compose logs backend

# Verify service account key exists
ls -la backend/service-account.json

# Test API manually
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId":"TEST-123","gameName":"Test Game","currentPrice":"10€","steamName":"test","paymentMethod":"PayPal","userId":"123","username":"test","status":"confirmed"}'
```

### Discord bot not sending orders

```bash
# Check bot logs
docker-compose logs discord-bot

# Verify backend URL
docker exec order-discord-bot env | grep BACKEND_API_URL
```

## Maintenance

### Backup Database

```bash
docker exec order-postgres pg_dump -U orderuser orders > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker exec -i order-postgres psql -U orderuser orders
```

### View Database

```bash
docker exec -it order-postgres psql -U orderuser orders
```

## Security Notes

- Database only accessible from backend container
- Service account key mounted read-only
- No exposed database ports (remove `ports:` from postgres in production)
- Use strong `DB_PASSWORD`
- Keep `.env` and `service-account.json` in `.gitignore`

## License

MIT
