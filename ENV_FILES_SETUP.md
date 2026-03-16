# 🔐 Environment Files Setup (Multi-Service)

Complete guide to setup `.env` files for Backend, Admin Panel, and Frontend on Hostinger.

---

## 📁 **Folder Structure**

Your project has 3 services, each with its own `.env` file:

```
/opt/connectiqo/
│
├── .env                          ← ROOT (Mobile App)
│   ├── SUPABASE_URL
│   ├── SUPABASE_ANON_KEY
│   ├── REACT_APP_AUTH_URL
│   ├── VIDEOSDK_API_KEY
│   └── ... other shared vars
│
├── backend/
│   ├── .env                      ← BACKEND (Node.js)
│   │   ├── SUPABASE_SERVICE_ROLE_KEY
│   │   ├── VIDEOSDK_API_KEY
│   │   ├── VIDEOSDK_SECRET_KEY
│   │   ├── RAZORPAY_KEY_ID
│   │   ├── EMAIL_USER
│   │   └── PORT=3000
│   └── server.js
│
└── LearningPlatform/
    ├── .env                      ← ADMIN PANEL (React/Vite)
    │   ├── VITE_API_URL
    │   ├── VITE_SUPABASE_URL
    │   ├── VITE_SUPABASE_ANON_KEY
    │   └── VITE_APP_NAME
    └── src/
```

---

## 🚀 **Setup on Hostinger (One-Time)**

### **Step 1: SSH into Your Server**

```bash
ssh root@147.93.104.60
cd /opt/connectiqo
```

### **Step 2: Create Root .env**

This is for the **Mobile App** (React Native/Expo):

```bash
cat > .env << 'EOF'
# ==========================================
# MOBILE APP CONFIGURATION (Root .env)
# ==========================================

# Supabase
SUPABASE_URL=https://wgyoarzdzlkadefydfvk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW9hcnpkemxrYWRlZnlkZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MDAsImV4cCI6MjA4NDQwOTkwMH0.q-m3bC7kkC7gLmeHFPOX4hI3n61f9jgxV38fEpmeCzk

# Mobile App Backend URL (for API calls)
# Change 147.93.104.60 to your actual server IP
REACT_APP_AUTH_URL=http://147.93.104.60:3000

# VideoSDK (for video calls)
VIDEOSDK_API_KEY=84fb2ab8-f54a-441a-9e88-ef463946b560
VIDEOSDK_SECRET_KEY=5ac5c5cd0434fb72366209b3d36f4ae9aeeaf546611b9ebd0cfdc46c91f9de65

# Razorpay (for payments)
RAZORPAY_KEY_ID=rzp_test_SIln93dkJQkYvX
RAZORPAY_KEY_SECRET=HhuXud74s21MAezE766rKNzh

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=ramvish9923@gmail.com
EMAIL_PASSWORD=awgygopwokzvftqa
EOF
```

### **Step 3: Create backend/.env**

This is for the **Backend API** (Node.js):

```bash
cat > backend/.env << 'EOF'
# ==========================================
# BACKEND API CONFIGURATION
# ==========================================

# Supabase (Backend uses Service Role Key for privileged operations)
SUPABASE_URL=https://wgyoarzdzlkadefydfvk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW9hcnpkemxrYWRlZnlkZnZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODgzMzkwMCwiZXhwIjoyMDg0NDA5OTAwfQ.tNKX9aXRmPX3gzDQBLQe7d0z3-cmxAtYNqJqMdBULmk
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW9hcnpkemxrYWRlZnlkZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MDAsImV4cCI6MjA4NDQwOTkwMH0.q-m3bC7kkC7gLmeHFPOX4hI3n61f9jgxV38fEpmeCzk

# VideoSDK Token Generation
VIDEOSDK_API_KEY=84fb2ab8-f54a-441a-9e88-ef463946b560
VIDEOSDK_SECRET_KEY=5ac5c5cd0434fb72366209b3d36f4ae9aeeaf546611b9ebd0cfdc46c91f9de65

# Razorpay Payment Processing
RAZORPAY_KEY_ID=rzp_test_SIln93dkJQkYvX
RAZORPAY_KEY_SECRET=HhuXud74s21MAezE766rKNzh

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=ramvish9923@gmail.com
EMAIL_PASSWORD=awgygopwokzvftqa

# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Secret (IMPORTANT: Generate unique secret)
JWT_SECRET=your_random_32_character_secret_key_here
EOF
```

### **Step 4: Create LearningPlatform/.env**

This is for the **Admin Panel** (React/Vite):

```bash
cat > LearningPlatform/.env << 'EOF'
# ==========================================
# ADMIN PANEL CONFIGURATION (Vite React)
# ==========================================

# Backend API URL
# IMPORTANT: Inside Docker use: http://backend:3000
# From browser (external): http://147.93.104.60:3000
VITE_API_URL=http://backend:3000

# Supabase (Admin uses Anon Key - public access)
VITE_SUPABASE_URL=https://wgyoarzdzlkadefydfvk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW9hcnpkemxrYWRlZnlkZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MDAsImV4cCI6MjA4NDQwOTkwMH0.q-m3bC7kkC7gLmeHFPOX4hI3n61f9jgxV38fEpmeCzk

# App Configuration
VITE_APP_NAME=LearningPlatform Admin
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_DEBUG=false
EOF
```

---

## ✅ **Verify .env Files Are Created**

```bash
# Check all .env files exist
ls -la .env backend/.env LearningPlatform/.env

# Output should show:
# -rw-r--r-- 1 root root  XXX .env
# -rw-r--r-- 1 root root  XXX backend/.env
# -rw-r--r-- 1 root root  XXX LearningPlatform/.env
```

---

## 🔄 **How Docker Reads .env Files**

```yaml
docker-compose.yml:

backend:
  env_file: ./backend/.env          ← Reads backend/.env

admin-panel:
  env_file: ./LearningPlatform/.env ← Reads LearningPlatform/.env

frontend:
  env_file: ./.env                  ← Reads root .env
```

### **Order of Precedence** (what wins if variable is in multiple places)

```
1. environment: section in docker-compose.yml (HIGHEST)
2. env_file: specified in docker-compose.yml
3. .env files in each directory
4. Default values in code (LOWEST)
```

---

## 📱 **What Each Service Gets**

### **Backend Container**
```
Reads: backend/.env
Gets:
- SUPABASE_SERVICE_ROLE_KEY ✓ (can read/write all tables)
- VIDEOSDK_API_KEY ✓
- VIDEOSDK_SECRET_KEY ✓
- RAZORPAY_KEY_ID ✓
- EMAIL credentials ✓
- JWT_SECRET ✓
- PORT=3000 ✓
```

### **Admin Panel Container**
```
Reads: LearningPlatform/.env
Gets:
- VITE_API_URL=http://backend:3000 ✓ (internal Docker network)
- VITE_SUPABASE_URL ✓
- VITE_SUPABASE_ANON_KEY ✓ (can only read/write public data)
- VITE_APP_NAME ✓
- VITE_DEBUG ✓
```

### **Frontend Container (Mobile App)**
```
Reads: .env
Gets:
- REACT_APP_AUTH_URL=http://147.93.104.60:3000 ✓
- SUPABASE_ANON_KEY ✓
- VIDEOSDK credentials ✓
- RAZORPAY credentials ✓
```

---

## 🔑 **Important Security Notes**

### **Service Role Key vs Anon Key**

**Backend uses SERVICE_ROLE_KEY because:**
- Can read/write all tables (admin operations)
- Can bypass RLS (Row Level Security)
- ONLY used on server (never exposed to frontend)

**Admin & Mobile use ANON_KEY because:**
- Limited to public data
- Respects RLS policies
- Safe to expose in frontend code

### **Protect Your Secrets**

```bash
# Set secure permissions on .env files
chmod 600 .env
chmod 600 backend/.env
chmod 600 LearningPlatform/.env

# Never commit .env to git (add to .gitignore)
cat >> .gitignore << EOF
.env
backend/.env
LearningPlatform/.env
EOF
```

---

## 🚀 **Deploy with .env Files**

Once all `.env` files are created:

```bash
cd /opt/connectiqo

# Build all services
sudo docker-compose build

# Start all services (they'll read their respective .env files)
sudo docker-compose up -d

# Verify
sudo docker-compose ps
```

---

## 📝 **Update Environment Variables**

When you need to change a value:

```bash
# Edit the specific .env file
nano .env                      # For mobile app
nano backend/.env              # For backend
nano LearningPlatform/.env     # For admin panel

# Save and restart affected service
sudo docker-compose restart backend      # If backend/.env changed
sudo docker-compose restart admin-panel  # If LearningPlatform/.env changed
sudo docker-compose restart frontend     # If .env changed
```

---

## 🔗 **Inter-Service Communication**

### **How Services Call Each Other**

Inside Docker network (use container names):
```
Admin Panel → Backend:  http://backend:3000
Frontend → Backend:     http://backend:3000
Mobile App → Backend:   http://147.93.104.60:3000 (external IP)
```

### **Why Different URLs?**

```
Inside Docker (container to container):
  http://backend:3000  ✓ Works (Docker DNS resolves hostname)

Outside Docker (browser to container):
  http://147.93.104.60:3000  ✓ Works (external IP)
  http://backend:3000        ✗ Doesn't work (can't resolve)
```

---

## ✨ **Environment Variables Used By Each Service**

### **Root .env (Mobile/Frontend)**
```
SUPABASE_URL                → Supabase project URL
SUPABASE_ANON_KEY          → Public access key
REACT_APP_AUTH_URL         → Backend URL (http://147.93.104.60:3000)
VIDEOSDK_API_KEY           → For generating video tokens
VIDEOSDK_SECRET_KEY        → For generating video tokens
RAZORPAY_KEY_ID            → For payments
RAZORPAY_KEY_SECRET        → For payments
EMAIL_USER                 → Sender email
EMAIL_PASSWORD             → Email password
```

### **backend/.env**
```
SUPABASE_URL               → Supabase URL
SUPABASE_SERVICE_ROLE_KEY  → Admin access to Supabase
SUPABASE_ANON_KEY          → Public access to Supabase
VIDEOSDK_API_KEY           → Token generation
VIDEOSDK_SECRET_KEY        → Token generation
RAZORPAY_KEY_ID            → Payment processing
RAZORPAY_KEY_SECRET        → Payment processing
EMAIL_SERVICE              → Email provider
EMAIL_USER                 → Sender email
EMAIL_PASSWORD             → Email app password
PORT                       → Server port (3000)
NODE_ENV                   → Environment (production)
JWT_SECRET                 → Token signing secret
```

### **LearningPlatform/.env**
```
VITE_API_URL               → Backend API (http://backend:3000)
VITE_SUPABASE_URL          → Supabase URL
VITE_SUPABASE_ANON_KEY     → Public access key
VITE_APP_NAME              → App display name
VITE_APP_VERSION           → Version number
VITE_DEBUG                 → Debug flag
```

---

## 🆘 **Troubleshooting**

### **"Cannot connect to backend"**

```bash
# Check if backend container is running
sudo docker-compose ps

# Check backend logs
sudo docker-compose logs backend

# Verify backend/.env is correct
cat backend/.env | grep SUPABASE_URL
```

### **"Undefined environment variable"**

```bash
# Check which .env file container is reading
sudo docker exec connectiqo-admin env | grep VITE

# Verify file exists
ls -la LearningPlatform/.env
```

### **"Admin panel can't reach backend"**

```bash
# Inside docker-compose.yml, admin-panel should have:
env_file: ./LearningPlatform/.env
environment:
  VITE_API_URL=http://backend:3000

# Verify admin can reach backend
sudo docker exec connectiqo-admin curl http://backend:3000/health
```

---

## 📋 **Checklist**

- [ ] Root `.env` created with mobile app config
- [ ] `backend/.env` created with backend config
- [ ] `LearningPlatform/.env` created with admin config
- [ ] All .env files have correct values (not placeholders)
- [ ] Permissions set: `chmod 600 .env*`
- [ ] Added to .gitignore (don't commit!)
- [ ] Verified with: `ls -la .env backend/.env LearningPlatform/.env`
- [ ] Services built: `sudo docker-compose build`
- [ ] Services started: `sudo docker-compose up -d`
- [ ] All services healthy: `sudo docker-compose ps`

---

## 🎉 **You're All Set!**

All three services now read from their own `.env` files on Hostinger:

```
✅ Mobile App (Root):  Uses .env
✅ Backend (Node.js):  Uses backend/.env
✅ Admin Panel (Vite): Uses LearningPlatform/.env
```

Deploy with:
```bash
sudo docker-compose up -d
```

All services will automatically load their respective environment variables! 🚀

