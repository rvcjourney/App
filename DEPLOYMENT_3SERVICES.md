# 3-Service Deployment Guide (Backend + Admin + Frontend)

Complete guide to deploy all three services on your Hostinger server.

---

## 🎯 Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Hostinger Server                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │   Backend API    │  │  Admin Panel     │             │
│  │  (Node.js)       │  │  (React + Vite)  │             │
│  │  Port: 3000      │  │  Port: 5173      │             │
│  │  Container: ✓    │  │  Container: ✓    │             │
│  └──────────────────┘  └──────────────────┘             │
│                                                           │
│  ┌──────────────────────────────────┐                   │
│  │     Frontend (React Native)      │                   │
│  │     (Expo Dev Server)            │                   │
│  │     Port: 8081 + 19000           │                   │
│  │     Container: ✓                 │                   │
│  └──────────────────────────────────┘                   │
│                                                           │
│  Shared Network: connectiqo-network                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

- Hostinger 16GB Server
- SSH access to server
- Git installed on server
- Your GitHub repo: `https://github.com/rvcjourney/App.git`

---

## 🚀 Deployment Steps

### Step 1: SSH into Your Server

```bash
ssh root@YOUR_SERVER_IP
```

### Step 2: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker-compose --version
```

### Step 3: Clone Your Repository (nishadhb3 branch)

```bash
cd /opt
git clone -b nishadhb3 https://github.com/rvcjourney/App.git connectiqo
cd connectiqo

# Verify branch
git branch
# Should show: * nishadhb3
```

### Step 4: Create .env File

Copy your environment variables:

```bash
cat > .env << 'EOF'
# ==================== SUPABASE ====================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# ==================== VIDEOSDK ====================
VIDEOSDK_API_KEY=your_videosdk_api_key
VIDEOSDK_SECRET_KEY=your_videosdk_secret_key

# ==================== JWT ====================
JWT_SECRET=your_random_32_char_string

# ==================== RAZORPAY (Optional) ====================
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# ==================== EMAIL (Optional) ====================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EOF
```

**Edit with your actual values:**
```bash
nano .env
# Edit the file, then save: Ctrl+X, Y, Enter
```

### Step 5: Build All Services

```bash
# Build all three Docker images (takes 5-10 minutes)
sudo docker-compose build

# Output shows:
# - connectiqo-backend: Building...
# - connectiqo-admin: Building...
# - connectiqo-frontend: Building...
```

### Step 6: Start All Services

```bash
# Start all containers in background
sudo docker-compose up -d

# Check status
sudo docker-compose ps
```

**Expected output:**
```
NAME                   STATUS              PORTS
connectiqo-backend     Up (healthy)        0.0.0.0:3000->3000/tcp
connectiqo-admin       Up (healthy)        0.0.0.0:5173->5173/tcp
connectiqo-frontend    Up                  0.0.0.0:8081->8081/tcp, 0.0.0.0:19000->19000/tcp
```

---

## ✅ Verify All Services

### Backend API (Port 3000)

```bash
# Test health endpoint
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# Or view in browser
# http://YOUR_SERVER_IP:3000/health
```

### Admin Panel (Port 5173)

```bash
# Test Vite dev server
curl http://localhost:5173
# Should return HTML

# Or access in browser
# http://YOUR_SERVER_IP:5173
```

### Frontend (Port 8081)

```bash
# Check if React Native packager is running
curl http://localhost:8081
# Should return JavaScript bundle

# Or access Expo console
# http://YOUR_SERVER_IP:19000
```

---

## 📊 View Logs

```bash
# View all logs in real-time
sudo docker-compose logs -f

# View specific service logs
sudo docker-compose logs -f backend      # Backend only
sudo docker-compose logs -f admin-panel  # Admin panel only
sudo docker-compose logs -f frontend     # Frontend only

# View last 100 lines
sudo docker-compose logs --tail=100

# View logs since last 1 hour
sudo docker-compose logs --since 1h
```

---

## 🌐 Access Your Application

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | `http://YOUR_SERVER_IP:3000` | API endpoints, WebSockets |
| **Admin Panel** | `http://YOUR_SERVER_IP:5173` | Teacher/Admin dashboard |
| **Frontend Dev** | `http://YOUR_SERVER_IP:19000` | Expo dev console |
| **React Packager** | `http://YOUR_SERVER_IP:8081` | JavaScript bundle server |

### Example URLs (Replace with your IP)
- Backend: `http://203.0.113.45:3000`
- Admin: `http://203.0.113.45:5173`
- Frontend: `http://203.0.113.45:8081`

---

## 🔄 Update & Redeploy

When you push changes to `nishadhb3` branch:

```bash
cd /opt/connectiqo

# Pull latest code
git pull origin nishadhb3

# Rebuild and restart all services
sudo docker-compose up -d --build

# Watch the deployment
sudo docker-compose logs -f

# Check status
sudo docker-compose ps
```

---

## 🛠️ Useful Docker Commands

```bash
# ============ Container Management ============

# Start all services
sudo docker-compose up -d

# Stop all services (data preserved)
sudo docker-compose down

# Stop and remove all (careful!)
sudo docker-compose down -v

# Restart all services
sudo docker-compose restart

# Restart specific service
sudo docker-compose restart backend
sudo docker-compose restart admin-panel
sudo docker-compose restart frontend

# ============ Debugging ============

# View status
sudo docker-compose ps

# View logs (real-time)
sudo docker-compose logs -f

# View logs for specific service
sudo docker-compose logs -f backend

# Access container shell
sudo docker exec -it connectiqo-backend /bin/sh

# Execute command in container
sudo docker exec connectiqo-backend ls -la

# ============ Cleanup ============

# Remove unused images and containers
sudo docker system prune -a

# Remove unused volumes
sudo docker volume prune

# Check disk usage
sudo docker system df
```

---

## 🔗 Service Communication (Internal)

Services can communicate using their container names:

**Backend** → Other services call:
- `http://backend:3000`

**Admin Panel** → Calls backend:
- Uses `VITE_API_URL=http://backend:3000`

**Frontend** → Calls backend:
- Uses `API_URL=http://backend:3000`

This works because all services are on `connectiqo-network`.

---

## ⚙️ Environment Variables

### Backend (.env)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
VIDEOSDK_API_KEY
VIDEOSDK_SECRET_KEY
JWT_SECRET
```

### Admin Panel (.env - passed from .env)
```
VITE_API_URL=http://backend:3000
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Frontend (.env - passed from .env)
```
API_URL=http://backend:3000
SUPABASE_URL
SUPABASE_ANON_KEY
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🆘 Troubleshooting

### "Port already in use"

```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :5173
sudo lsof -i :8081

# Kill the process
sudo kill -9 <PID>

# Restart docker-compose
sudo docker-compose up -d
```

### "Containers won't start"

```bash
# Check logs
sudo docker-compose logs backend
sudo docker-compose logs admin-panel
sudo docker-compose logs frontend

# Common issues:
# 1. Missing .env file → Create it
# 2. Wrong SUPABASE_URL → Fix in .env
# 3. Port conflicts → Stop other services
# 4. Docker not running → sudo systemctl start docker
```

### "Can't reach service from another container"

```bash
# Verify network exists
sudo docker network ls | grep connectiqo

# Verify containers are on network
sudo docker network inspect connectiqo-network

# Test connection between containers
sudo docker exec connectiqo-admin curl http://backend:3000/health
```

### "Out of disk space"

```bash
# Check usage
df -h

# Clean up
sudo docker system prune -a
sudo docker volume prune

# Remove old images
sudo docker rmi <image_id>
```

---

## 📈 Monitor Services

### Real-time Resource Usage

```bash
# CPU, Memory, Network
sudo docker stats

# Just one service
sudo docker stats connectiqo-backend
```

### Check Service Health

```bash
# All services
sudo docker-compose ps

# Detailed status
sudo docker inspect connectiqo-backend

# View exit code if stopped
sudo docker inspect connectiqo-admin | grep ExitCode
```

---

## 🔐 Security Notes

✅ Keep `.env` file secure (add to .gitignore)
✅ Use strong JWT_SECRET (32+ characters)
✅ Don't commit `.env` to git
✅ Restrict file permissions:

```bash
chmod 600 .env
```

---

## 📝 Deployment Checklist

- [ ] SSH into Hostinger server
- [ ] Install Docker & Docker Compose
- [ ] Clone nishadhb3 branch
- [ ] Create .env with credentials
- [ ] Run `sudo docker-compose build`
- [ ] Run `sudo docker-compose up -d`
- [ ] Verify `sudo docker-compose ps`
- [ ] Test backend: `curl http://localhost:3000/health`
- [ ] Test admin: `http://YOUR_SERVER_IP:5173`
- [ ] Test frontend: `http://YOUR_SERVER_IP:8081`
- [ ] Check logs: `sudo docker-compose logs -f`

---

## 🎯 Next: Connect VS Code Remotely

Once all three services are running:

1. Read `VS_CODE_SETUP.md`
2. Generate SSH keys on your PC
3. Configure VS Code Remote SSH
4. Connect to Hostinger
5. Edit code in real-time!

---

## 📞 Quick Support

**Services not starting?**
```bash
sudo docker-compose logs -f
```

**Need to restart?**
```bash
sudo docker-compose restart
```

**Need to rebuild?**
```bash
sudo docker-compose up -d --build
```

**Stuck? Check logs:**
```bash
sudo docker-compose logs backend
sudo docker-compose logs admin-panel
sudo docker-compose logs frontend
```

