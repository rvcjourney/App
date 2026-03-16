# 🚀 One-Command Deployment

Complete automated deployment using a single script.

---

## ⚡ **Ultra-Quick Start**

Just 3 commands, then everything is automated:

```bash
# 1. SSH into your server
ssh root@147.93.104.60

# 2. Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/rvcjourney/App/nishadhb3/hostinger-deploy.sh | bash

# 3. Wait 15-20 minutes while script does everything
```

**That's it! Everything else is automatic.** ✅

---

## 📋 **What the Script Does**

The `hostinger-deploy.sh` script automatically:

```
✅ Step 1:  Update system packages
✅ Step 2:  Install Docker
✅ Step 3:  Install Docker Compose
✅ Step 4:  Configure Docker permissions
✅ Step 5:  Clone your GitHub repository
✅ Step 6:  Create .env file (mobile app)
✅ Step 7:  Create backend/.env file
✅ Step 8:  Create LearningPlatform/.env file
✅ Step 9:  Set secure permissions (chmod 600)
✅ Step 10: Verify all .env files
✅ Step 11: Build Docker images (5-10 min)
✅ Step 12: Start all 3 services
✅ Step 13: Wait for services to be ready
✅ Step 14: Show service status
✅ Step 15: Run health checks
✅ DONE:   Show final summary with URLs
```

---

## 🎯 **Method 1: Copy Script to Server (Recommended)**

### **Step 1: Get the Script from GitHub**

On **your local machine**, download the script:

```bash
# Windows PowerShell or Mac/Linux terminal
curl -o hostinger-deploy.sh https://raw.githubusercontent.com/rvcjourney/App/nishadhb3/hostinger-deploy.sh

# Or clone the entire repo
git clone -b nishadhb3 https://github.com/rvcjourney/App.git
cd App
```

### **Step 2: Upload Script to Hostinger**

Using SCP (Secure Copy):

```bash
# From your local machine
scp hostinger-deploy.sh root@147.93.104.60:/tmp/
```

Or using your terminal:

```bash
# From your local machine
scp ./hostinger-deploy.sh root@147.93.104.60:/root/
```

### **Step 3: SSH and Run Script**

```bash
# SSH into server
ssh root@147.93.104.60

# Run the script
bash /tmp/hostinger-deploy.sh

# Or if in home directory
bash ~/hostinger-deploy.sh
```

---

## 🎯 **Method 2: Direct from GitHub (Easiest)**

```bash
# SSH into server
ssh root@147.93.104.60

# Download and run in one command
curl -fsSL https://raw.githubusercontent.com/rvcjourney/App/nishadhb3/hostinger-deploy.sh | bash
```

**That's it!** The script downloads and runs automatically.

---

## ⏱️ **Expected Timeline**

```
Step 1-5:   1-2 minutes    (Setup, Docker install)
Step 6-10:  1-2 minutes    (Create .env files)
Step 11:    5-10 minutes   (Build Docker images) ⏳ LONGEST PART
Step 12-15: 2-3 minutes    (Start services, health checks)
─────────────────────────────────────────────
TOTAL:      10-20 minutes
```

---

## 📊 **Script Output During Execution**

The script shows colored output:

```
🔵 BLUE   = Headers and sections
🟡 YELLOW = Current step being executed
🟢 GREEN  = ✓ Success messages
🔴 RED    = ✗ Error messages (if any)
```

Example:

```
╔════════════════════════════════════════╗
║   CONNECTIQO DEPLOYMENT SCRIPT        ║
║   Hostinger Server Setup               ║
║   IP: 147.93.104.60                    ║
╚════════════════════════════════════════╝

[Step 1] Updating system packages...
✓ System updated

[Step 2] Installing Docker...
✓ Docker installed

[Step 3] Installing Docker Compose...
✓ Docker Compose installed
...
```

---

## ✅ **What You See at the End**

```
╔════════════════════════════════════════════════╗
║       DEPLOYMENT COMPLETE!                     ║
╚════════════════════════════════════════════════╝

Your Connectiqo application is now running!

📊 Service URLs:
  Backend API:   http://147.93.104.60:3000
  Admin Panel:   http://147.93.104.60:5173
  Frontend:      http://147.93.104.60:8081
  Expo Console:  http://147.93.104.60:19000

📁 Project Location: /opt/connectiqo

📋 Useful Commands:
  View logs:      sudo docker-compose logs -f
  Status:         sudo docker-compose ps
  Restart:        sudo docker-compose restart
  Stop:           sudo docker-compose down
```

---

## 🆘 **If Script Fails**

### **Read the Error Message**

The script will show:
```
❌ Error: [Error message here]
```

### **Copy the Error and Share**

1. Copy the entire error message
2. Send it to me
3. I'll help you fix it

### **Common Issues & Fixes**

| Error | Solution |
|-------|----------|
| "Permission denied" | Use `sudo` before `bash` |
| "Command not found" | Re-SSH into server |
| "Cannot clone repo" | Check internet connection |
| "Docker build failed" | Check free disk space: `df -h` |

### **If You Need to Re-run**

```bash
# Stop and remove existing containers
sudo docker-compose down

# Run script again
bash hostinger-deploy.sh
```

---

## 🔄 **After Deployment: Common Tasks**

### **View Live Logs**

```bash
cd /opt/connectiqo
sudo docker-compose logs -f
```

### **Check Service Status**

```bash
sudo docker-compose ps
```

### **Restart Services**

```bash
sudo docker-compose restart
```

### **Stop All Services**

```bash
sudo docker-compose down
```

### **Update Code and Redeploy**

```bash
cd /opt/connectiqo
git pull origin nishadhb3
sudo docker-compose up -d --build
```

---

## 📱 **Configure Your Mobile App**

Once deployment completes, update your mobile app:

Find and replace:
```
OLD: http://192.168.x.x:3000
NEW: http://147.93.104.60:3000
```

In files:
- `src/config/api.js`
- `.env` (if you have one)
- Any hardcoded API URLs

---

## 🎯 **Test Each Service**

```bash
# Backend
curl http://147.93.104.60:3000/health

# Admin Panel
curl http://147.93.104.60:5173

# Frontend
curl http://147.93.104.60:8081
```

---

## 📚 **Full Script Breakdown**

The script is located at: `hostinger-deploy.sh`

View the full script:
```bash
cat hostinger-deploy.sh
```

Or on your local machine:
- Open in text editor
- Understand each step
- Modify if needed

---

## ✨ **You Have 3 Deployment Options**

### **Option 1: Automated Script (RECOMMENDED)** ⭐
```bash
curl -fsSL https://raw.githubusercontent.com/rvcjourney/App/nishadhb3/hostinger-deploy.sh | bash
```
- Fastest
- Least chance of errors
- Recommended for production

### **Option 2: Manual Commands**
```bash
# Follow HOSTINGER_ENV_QUICK.md
# Copy-paste commands one by one
```
- More control
- Can understand each step
- Good for learning

### **Option 3: VS Code Remote SSH**
```bash
# Read: VS_CODE_SETUP.md
# Edit and deploy directly from VS Code
```
- For ongoing development
- Edit code live
- Recommended after initial deployment

---

## 🚀 **Ready?**

### **Run This Command Now:**

```bash
ssh root@147.93.104.60
curl -fsSL https://raw.githubusercontent.com/rvcjourney/App/nishadhb3/hostinger-deploy.sh | bash
```

### **Then Wait**

Sit back and let the script do everything (10-20 minutes).

### **When Done**

You'll see:
```
✨ Deployment successful!
Your services are running at:
- http://147.93.104.60:3000   (Backend)
- http://147.93.104.60:5173   (Admin)
- http://147.93.104.60:8081   (Frontend)
```

---

## 📞 **Need Help?**

If the script fails:

1. **Copy the error message**
2. **Share with me**
3. **I'll help you fix it**

No need to manually run anything if you have the script! 🎉

---

**Your automated deployment is ready!** 🚀

