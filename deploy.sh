#!/bin/bash

# Connectiqo Deployment Script
# This script automates the deployment to Hostinger

set -e

echo "========================================="
echo "   Connectiqo Deployment Script"
echo "========================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file first:"
    echo "  cp .env.example .env"
    echo "  nano .env  # Add your credentials"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Install Docker first: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Pull latest code
echo "📥 Pulling latest code from repository..."
git pull origin main || true
echo ""

# Build images
echo "🏗️  Building Docker images (this may take 3-5 minutes)..."
sudo docker-compose build
echo ""

# Start services
echo "🚀 Starting services..."
sudo docker-compose up -d
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check status
echo ""
echo "========================================="
echo "   Deployment Status"
echo "========================================="
echo ""

if sudo docker-compose ps | grep -q "healthy\|running"; then
    echo "✅ Backend: http://localhost:3000"
    echo "✅ Admin Panel: http://localhost:80"
    echo ""
    echo "Services are running!"
else
    echo "⚠️  Some services may not be ready yet"
    echo "Check logs: sudo docker-compose logs -f"
fi

echo ""
echo "📊 View logs:"
echo "   sudo docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   sudo docker-compose down"
echo ""
echo "🔄 Restart services:"
echo "   sudo docker-compose restart"
echo ""

# Health check
echo "Running health checks..."
echo ""

# Test backend
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend health: OK"
else
    echo "⚠️  Backend health check failed"
fi

# Test admin panel
if curl -s http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Admin panel health: OK"
else
    echo "⚠️  Admin panel health check failed"
fi

echo ""
echo "========================================="
echo "✨ Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Access your application at http://YOUR_SERVER_IP"
echo "2. Monitor logs: sudo docker-compose logs -f"
echo "3. Setup VS Code remote connection"
echo ""
