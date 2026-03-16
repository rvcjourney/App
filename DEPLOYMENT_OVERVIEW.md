# 📚 Deployment Overview & Guide Index

Complete deployment documentation for Connectiqo on Hostinger with 3 services.

---

## 🎯 Your Complete Setup

```
CONNECTIQO APPLICATION
├── 📱 Frontend (React Native/Expo)
│   ├── Port: 8081 (packager)
│   ├── Port: 19000 (console)
│   └── Container: connectiqo-frontend
│
├── 🖥️  Admin Panel (React + Vite)
│   ├── Port: 5173 (dev server)
│   └── Container: connectiqo-admin
│
├── ⚙️  Backend API (Node.js)
│   ├── Port: 3000 (express server)
│   └── Container: connectiqo-backend
│
└── 📊 Database: Supabase (managed externally)
    ├── PostgreSQL (managed)
    ├── Real-time subscriptions
    └── Authentication (OAuth)
```

---

## 📖 Documentation Files

### 🚀 **START HERE**

| Document | Best For | Time |
|----------|----------|------|
| **[QUICK_START_3SERVICES.md](QUICK_START_3SERVICES.md)** | Copy-paste deployment | 10 min |
| **[DEPLOYMENT_3SERVICES.md](DEPLOYMENT_3SERVICES.md)** | Detailed walkthrough | 30 min |
| **[VS_CODE_SETUP.md](VS_CODE_SETUP.md)** | Remote editing | 15 min |

### 📚 **Reference Docs**

| Document | Purpose |
|----------|---------|
| **[docker-compose.yml](docker-compose.yml)** | 3-service orchestration |
| **[Dockerfile.backend](Dockerfile.backend)** | Backend container |
| **[Dockerfile.admin](Dockerfile.admin)** | Admin panel container |
| **[Dockerfile.frontend](Dockerfile.frontend)** | Frontend container |
| **[nginx.conf](nginx.conf)** | Nginx configuration (if using production mode) |
| **[.dockerignore](.dockerignore)** | Exclude files from Docker |
| **[.env](/.env)** | Environment variables (your secrets) |

---

## 🎬 Recommended Reading Order

### **First Time Setup (Copy & Follow)**

```
1. QUICK_START_3SERVICES.md
   ↓ (Read the TL;DR section)
   ↓ (Copy-paste commands one by one)
   ↓
2. Verify services work
   ↓ (http://YOUR_IP:3000, :5173, :8081)
   ↓
3. VS_CODE_SETUP.md
   ↓ (If you want to edit code remotely)
```

### **Troubleshooting Issues**

```
Problem occurs
   ↓
Check QUICK_START_3SERVICES.md (Quick Support section)
   ↓
Still stuck? → DEPLOYMENT_3SERVICES.md (Troubleshooting section)
   ↓
View logs: sudo docker-compose logs -f
```

### **Detailed Learning**

```
1. QUICK_START_3SERVICES.md (overview)
   ↓
2. DEPLOYMENT_3SERVICES.md (complete guide)
   ↓
3. VS_CODE_SETUP.md (remote editing)
   ↓
4. docker-compose.yml (understand orchestration)
```

---

## ⚡ Quick Reference

### Deploy (One-time setup)

```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone code
cd /opt && git clone -b nishadhb3 https://github.com/rvcjourney/App.git connectiqo && cd connectiqo

# Configure
nano .env  # Add your credentials

# Deploy
sudo docker-compose build && sudo docker-compose up -d
```

### Access Services

```
Backend:     http://YOUR_SERVER_IP:3000
Admin:       http://YOUR_SERVER_IP:5173
Frontend:    http://YOUR_SERVER_IP:8081
```

### Manage Services

```bash
# View status
sudo docker-compose ps

# View logs
sudo docker-compose logs -f

# Restart
sudo docker-compose restart

# Stop
sudo docker-compose down

# Update & redeploy
git pull && sudo docker-compose up -d --build
```

---

## 🔗 Port Mapping

| Service | External | Internal | Container |
|---------|----------|----------|-----------|
| Backend | `3000` | `3000` | `connectiqo-backend` |
| Admin | `5173` | `5173` | `connectiqo-admin` |
| Frontend | `8081` | `8081` | `connectiqo-frontend` |
| Frontend Console | `19000` | `19000` | `connectiqo-frontend` |

### Inter-Service Communication (Inside Docker)

```javascript
// Services call each other using container names:
const backendUrl = 'http://backend:3000'  // Admin → Backend
const backendUrl = 'http://backend:3000'  // Frontend → Backend
```

---

## 🌐 Environment Variables

### Your `.env` file should contain:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# VideoSDK
VIDEOSDK_API_KEY=your_key_here
VIDEOSDK_SECRET_KEY=your_secret_here

# JWT
JWT_SECRET=your_32_character_random_string_here

# Optional: Razorpay
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

# Optional: Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Where to get credentials:

| Variable | From | Link |
|----------|------|------|
| `SUPABASE_*` | Your Supabase project | Settings → API |
| `VIDEOSDK_*` | VideoSDK Dashboard | API Settings |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` | - |
| `RAZORPAY_*` | Razorpay Dashboard | API Keys |
| `EMAIL_*` | Your Gmail/SMTP | App Passwords |

---

## 📊 Files Created for Deployment

```
connectiqo/
├── docker-compose.yml          ← Main orchestration file
├── Dockerfile.backend          ← Backend container
├── Dockerfile.admin            ← Admin panel container
├── Dockerfile.frontend         ← Frontend container
├── nginx.conf                  ← Nginx config
├── .dockerignore              ← Docker ignore file
├── .env                       ← Your environment (DON'T COMMIT!)
│
├── QUICK_START_3SERVICES.md   ← Start here! (10 min)
├── DEPLOYMENT_3SERVICES.md    ← Full guide (30 min)
├── VS_CODE_SETUP.md           ← Remote editing setup
├── HOSTINGER_SETUP.md         ← Single service guide
├── DEPLOYMENT.md              ← Original guide
│
├── backend/                   ← Node.js API
├── LearningPlatform/          ← React admin panel
├── src/                       ← React Native frontend
└── [other files]
```

---

## ✅ Deployment Checklist

- [ ] **Get credentials** from Supabase, VideoSDK, etc.
- [ ] **SSH into server** with Hostinger access
- [ ] **Install Docker** on Hostinger
- [ ] **Clone repository** (`nishadhb3` branch)
- [ ] **Create `.env`** with your credentials
- [ ] **Run `docker-compose build`** (5-10 min)
- [ ] **Run `docker-compose up -d`** to start
- [ ] **Verify services** with `docker-compose ps`
- [ ] **Test Backend** at `http://YOUR_IP:3000`
- [ ] **Test Admin** at `http://YOUR_IP:5173`
- [ ] **Test Frontend** at `http://YOUR_IP:8081`
- [ ] **Check logs** if anything fails
- [ ] **Setup VS Code** for remote editing (optional)

---

## 🎯 What Happens on Each Port

### Port 3000 - Backend API
```
GET    /health              → Server health check
POST   /api/auth/login      → User authentication
GET    /api/teachers        → List teachers
POST   /api/bookings        → Create booking
GET    /api/meetings/token  → Get VideoSDK token
```

### Port 5173 - Admin Panel
```
/                    → Dashboard
/teachers            → Manage teachers
/students            → Manage students
/bookings            → View bookings
/reports             → Analytics
```

### Port 8081 - Frontend Packager
```
/                    → JavaScript bundle
Connects mobile apps to development server
Hot reloading for React Native code
```

### Port 19000 - Expo Console
```
Expo development console
Device logs and errors
Test QR code generation
```

---

## 🔄 Development Workflow

### With VS Code Remote:

```
1. Edit file in VS Code (syncs instantly to server)
2. File auto-reloads in containers
3. See changes live at http://YOUR_IP:PORT
4. Commit and push as normal
```

### For production updates:

```bash
# Pull latest code
git pull origin nishadhb3

# Rebuild containers
sudo docker-compose up -d --build

# Services automatically restart with new code
```

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Containers won't start | `sudo docker-compose logs -f` |
| Port already in use | `sudo lsof -i :PORT && sudo kill -9 PID` |
| Services unreachable | Check firewall, allow ports 3000, 5173, 8081, 19000 |
| Out of memory | `sudo docker stats` to check, reduce services |
| Need to rebuild | `sudo docker-compose down -v && docker-compose build` |
| Lost connection to backend | Check backend logs: `sudo docker-compose logs backend` |

---

## 📞 Support Resources

### Docker Documentation
- https://docs.docker.com/compose/

### Supabase
- https://supabase.com/docs

### React/Vite
- https://vitejs.dev/guide/

### React Native/Expo
- https://docs.expo.dev/

### VideoSDK
- https://docs.videosdk.live/

---

## 🎉 You're Ready!

1. **Read**: [QUICK_START_3SERVICES.md](QUICK_START_3SERVICES.md)
2. **Deploy**: Follow the TL;DR section
3. **Verify**: Check all three services are running
4. **Connect**: Setup VS Code if needed
5. **Enjoy**: Start building! 🚀

---

## 📋 Files Summary

| File | Purpose | Status |
|------|---------|--------|
| docker-compose.yml | Orchestrate 3 services | ✅ Ready |
| Dockerfile.backend | Build backend container | ✅ Ready |
| Dockerfile.admin | Build admin panel container | ✅ Ready |
| Dockerfile.frontend | Build frontend container | ✅ Ready |
| QUICK_START_3SERVICES.md | Quick deployment guide | ✅ Ready |
| DEPLOYMENT_3SERVICES.md | Complete guide | ✅ Ready |
| VS_CODE_SETUP.md | Remote editing setup | ✅ Ready |
| Your .env file | Environment variables | ⏳ To Create |

---

**Everything is set up! Time to deploy!** 🚀

Start with: **[QUICK_START_3SERVICES.md](QUICK_START_3SERVICES.md)**

