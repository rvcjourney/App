# Deployment Guide - Connectiqo to Hostinger

## Prerequisites
- Hostinger 16GB Server
- SSH Access to your server
- Domain name (optional but recommended)

---

## Step 1: SSH into Your Hostinger Server

```bash
ssh root@YOUR_SERVER_IP
```

**Note:** Replace `YOUR_SERVER_IP` with your actual server IP (e.g., `203.0.113.45`)

---

## Step 2: Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

---

## Step 3: Clone Your Repository

```bash
# Choose your installation directory
cd /home/connectiqo
# Or use: cd /opt/connectiqo

# Clone repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git connectiqo
cd connectiqo
```

---

## Step 4: Create .env File

```bash
# Create .env file
cat > .env << 'EOF'
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# VideoSDK
VIDEOSDK_API_KEY=your_videosdk_api_key
VIDEOSDK_SECRET_KEY=your_videosdk_secret_key

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars

# Razorpay (optional)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Application URLs
BACKEND_URL=http://YOUR_SERVER_IP:3000
ADMIN_URL=http://YOUR_SERVER_IP
EOF
```

**Get your credentials from:**
- **Supabase**: Project Settings → API
- **VideoSDK**: Dashboard → API Keys
- **JWT_SECRET**: Generate: `openssl rand -base64 32`

---

## Step 5: Build and Start Containers

```bash
# Build images (this takes 3-5 minutes)
sudo docker-compose build

# Start services in background
sudo docker-compose up -d

# Check status
sudo docker-compose ps

# View logs
sudo docker-compose logs -f
```

**Expected output:**
```
NAME                COMMAND             STATUS              PORTS
connectiqo-backend  npm start           Up (healthy)        0.0.0.0:3000->3000/tcp
connectiqo-admin    nginx -g daemon     Up (healthy)        0.0.0.0:80->80/tcp
```

---

## Step 6: Verify Services Are Running

### Test Backend
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

### Test Admin Panel
```bash
curl http://localhost:80
# Should return HTML content
```

### Check Docker Logs
```bash
# Backend logs
sudo docker-compose logs backend

# Admin logs
sudo docker-compose logs admin-panel
```

---

## Step 7: Setup Domain & SSL (Optional but Recommended)

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Create nginx reverse proxy first
sudo apt install nginx -y

# Create nginx config
sudo cat > /etc/nginx/sites-available/yourdomain.com << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Step 8: Update .env with Production URLs

```bash
# Edit .env
sudo nano .env

# Update:
BACKEND_URL=https://yourdomain.com/api
ADMIN_URL=https://yourdomain.com
```

---

## Common Docker Commands

```bash
# Start services
sudo docker-compose up -d

# Stop services
sudo docker-compose down

# Restart services
sudo docker-compose restart

# View logs (last 100 lines)
sudo docker-compose logs --tail=100

# Follow logs in real-time
sudo docker-compose logs -f

# View specific service logs
sudo docker-compose logs backend

# Rebuild images
sudo docker-compose build --no-cache

# Pull latest code and restart
cd /home/connectiqo
git pull origin main
sudo docker-compose up -d --build
```

---

## Troubleshooting

### Containers not starting?
```bash
sudo docker-compose logs backend
sudo docker-compose logs admin-panel
```

### Port already in use?
```bash
sudo lsof -i :3000
sudo lsof -i :80
sudo kill -9 <PID>
```

### Out of disk space?
```bash
# Clean up
sudo docker system prune -a
sudo docker volume prune
```

### Need to access container shell?
```bash
sudo docker exec -it connectiqo-backend /bin/sh
```

---

## Next: Connect via VS Code

Once your server is running successfully:
1. Go to: [VS Code Remote SSH Setup](../README.md#vs-code-setup)
2. Configure SSH connection
3. Open your project folder remotely
4. Edit and deploy in real-time!

---

## Monitoring & Maintenance

### Check disk usage
```bash
df -h
```

### Monitor resource usage
```bash
sudo docker stats
```

### View container logs history
```bash
sudo docker logs --since 24h connectiqo-backend
```

### Backup database (Supabase handles this)
No local backups needed - Supabase handles all backups automatically.

---

## Security Best Practices

✅ Use strong JWT_SECRET
✅ Keep .env file secure (add to .gitignore)
✅ Use HTTPS with SSL certificate
✅ Keep Docker images updated
✅ Regularly pull security updates

---

## Support

For issues:
1. Check logs: `sudo docker-compose logs -f`
2. Verify .env variables are correct
3. Check Hostinger firewall rules
4. Ensure ports 80, 443 are open

