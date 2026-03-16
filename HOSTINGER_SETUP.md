# Quick Start: Deploy to Hostinger

## 🚀 TL;DR - Quick Deployment (10 minutes)

### 1. SSH into Hostinger Server
```bash
ssh root@YOUR_SERVER_IP
```

### 2. Install Docker (Copy & Paste)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo usermod -aG docker $USER
```

### 3. Clone & Setup
```bash
cd /opt
git clone https://github.com/YOUR_USERNAME/connectiqo.git
cd connectiqo

# Create .env file with your credentials
cat > .env << 'EOF'
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
SUPABASE_ANON_KEY=your_anon_key
VIDEOSDK_API_KEY=your_api_key
VIDEOSDK_SECRET_KEY=your_secret
JWT_SECRET=$(openssl rand -base64 32)
EOF
```

### 4. Deploy
```bash
sudo docker-compose up -d --build
```

### 5. Verify
```bash
sudo docker-compose ps  # Should show both containers as "healthy"
curl http://localhost:3000/health  # Should return: {"status":"ok"}
curl http://localhost:80  # Should return HTML
```

---

## 📋 What Gets Created

```
Project Root/
├── docker-compose.yml       ← Orchestrates backend + admin
├── Dockerfile.backend       ← Node.js backend container
├── Dockerfile.admin         ← Nginx + React admin panel
├── nginx.conf              ← Nginx configuration
├── .env                    ← Your secret credentials (DON'T COMMIT)
├── backend/                ← Node.js API server
├── LearningPlatform/       ← React admin dashboard
└── src/                    ← React Native mobile app
```

---

## 🔗 Access Your Application

After deployment:
- **Admin Panel**: `http://YOUR_SERVER_IP`
- **Backend API**: `http://YOUR_SERVER_IP:3000`

---

## 📊 Monitor Your Application

```bash
# View live logs
sudo docker-compose logs -f

# Check container status
sudo docker-compose ps

# View specific container
sudo docker-compose logs backend
sudo docker-compose logs admin-panel

# Real-time resource usage
sudo docker stats
```

---

## 🔄 Update & Redeploy

When you make code changes:

```bash
cd /opt/connectiqo

# Pull latest code
git pull origin main

# Rebuild and restart
sudo docker-compose up -d --build

# Watch deployment
sudo docker-compose logs -f
```

---

## 🛠️ Useful Commands

```bash
# Start services
sudo docker-compose up -d

# Stop services
sudo docker-compose down

# Restart services
sudo docker-compose restart

# Remove everything and rebuild
sudo docker-compose down --volumes
sudo docker-compose up -d --build

# Access backend container shell
sudo docker exec -it connectiqo-backend /bin/sh

# View backend file
sudo docker exec connectiqo-backend cat /app/server.js

# Check disk usage
df -h

# Clean up Docker (removes unused images/containers)
sudo docker system prune -a
```

---

## 🔐 Environment Variables Needed

Create these from your accounts:

| Variable | Source | Example |
|----------|--------|---------|
| `SUPABASE_URL` | Supabase → Settings → API | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | `eyJhbGc...` |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API | `eyJhbGc...` |
| `VIDEOSDK_API_KEY` | VideoSDK Dashboard | `your_key` |
| `VIDEOSDK_SECRET_KEY` | VideoSDK Dashboard | `your_secret` |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` | `random_32_char_string` |

---

## ❌ Troubleshooting

### "docker: command not found"
```bash
# Reinstall Docker
curl -fsSL https://get.docker.com | sh
```

### "Cannot connect to port 3000"
```bash
# Check if container is running
sudo docker-compose ps

# View errors
sudo docker-compose logs backend
```

### "Port 80 already in use"
```bash
# Find what's using it
sudo lsof -i :80

# Stop that process
sudo kill -9 <PID>
```

### ".env file not found"
```bash
# Create it
nano .env
# Add your credentials and save (Ctrl+X, Y, Enter)
```

### Containers keep restarting
```bash
# Check logs
sudo docker-compose logs --tail=50 backend

# Common issue: Wrong SUPABASE_URL or missing JWT_SECRET
# Edit .env and restart
sudo docker-compose restart
```

---

## ✅ Health Check

Test your deployment:

```bash
# Backend is responding
curl -i http://localhost:3000/health

# Admin panel is serving HTML
curl -i http://localhost:80

# Both containers are healthy
sudo docker-compose ps | grep healthy
```

---

## 🎯 Next: Connect VS Code Remotely

Once deployment is successful:

1. Read: `../VS_CODE_SETUP.md`
2. Configure SSH connection to `YOUR_SERVER_IP`
3. Open `/opt/connectiqo` folder in VS Code
4. Start editing with real-time sync!

---

## 📞 Support

**Stuck?** Check these in order:

1. View logs: `sudo docker-compose logs -f`
2. Check .env variables: `cat .env`
3. Verify Hostinger firewall: Allow ports 80, 443, 3000
4. Restart services: `sudo docker-compose restart`

