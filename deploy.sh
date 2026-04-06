#!/bin/bash

# Order Management System - Server Deployment Script
# Run this on your Ubuntu server

set -e

echo "🚀 Starting Order Management System deployment..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker compose.yml not found. Are you in the Order_Management_System directory?"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create it from .env.example"
    exit 1
fi

# Check if service-account.json exists
if [ ! -f "service-account.json" ]; then
    echo "⚠️  Warning: service-account.json not found. Google Sheets integration will not work."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Copy service-account.json to backend directory
if [ -f "service-account.json" ]; then
    echo "📋 Copying service-account.json to backend directory..."
    cp service-account.json backend/service-account.json
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Build and start services
echo "🏗️  Building and starting services..."
docker compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Checking service status..."
docker compose ps

# Show logs
echo ""
echo "📝 Recent logs:"
docker compose logs --tail=20

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Services running:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Backend API: http://localhost:3000"
echo ""
echo "🔍 Useful commands:"
echo "   - View logs: docker compose logs -f"
echo "   - Stop services: docker compose down"
echo "   - Restart: docker compose restart"
echo "   - Check status: docker compose ps"
echo ""
echo "📖 Next steps:"
echo "   1. Test API: curl http://localhost:3000/api/orders"
echo "   2. Integrate with OrderBot (see ORDERBOT_INTEGRATION.md)"
echo "   3. Check Google Sheets sync"
