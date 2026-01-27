# ⚠️ Meeting Start Troubleshooting Guide

## Issue
When trying to start a meeting as a teacher, the Join screen mounts multiple times but the meeting doesn't start.

## Root Cause
The backend token server is **NOT RUNNING**. The app needs this server to generate fresh tokens for each meeting.

---

## 🔴 Quick Diagnostic Checklist

- [ ] Backend server is running (`npm start` in `/backend` folder)
- [ ] Backend server responds on `http://localhost:3000`
- [ ] `.env` file has `REACT_APP_AUTH_URL = "http://localhost:3000"`
- [ ] Backend `.env` has `VIDEOSDK_API_KEY` and `VIDEOSDK_SECRET_KEY` set
- [ ] No console errors about token generation

---

## 🟢 Solution: Start the Backend Server

### Step 1: Prepare Backend
```bash
cd backend
npm install
```

### Step 2: Create Backend .env
Create `backend/.env` with your VideoSDK credentials:
```env
VIDEOSDK_API_KEY=your_api_key_from_dashboard
VIDEOSDK_SECRET_KEY=your_secret_key_from_dashboard
PORT=3000
```

**Get these from:** https://app.videosdk.live/settings

### Step 3: Start the Server
```bash
npm start
```

You should see:
```
✅ VideoSDK Configuration loaded successfully
📌 API Key: abc123...
Server running on http://localhost:3000
```

### Step 4: Verify Server is Running
Open terminal and test:
```bash
curl http://localhost:3000/health
```

You should see:
```json
{"status":"ok","timestamp":"..."}
```

### Step 5: Now Start Your App
Run your React Native app:
```bash
npm start
# or
npm run android
npm run ios
```

---

## 🔍 What Happens When Token Generation Works

1. **Teacher clicks "Start a meeting"**
2. **App calls:** `GET http://localhost:3000/get-token`
3. **Backend returns fresh JWT token**
4. **App receives token and creates meeting**
5. **Meeting starts successfully** ✅

---

## 🐛 Common Errors & Fixes

### Error: "ECONNREFUSED - Connection refused"
**Problem:** Backend server isn't running or wrong URL  
**Fix:**
```bash
# Start the backend
cd backend
npm start

# If using mobile emulator, use your PC IP instead:
# REACT_APP_AUTH_URL = "http://192.168.1.100:3000"
```

### Error: "Missing VIDEOSDK_API_KEY"
**Problem:** Backend `.env` not configured  
**Fix:**
```bash
cd backend
# Create .env with your VideoSDK credentials
echo VIDEOSDK_API_KEY=your_key > .env
echo VIDEOSDK_SECRET_KEY=your_secret >> .env
echo PORT=3000 >> .env
```

### Error: "getToken returned undefined"
**Problem:** Neither static token nor auth URL configured  
**Fix:**
```bash
# Check your app's .env
cat .env | grep REACT_APP_AUTH_URL

# Should show:
# REACT_APP_AUTH_URL = "http://localhost:3000"
```

### Multiple "Join component mounted" logs
**Problem:** Navigation is remounting component due to token fetch failures  
**Fix:** Once backend is running and token generation works, component will stabilize

---

## 📱 For Mobile Emulator/Device Testing

### Android Emulator
Use your PC's IP (not localhost):
```env
REACT_APP_AUTH_URL = "http://10.0.2.2:3000"  # Special Android emulator IP
```

### iOS Simulator
```env
REACT_APP_AUTH_URL = "http://localhost:3000"  # Works directly
```

### Physical Device
```env
REACT_APP_AUTH_URL = "http://YOUR_PC_IP:3000"
# Example: REACT_APP_AUTH_URL = "http://192.168.1.50:3000"
```

---

## ✅ Verification Steps

1. **Backend running:**
   ```bash
   curl -v http://localhost:3000/health
   ```
   Should return `{"status":"ok"}`

2. **Token generation working:**
   ```bash
   curl -v http://localhost:3000/get-token
   ```
   Should return `{"token":"eyJ..."}`

3. **App logs show token:**
   ```
   Join component mounted
   Getting token... ✅
   Token received: eyJ...
   Meeting ID: abc123...
   ```

---

## 📞 Support

If still having issues:

1. Check console logs for specific error messages
2. Verify `.env` files in both app root and `/backend`
3. Ensure network connectivity between app and backend
4. Check VideoSDK dashboard for API key validity
5. Try restarting both backend server and app

---

## 🎯 Summary

| Component | Status | What to Check |
|-----------|--------|---------------|
| Backend Server | ❌ NOT RUNNING | `npm start` in `/backend` |
| Token Generation | ❌ FAILED | Check backend `.env` credentials |
| Meeting Creation | ❌ BLOCKED | Waiting for valid token |
| App Stacks | ✅ WORKING | RootNavigator routing correctly |
| Join Component | ⚠️ RE-MOUNTING | Due to token generation failures |
