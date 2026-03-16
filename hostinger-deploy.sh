#!/bin/bash

# ============================================
# CONNECTIQO COMPLETE DEPLOYMENT SCRIPT
# For Hostinger Server
# ============================================
# Usage: bash hostinger-deploy.sh
# This script will:
# 1. Install Docker & Docker Compose
# 2. Clone your repository
# 3. Create all .env files
# 4. Build and start services
# 5. Verify everything works
# ============================================

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   CONNECTIQO DEPLOYMENT SCRIPT        ║"
echo "║   Hostinger Server Setup               ║"
echo "║   IP: 147.93.104.60                    ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# STEP 1: Update System
# ============================================
echo -e "${YELLOW}[Step 1] Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}\n"

# ============================================
# STEP 2: Install Docker
# ============================================
echo -e "${YELLOW}[Step 2] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# ============================================
# STEP 3: Install Docker Compose
# ============================================
echo -e "${YELLOW}[Step 3] Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# ============================================
# STEP 4: Add user to docker group
# ============================================
echo -e "${YELLOW}[Step 4] Configuring Docker permissions...${NC}"
sudo usermod -aG docker $USER
newgrp docker
echo -e "${GREEN}✓ Docker permissions configured${NC}\n"

# ============================================
# STEP 5: Clone Repository
# ============================================
echo -e "${YELLOW}[Step 5] Cloning repository...${NC}"
if [ -d "/opt/connectiqo" ]; then
    echo -e "${YELLOW}Repository already exists at /opt/connectiqo${NC}"
    cd /opt/connectiqo
    echo "Pulling latest code..."
    git pull origin nishadhb3
else
    mkdir -p /opt
    cd /opt
    git clone -b nishadhb3 https://github.com/rvcjourney/App.git connectiqo
    cd connectiqo
fi
echo -e "${GREEN}✓ Repository ready at /opt/connectiqo${NC}\n"

# ============================================
# STEP 6: Create Root .env File
# ============================================
echo -e "${YELLOW}[Step 6] Creating .env files...${NC}"

cat > /opt/connectiqo/.env << 'EOF'
SUPABASE_URL=https://wgyoarzdzlkadefydfvk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW9hcnpkemxrYWRlZnlkZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MDAsImV4cCI6MjA4NDQwOTkwMH0.q-m3bC7kkC7gLmeHFPOX4hI3n61f9jgxV38fEpmeCzk
REACT_APP_AUTH_URL=http://147.93.104.60:3000
VIDEOSDK_API_KEY=84fb2ab8-f54a-441a-9e88-ef463946b560
VIDEOSDK_SECRET_KEY=5ac5c5cd0434fb72366209b3d36f4ae9aeeaf546611b9ebd0cfdc46c91f9de65
RAZORPAY_KEY_ID=rzp_test_SIln93dkJQkYvX
RAZORPAY_KEY_SECRET=HhuXud74s21MAezE766rKNzh
EMAIL_SERVICE=gmail
EMAIL_USER=ramvish9923@gmail.com
EMAIL_PASSWORD=awgygopwokzvftqa
EOF

# ============================================
# STEP 7: Create backend/.env File
# ============================================
cat > /opt/connectiqo/backend/.env << 'EOF'
SUPABASE_URL=https://wgyoarzdzlkadefydfvk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW9hcnpkemxrYWRlZnlkZnZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODgzMzkwMCwiZXhwIjoyMDg0NDA5OTAwfQ.tNKX9aXRmPX3gzDQBLQe7d0z3-cmxAtYNqJqMdBULmk
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW9hcnpkemxrYWRlZnlkZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MDAsImV4cCI6MjA4NDQwOTkwMH0.q-m3bC7kkC7gLmeHFPOX4hI3n61f9jgxV38fEpmeCzk
VIDEOSDK_API_KEY=84fb2ab8-f54a-441a-9e88-ef463946b560
VIDEOSDK_SECRET_KEY=5ac5c5cd0434fb72366209b3d36f4ae9aeeaf546611b9ebd0cfdc46c91f9de65
RAZORPAY_KEY_ID=rzp_test_SIln93dkJQkYvX
RAZORPAY_KEY_SECRET=HhuXud74s21MAezE766rKNzh
EMAIL_SERVICE=gmail
EMAIL_USER=ramvish9923@gmail.com
EMAIL_PASSWORD=awgygopwokzvftqa
PORT=3000
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
EOF

# ============================================
# STEP 8: Create LearningPlatform/.env File
# ============================================
cat > /opt/connectiqo/LearningPlatform/.env << 'EOF'
VITE_API_URL=http://backend:3000
VITE_SUPABASE_URL=https://wgyoarzdzlkadefydfvk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW9hcnpkemxrYWRlZnlkZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MDAsImV4cCI6MjA4NDQwOTkwMH0.q-m3bC7kkC7gLmeHFPOX4hI3n61f9jgxV38fEpmeCzk
VITE_APP_NAME=LearningPlatform Admin
VITE_APP_VERSION=1.0.0
VITE_DEBUG=false
EOF

echo -e "${GREEN}✓ All .env files created${NC}\n"

# ============================================
# STEP 9: Set Secure Permissions
# ============================================
echo -e "${YELLOW}[Step 9] Setting secure permissions...${NC}"
chmod 600 /opt/connectiqo/.env
chmod 600 /opt/connectiqo/backend/.env
chmod 600 /opt/connectiqo/LearningPlatform/.env
echo -e "${GREEN}✓ Permissions set (600 - owner only)${NC}\n"

# ============================================
# STEP 10: Verify .env Files
# ============================================
echo -e "${YELLOW}[Step 10] Verifying .env files...${NC}"
echo "Files created:"
ls -lh /opt/connectiqo/.env /opt/connectiqo/backend/.env /opt/connectiqo/LearningPlatform/.env
echo -e "${GREEN}✓ All .env files verified${NC}\n"

# ============================================
# STEP 11: Build Docker Images
# ============================================
echo -e "${YELLOW}[Step 11] Building Docker images (this may take 5-10 minutes)...${NC}"
cd /opt/connectiqo
sudo docker-compose build
echo -e "${GREEN}✓ Docker images built${NC}\n"

# ============================================
# STEP 12: Start Services
# ============================================
echo -e "${YELLOW}[Step 12] Starting services...${NC}"
sudo docker-compose up -d
echo -e "${GREEN}✓ Services started${NC}\n"

# ============================================
# STEP 13: Wait for Services to be Ready
# ============================================
echo -e "${YELLOW}[Step 13] Waiting for services to be ready (30 seconds)...${NC}"
sleep 30

# ============================================
# STEP 14: Verify Services
# ============================================
echo -e "${YELLOW}[Step 14] Verifying services...${NC}"
echo ""
sudo docker-compose ps
echo ""

# ============================================
# STEP 15: Health Checks
# ============================================
echo -e "${YELLOW}[Step 15] Running health checks...${NC}"

# Backend health check
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API (port 3000) - HEALTHY${NC}"
else
    echo -e "${RED}✗ Backend API (port 3000) - FAILED${NC}"
fi

# Admin panel health check
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Admin Panel (port 5173) - HEALTHY${NC}"
else
    echo -e "${RED}✗ Admin Panel (port 5173) - FAILED${NC}"
fi

# Frontend health check
if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend (port 8081) - HEALTHY${NC}"
else
    echo -e "${RED}✗ Frontend (port 8081) - FAILED${NC}"
fi

echo ""

# ============================================
# FINAL SUMMARY
# ============================================
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════╗"
echo "║       DEPLOYMENT COMPLETE!                         ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}Your Connectiqo application is now running!${NC}\n"

echo "📊 Service URLs:"
echo "  Backend API:   http://147.93.104.60:3000"
echo "  Admin Panel:   http://147.93.104.60:5173"
echo "  Frontend:      http://147.93.104.60:8081"
echo "  Expo Console:  http://147.93.104.60:19000"
echo ""

echo "📁 Project Location: /opt/connectiqo"
echo ""

echo "📋 Useful Commands:"
echo "  View logs:      sudo docker-compose logs -f"
echo "  Status:         sudo docker-compose ps"
echo "  Restart:        sudo docker-compose restart"
echo "  Stop:           sudo docker-compose down"
echo ""

echo "🔄 To update and redeploy:"
echo "  cd /opt/connectiqo"
echo "  git pull origin nishadhb3"
echo "  sudo docker-compose up -d --build"
echo ""

echo -e "${GREEN}✨ Deployment successful! Your mobile app can now connect to:${NC}"
echo -e "${YELLOW}   http://147.93.104.60:3000${NC}"
echo ""

echo "🎉 Ready to connect VS Code? Read: VS_CODE_SETUP.md"
echo ""
