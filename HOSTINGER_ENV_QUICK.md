# ⚡ Hostinger .env Quick Setup

Copy-paste commands to create all .env files on Hostinger (147.93.104.60)

---

## 🚀 One-Command Setup

```bash
# SSH into server
ssh root@147.93.104.60

# Go to project
cd /opt/connectiqo

# Run all commands below in sequence
```

---

## 📝 Create Root .env (Mobile App)

```bash
cat > .env << 'EOF'
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
```

---

## 📝 Create backend/.env (Node.js API)

```bash
cat > backend/.env << 'EOF'
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
```

---

## 📝 Create LearningPlatform/.env (Admin Panel)

```bash
cat > LearningPlatform/.env << 'EOF'
VITE_API_URL=http://backend:3000
VITE_SUPABASE_URL=https://wgyoarzdzlkadefydfvk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW9hcnpkemxrYWRlZnlkZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MDAsImV4cCI6MjA4NDQwOTkwMH0.q-m3bC7kkC7gLmeHFPOX4hI3n61f9jgxV38fEpmeCzk
VITE_APP_NAME=LearningPlatform Admin
VITE_APP_VERSION=1.0.0
VITE_DEBUG=false
EOF
```

---

## ✅ Verify Files Created

```bash
# List all .env files
ls -la .env backend/.env LearningPlatform/.env

# Should show all 3 files:
# -rw-r--r-- .env
# -rw-r--r-- backend/.env
# -rw-r--r-- LearningPlatform/.env
```

---

## 🔒 Secure Permissions

```bash
# Set secure permissions (600 = only owner can read/write)
chmod 600 .env
chmod 600 backend/.env
chmod 600 LearningPlatform/.env

# Verify
ls -l .env backend/.env LearningPlatform/.env
# Should all show: -rw-------
```

---

## 🚀 Deploy with .env Files

```bash
# Build all services with .env files
sudo docker-compose build

# Start all services
sudo docker-compose up -d

# Verify all running
sudo docker-compose ps

# Should show all 3 healthy:
# connectiqo-backend     Up (healthy)
# connectiqo-admin       Up (healthy)
# connectiqo-frontend    Up
```

---

## ✨ Check Services Work

```bash
# Backend
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# Admin Panel
curl http://localhost:5173
# Expected: HTML response

# View logs
sudo docker-compose logs -f
```

---

## 📱 Mobile App Configuration

Your mobile app should use:
```
Backend API: http://147.93.104.60:3000
```

Update in your code:
- `src/config/api.js`
- `.env` (if you have one in mobile app)
- Any hardcoded localhost references

---

## 🆘 Quick Fixes

### "Permission denied" on .env file
```bash
chmod 600 .env backend/.env LearningPlatform/.env
```

### "env_file not found"
```bash
# Verify files exist
ls -la .env backend/.env LearningPlatform/.env

# If missing, recreate with commands above
```

### Restart services with new .env
```bash
sudo docker-compose restart
```

### Rebuild with new .env
```bash
sudo docker-compose down
sudo docker-compose build
sudo docker-compose up -d
```

---

## 📊 What Each Service Gets

```
ROOT .env (Mobile App)
├─ SUPABASE_URL
├─ SUPABASE_ANON_KEY
├─ REACT_APP_AUTH_URL=http://147.93.104.60:3000
├─ VIDEOSDK_API_KEY
├─ VIDEOSDK_SECRET_KEY
├─ RAZORPAY_KEY_ID
└─ EMAIL credentials

backend/.env (Node.js API)
├─ SUPABASE_SERVICE_ROLE_KEY (admin access)
├─ VIDEOSDK_API_KEY & SECRET
├─ RAZORPAY_KEY_ID & SECRET
├─ EMAIL credentials
├─ PORT=3000
├─ NODE_ENV=production
└─ JWT_SECRET

LearningPlatform/.env (Admin Web)
├─ VITE_API_URL=http://backend:3000
├─ VITE_SUPABASE_URL
├─ VITE_SUPABASE_ANON_KEY
├─ VITE_APP_NAME
├─ VITE_APP_VERSION
└─ VITE_DEBUG
```

---

## 🎉 Done!

All three services now have their own `.env` files on Hostinger!

```
✅ .env (Root)           → Mobile App
✅ backend/.env          → Node.js Backend
✅ LearningPlatform/.env → Admin Panel

All services deployed and configured!
```

---

## 📝 Next Steps

1. Run deployment:
   ```bash
   sudo docker-compose build && sudo docker-compose up -d
   ```

2. Verify services:
   ```bash
   sudo docker-compose ps
   ```

3. Update mobile app with backend URL:
   ```
   http://147.93.104.60:3000
   ```

4. Setup VS Code Remote (optional):
   - Read: `VS_CODE_SETUP.md`

---

**Your Hostinger deployment is ready! 🚀**

