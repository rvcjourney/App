# ⚡ Quick Start - Dynamic Token Generation

## 5-Minute Setup

### Step 1: Get Your Credentials (2 minutes)

1. Go to https://app.videosdk.live/settings
2. Find **API Keys** section
3. Copy your **API Key** and **Secret Key**

### Step 2: Configure Backend (2 minutes)

1. Open `backend/.env`
2. Replace:
   ```bash
   VIDEOSDK_API_KEY=your_api_key_here
   VIDEOSDK_SECRET_KEY=your_secret_key_here
   ```

3. With your actual credentials:
   ```bash
   VIDEOSDK_API_KEY=e1d072cc-7342-46d8-8c5c-3cb91692d189
   VIDEOSDK_SECRET_KEY=sk_live_abc123xyz789...
   ```

### Step 3: Start Backend (1 minute)

```bash
cd backend
npm install        # Only first time
npm start          # Starts token server
```

You should see:
```
🚀 VideoSDK Token Server Started
📍 Server running at: http://localhost:3000
```

### Done! ✅

Your React Native app will now:
- ✅ Request fresh tokens automatically
- ✅ Never worry about token expiration
- ✅ Support unlimited concurrent meetings
- ✅ Keep API credentials secure

---

## Testing

### Test 1: Backend Health
```bash
curl http://localhost:3000/health
```

### Test 2: Get Token
```bash
curl http://localhost:3000/get-token
```

### Test 3: Create Meeting in App
1. Start the React Native app
2. Click "Join/Create Meeting"
3. App automatically gets token from backend ✅

---

## Production Deployment

### Quick Deploy to Heroku (Free)

```bash
# 1. Create Heroku account at heroku.com
# 2. Install Heroku CLI
# 3. Log in
heroku login

# 4. Create app
cd backend
heroku create your-app-name

# 5. Set environment variables
heroku config:set VIDEOSDK_API_KEY=your_key
heroku config:set VIDEOSDK_SECRET_KEY=your_secret

# 6. Deploy
git push heroku main

# 7. Update React Native app .env
REACT_APP_AUTH_URL = "https://your-app-name.herokuapp.com"
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module" | Run `npm install` in backend folder |
| "Missing API Key" | Check `backend/.env` has correct values |
| "Port 3000 already in use" | Change PORT in `.env` to 3001 |
| "Connection refused" | Make sure backend server is running |

---

## Documentation

- Full setup guide: `backend/SETUP_GUIDE.md`
- Codebase docs: `CODEBASE_DOCUMENTATION.md`
- VideoSDK docs: https://docs.videosdk.live

---

**That's it! Your token system is now dynamic and production-ready.** 🚀
