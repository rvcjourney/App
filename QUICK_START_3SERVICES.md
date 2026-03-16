# 🚀 Quick Start: 3-Service Deployment

Deploy Backend, Admin Panel, and Frontend on Hostinger in 10 minutes.

---

## 📊 What Gets Deployed

| Service | Technology | Port | Container |
|---------|-----------|------|-----------|
| **Backend** | Node.js (Express) | `3000` | `connectiqo-backend` |
| **Admin Panel** | React (Vite) | `5173` | `connectiqo-admin` |
| **Frontend** | React Native (Expo) | `8081/19000` | `connectiqo-frontend` |

---

## ⚡ TL;DR - Copy & Paste

```bash
# 1. SSH into your server
ssh root@YOUR_SERVER_IP

# 2. Install Docker (one command)
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose && sudo usermod -aG docker $USER

# 3. Clone repo
cd /opt && git clone -b nishadhb3 https://github.com/rvcjourney/App.git connectiqo && cd connectiqo

# 4. Create .env (paste your credentials)
nano .env
# Add these with YOUR values:
# SUPABASE_URL=your_url
# SUPABASE_SERVICE_ROLE_KEY=your_key
# SUPABASE_ANON_KEY=your_anon_key
# VIDEOSDK_API_KEY=your_api_key
# VIDEOSDK_SECRET_KEY=your_secret
# JWT_SECRET=your_32_char_secret

# 5. Deploy
sudo docker-compose build && sudo docker-compose up -d

# 6. Verify
sudo docker-compose ps
```

---

## 🌐 Access Your Services

Once running, open in browser:

```
Backend:  http://YOUR_SERVER_IP:3000
Admin:    http://YOUR_SERVER_IP:5173
Frontend: http://YOUR_SERVER_IP:8081
Console:  http://YOUR_SERVER_IP:19000
```

Example with IP `203.0.113.45`:
```
http://203.0.113.45:3000   ← Backend API
http://203.0.113.45:5173   ← Admin Dashboard
http://203.0.113.45:8081   ← Frontend
```

---

## ✅ Verify Services Running

```bash
# Check all containers
sudo docker-compose ps

# Should show all three as "Up":
# connectiqo-backend     Up (healthy)
# connectiqo-admin       Up (healthy)
# connectiqo-frontend    Up

# Test backend
curl http://localhost:3000/health

# View logs
sudo docker-compose logs -f
```

---

## 📝 Service Communication

Inside Docker network, services use hostnames:

```javascript
// Backend URL for admin panel:
http://backend:3000

// Backend URL for frontend:
http://backend:3000
```

No need to use IP addresses between services!

---

## 🔄 Common Operations

```bash
# View logs for all services
sudo docker-compose logs -f

# View specific service
sudo docker-compose logs -f backend
sudo docker-compose logs -f admin-panel
sudo docker-compose logs -f frontend

# Restart all services
sudo docker-compose restart

# Restart one service
sudo docker-compose restart backend

# Stop all (data preserved)
sudo docker-compose down

# Update code and redeploy
git pull origin nishadhb3
sudo docker-compose up -d --build
```

---

## 🛠️ If Something Goes Wrong

**Services won't start?**
```bash
sudo docker-compose logs -f
# Check output for errors
```

**Port already in use?**
```bash
sudo lsof -i :3000  # Find what's using port 3000
sudo kill -9 <PID> # Kill it
sudo docker-compose up -d # Restart
```

**Need to rebuild?**
```bash
sudo docker-compose down
sudo docker-compose build
sudo docker-compose up -d
```

**Disk full?**
```bash
sudo docker system prune -a
df -h  # Check free space
```

---

## 📋 Environment Variables Needed

Get these from your accounts before deploying:

| Variable | From | Example |
|----------|------|---------|
| `SUPABASE_URL` | Supabase → Settings | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings | `eyJhbGc...` |
| `SUPABASE_ANON_KEY` | Supabase → Settings | `eyJhbGc...` |
| `VIDEOSDK_API_KEY` | VideoSDK Dashboard | `your_key` |
| `VIDEOSDK_SECRET_KEY` | VideoSDK Dashboard | `your_secret` |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` | `random...` |

---

## 🎯 Architecture Diagram

```
┌─────────────────────────────────────────┐
│        Hostinger Server (16GB)          │
├─────────────────────────────────────────┤
│                                         │
│  Docker Compose (connectiqo-network)    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Backend (Node.js)               │   │
│  │ Port: 3000                      │   │
│  │ Container: connectiqo-backend   │   │
│  └─────────────────────────────────┘   │
│                ▲                        │
│                │                        │
│                └────────┬───────────┐   │
│                         │           │   │
│  ┌──────────────────────┴──────┐   │   │
│  │ Admin Panel (React/Vite)    │   │   │
│  │ Port: 5173                  │   │   │
│  └─────────────────────────────┘   │   │
│                                     │   │
│  ┌──────────────────────────────┐   │   │
│  │ Frontend (React Native/Expo) │   │   │
│  │ Ports: 8081, 19000           │◄──┘   │
│  └──────────────────────────────┘       │
│                                         │
│  All services on: connectiqo-network    │
└─────────────────────────────────────────┘

External Access:
- Backend: http://YOUR_IP:3000
- Admin: http://YOUR_IP:5173
- Frontend: http://YOUR_IP:8081
```

---

## 🚀 Next: VS Code Remote Connection

After deployment works:

1. Read `VS_CODE_SETUP.md`
2. Generate SSH keys on your PC
3. Add to Hostinger server
4. Connect VS Code → Edit live!

---

## 📞 Quick Support

| Problem | Solution |
|---------|----------|
| Services not starting | `sudo docker-compose logs -f` |
| Port in use | `sudo lsof -i :PORT` then `sudo kill -9 PID` |
| Out of disk | `sudo docker system prune -a` |
| Need to rebuild | `sudo docker-compose up -d --build` |
| Want to see logs | `sudo docker-compose logs -f` |
| Want to stop | `sudo docker-compose down` |
| Want to restart | `sudo docker-compose restart` |

---

## ✨ You're Done!

All three services are running. Visit:

```
🖥️  Admin Dashboard:   http://YOUR_SERVER_IP:5173
⚙️  Backend API:       http://YOUR_SERVER_IP:3000
📱 Frontend:          http://YOUR_SERVER_IP:8081
```

Next: Connect VS Code and start editing! 🎉

