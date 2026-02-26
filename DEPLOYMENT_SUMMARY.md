# Order Management System - Deployment Summary

## What We've Done

### 1. Repository Setup ✅
- GitHub repo: https://github.com/OfficialBabyboidaniel/Order_Management_System
- Code pushed successfully
- SSH keys configured

### 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Ubuntu Server                         │
│                                                          │
│  ┌──────────────┐      ┌──────────────┐                │
│  │   OrderBot   │─────▶│   Backend    │                │
│  │  (Discord)   │ HTTP │     API      │                │
│  │              │      │  (Port 3000) │                │
│  └──────────────┘      └───────┬──────┘                │
│                                 │                        │
│                        ┌────────▼────────┐              │
│                        │   PostgreSQL    │              │
│                        │   (Port 5432)   │              │
│                        └─────────────────┘              │
│                                 │                        │
│                                 ▼                        │
│                        ┌─────────────────┐              │
│                        │ Google Sheets   │              │
│                        │   (via API)     │              │
│                        └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 3. What's Running Where

**Docker Containers (Order Management System):**
- `postgres` - Database for storing orders
- `backend` - REST API + Google Sheets sync

**Separate Process (Your Existing Bot):**
- `OrderBot` - Discord bot (https://github.com/OfficialBabyboidaniel/OrderBot)

## Deployment Steps on Server

### Step 1: Deploy Backend (On Server)

```bash
cd Order_Management_System

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

This will:
- Start PostgreSQL database
- Start backend API on port 3000
- Initialize database schema
- Connect to Google Sheets

### Step 2: Integrate OrderBot (On Server)

```bash
cd /path/to/your/OrderBot

# Install axios
npm install axios

# Add to .env
echo "BACKEND_API_URL=http://localhost:3000" >> .env
```

Then apply the code changes from `ORDERBOT_PATCH.js` to your `index.js`.

### Step 3: Restart OrderBot

```bash
# If using PM2
pm2 restart orderbot

# If using systemd
sudo systemctl restart orderbot

# If running manually
node index.js
```

## Testing

### 1. Test Backend API
```bash
curl http://localhost:3000/api/orders
```

### 2. Test Discord Bot
- Create an order in Discord
- Confirm the order
- Check backend logs: `docker-compose logs -f backend`
- Verify order appears in Google Sheets

### 3. Check Database
```bash
docker exec -it order-postgres psql -U orderuser -d orders -c "SELECT * FROM orders;"
```

## Files You Need on Server

✅ `.env` - Environment variables (DB password, Google Sheet ID, etc.)
✅ `service-account.json` - Google Cloud credentials
✅ `docker-compose.yml` - Container orchestration
✅ All backend code

## Environment Variables (.env)

```env
# Database
DB_PASSWORD=your_secure_password

# Google Sheets
GOOGLE_SHEET_ID=1IRMfqRXMrJ6KJSQDsntKRT-90avQw3AAQjMh_2Zxp5k

# Discord (for OrderBot, not this system)
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
SWISH_NUMBER=your_swish_number
PAYPAL_LINK=your_paypal_link
```

## Useful Commands

### Docker Management
```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Check status
docker-compose ps
```

### Database Access
```bash
# Connect to database
docker exec -it order-postgres psql -U orderuser -d orders

# View orders
docker exec -it order-postgres psql -U orderuser -d orders -c "SELECT * FROM orders;"
```

### Troubleshooting
```bash
# Check if backend is responding
curl http://localhost:3000/api/orders

# Check backend logs
docker-compose logs backend

# Check database logs
docker-compose logs postgres

# Restart backend only
docker-compose restart backend
```

## What Happens When User Orders

1. User types order in Discord
2. OrderBot validates and shows confirmation
3. User clicks "Confirm"
4. OrderBot sends order to Backend API (http://localhost:3000/api/orders)
5. Backend saves to PostgreSQL
6. Backend syncs to Google Sheets
7. User confirms payment
8. OrderBot updates status in Backend
9. Backend updates Google Sheets

## Next Steps

1. ✅ Pull latest code on server: `git pull`
2. ✅ Run `./deploy.sh` to start backend
3. ⏳ Integrate OrderBot with backend (apply ORDERBOT_PATCH.js)
4. ⏳ Test end-to-end flow
5. ⏳ Monitor logs and Google Sheets

## Support Files

- `ORDERBOT_INTEGRATION.md` - Detailed integration guide
- `ORDERBOT_PATCH.js` - Exact code changes needed
- `deploy.sh` - Automated deployment script
- `DISCORD_BOT_INTEGRATION.md` - Original integration docs

## Important Notes

- Discord bot runs **separately** from docker-compose
- Backend API must be running for bot integration to work
- Google Sheets sync happens automatically when orders are created/updated
- Service account email must have access to your Google Sheet
