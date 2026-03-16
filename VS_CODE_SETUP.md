# VS Code Remote SSH Setup

## Prerequisites
- ✅ Application deployed on Hostinger (see HOSTINGER_SETUP.md)
- ✅ VS Code installed locally
- ✅ SSH access to Hostinger server

---

## Step 1: Generate SSH Keys (Windows)

Open PowerShell and run:

```powershell
# Generate key pair
ssh-keygen -t rsa -b 4096 -f $env:USERPROFILE\.ssh\hostinger_key -N ""

# Verify created
ls $env:USERPROFILE\.ssh\hostinger_key*

# Copy public key content
cat $env:USERPROFILE\.ssh\hostinger_key.pub | clip
```

This creates:
- `hostinger_key` (private key) ← Keep SECRET
- `hostinger_key.pub` (public key) ← Upload to server

---

## Step 2: Add SSH Key to Hostinger Server

SSH into your server:

```bash
ssh root@YOUR_SERVER_IP
```

Once logged in:

```bash
# Create SSH directory
mkdir -p ~/.ssh

# Add your public key (paste it here)
echo "YOUR_PUBLIC_KEY_CONTENT_HERE" >> ~/.ssh/authorized_keys

# Set permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Verify
cat ~/.ssh/authorized_keys
```

---

## Step 3: Install VS Code Extension

1. **Open VS Code**
2. **Go to Extensions** (Ctrl+Shift+X)
3. **Search for:** "Remote - SSH"
4. **Install** the extension by Microsoft

---

## Step 4: Configure SSH Connection

1. **Press** Ctrl+Shift+P
2. **Type:** "Remote-SSH: Open Configuration File"
3. **Select:** `C:\Users\YOUR_USERNAME\.ssh\config`
4. **Add this configuration:**

```ssh
Host hostinger
    HostName YOUR_SERVER_IP
    User root
    IdentityFile ~/.ssh/hostinger_key
    StrictHostKeyChecking no
    AddKeysToAgent yes
```

**Replace `YOUR_SERVER_IP`** with your actual IP (e.g., `203.0.113.45`)

5. **Save file** (Ctrl+S)

---

## Step 5: Connect to Remote Server

1. **Click Remote Icon** (bottom-left corner)
   - Or press: Ctrl+Shift+P → "Remote-SSH: Connect to Host"

2. **Select "hostinger"**

3. **VS Code will:**
   - Connect to server
   - Install remote server components
   - Ask for password/passphrase (if you set one)

4. **Wait for connection** (first time takes 30 seconds)

5. **Success!** Bottom-left now shows: `SSH: hostinger`

---

## Step 6: Open Your Project

1. **Press** Ctrl+K Ctrl+O
2. **Navigate to:** `/opt/connectiqo`
3. **Click "Open"**
4. **Trust the workspace** (click "Trust")

✅ **Your project is now open on the remote server!**

---

## Step 7: Open Terminal

1. **Press** Ctrl+` (backtick)
2. **Terminal opens** - it's connected to your server!

Now you can:
```bash
# View logs in real-time
sudo docker-compose logs -f

# Check status
sudo docker-compose ps

# Restart services
sudo docker-compose restart
```

---

## Real-Time Workflow

### Edit Files
- Open any file in your editor
- Make changes
- **Ctrl+S to save** → Instantly syncs to server

### View Logs
```bash
# Terminal (Ctrl+`)
sudo docker-compose logs -f backend
```

### Run Commands
```bash
# Rebuild after code changes
sudo docker-compose up -d --build

# Check Docker status
sudo docker-compose ps
```

### Pull Latest Changes
```bash
# In terminal
git pull origin main
sudo docker-compose up -d --build
```

---

## Recommended Extensions (Install in Remote)

When connected, install these on the server:

1. **Docker** (Microsoft) - Manage containers from VS Code
2. **REST Client** - Test API endpoints
3. **Thunder Client** - Alternative API testing
4. **GitLens** - Git history and blame
5. **ES7+ React/Redux** - React snippets

To install:
- Ctrl+Shift+X → Search → Install (it installs on remote)

---

## Pro Tips

### Keyboard Shortcuts
- `Ctrl+Shift+P` - Command palette
- `Ctrl+K Ctrl+O` - Open folder
- `Ctrl+`` - Toggle terminal
- `Ctrl+P` - Quick file open
- `Ctrl+Shift+X` - Extensions

### Fast Navigation
```
File tree: Ctrl+Shift+E
Search: Ctrl+Shift+F
Source Control: Ctrl+Shift+G
Debug: Ctrl+Shift+D
```

### Debug Backend API
```javascript
// Add breakpoints in server.js
// Press F5 to start debugging
// Hits breakpoint when API is called
```

---

## Troubleshooting

### "Connection refused"

**Check server is reachable:**
```powershell
ping YOUR_SERVER_IP
```

**Check SSH service on server:**
```bash
ssh root@YOUR_SERVER_IP
sudo systemctl status ssh
sudo systemctl restart ssh
exit
```

### "Permission denied"

**Verify public key is on server:**
```bash
ssh root@YOUR_SERVER_IP
cat ~/.ssh/authorized_keys
```

**Fix permissions if needed:**
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### "Cannot find SSH config"

**Create it manually:**
```powershell
New-Item -Path "$env:USERPROFILE\.ssh\config" -ItemType File -Force
```

Then add the configuration from Step 4.

### "Extension not installing"

**Try reloading window:**
- Ctrl+Shift+P → "Remote-SSH: Reload Window"

### Connection keeps dropping

**Keep connection alive:**

Edit `.ssh/config`:

```ssh
Host hostinger
    HostName YOUR_SERVER_IP
    User root
    IdentityFile ~/.ssh/hostinger_key
    StrictHostKeyChecking no
    AddKeysToAgent yes
    ServerAliveInterval 60
    ServerAliveCountMax 10
```

---

## Disconnect / Reconnect

### Close connection
- Click "SSH: hostinger" (bottom-left)
- Click "Close Remote Connection"

### Reconnect
- Click Remote icon
- Select "hostinger"

---

## First Time Checklist

- [ ] SSH keys generated
- [ ] Public key added to Hostinger
- [ ] Remote-SSH extension installed
- [ ] SSH config file created
- [ ] Connected to "hostinger"
- [ ] Project folder opened
- [ ] Terminal working (Ctrl+`)
- [ ] Can run `sudo docker-compose ps`

---

## Security Notes

⚠️ **IMPORTANT:**
- ✅ Keep `hostinger_key` file private (never share)
- ✅ Use strong passphrase for SSH key
- ✅ Don't commit keys to Git
- ✅ Use SSH keys instead of passwords
- ✅ Disable password login on server:

```bash
# On server
sudo nano /etc/ssh/sshd_config

# Find: #PasswordAuthentication yes
# Change to: PasswordAuthentication no

# Restart
sudo systemctl restart ssh
```

---

## Next Steps

1. ✅ Edit files directly on server
2. ✅ View logs in real-time
3. ✅ Run Docker commands
4. ✅ Test API calls
5. ✅ Deploy without git push!

---

## Getting Help

**VS Code Remote SSH Docs:**
- https://code.visualstudio.com/docs/remote/ssh

**SSH Troubleshooting:**
- Check logs: `ssh -v root@YOUR_SERVER_IP`
- Verify key permissions: `ls -la ~/.ssh/`

