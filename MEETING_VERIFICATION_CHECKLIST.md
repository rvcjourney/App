# 🔍 MEETING START VERIFICATION CHECKLIST

## ✅ Pre-Meeting Checklist

### 1. Environment Variables Check
```bash
# App root directory
cat .env
# Should contain:
# REACT_APP_AUTH_URL = "http://localhost:3000"
```

### 2. Backend Credentials
```bash
# Backend directory
cat backend/.env
# Should contain:
# VIDEOSDK_API_KEY=xxxxx
# VIDEOSDK_SECRET_KEY=xxxxx
# PORT=3000
```

### 3. Backend Server Status
```bash
# In a new terminal, check if server is running
curl -i http://localhost:3000/health
# Expected response:
# HTTP/1.1 200 OK
# {"status":"ok","timestamp":"2026-01-25T..."}
```

### 4. Token Generation Test
```bash
# Test token endpoint
curl -i http://localhost:3000/get-token
# Expected response:
# HTTP/1.1 200 OK
# {"token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."}
```

### 5. App Console Logs
When you try to start a meeting, check console for:
```
✅ [Join] Starting meeting creation process...
✅ [Join] Getting token...
✅ [Join] Token received
✅ [Join] Creating meeting with VideoSDK...
✅ [Join] Meeting created: abc123...
✅ [Join] Navigation complete
```

---

## 🐛 If You See These Errors

### "ECONNREFUSED"
- **Cause:** Backend server not running
- **Fix:** Run `npm start` in `/backend` folder

### "Missing token in response"
- **Cause:** Backend credentials are wrong
- **Fix:** Check `backend/.env` has correct VIDEOSDK_API_KEY and VIDEOSDK_SECRET_KEY

### "roomId is undefined"
- **Cause:** Token is invalid or VideoSDK API call failed
- **Fix:** 
  1. Verify backend is returning valid token
  2. Check VideoSDK credentials are correct
  3. Check your VideoSDK account is active

### "Multiple 'Join component mounted' logs"
- **Cause:** Navigation keeps retrying due to token fetch errors
- **Fix:** Once backend is working, logs will stabilize to single mount

---

## 🚀 Working Flow

```
Teacher Clicks "Start Meeting"
         ↓
App checks permissions (Android/iOS)
         ↓
App calls: GET http://localhost:3000/get-token
         ↓
Backend verifies VIDEOSDK credentials in .env
         ↓
Backend creates JWT token
         ↓
Backend returns token to app
         ↓
App receives token ✅
         ↓
App calls VideoSDK API with token
         ↓
VideoSDK creates meeting room
         ↓
App receives meeting ID ✅
         ↓
App navigates to Meeting screen
         ↓
Meeting starts! 🎉
```

---

## 📋 Required Credentials

You need THREE things for meetings to work:

1. **VideoSDK API Key** (in `backend/.env`)
   - From: https://app.videosdk.live/settings
   - Example: `VIDEOSDK_API_KEY=abc123xyz`

2. **VideoSDK Secret Key** (in `backend/.env`)
   - From: https://app.videosdk.live/settings
   - Example: `VIDEOSDK_SECRET_KEY=secret456xyz`

3. **Auth URL** (in app `/.env`)
   - Should point to your backend
   - Example: `REACT_APP_AUTH_URL = "http://localhost:3000"`

---

## 🎯 Quick Start Command

```bash
# Terminal 1: Start backend
cd backend
npm install
npm start

# Terminal 2: Start app
npm start
# then press 'a' for Android or 'i' for iOS
```

---

## ✨ Once It Works

You should see:
- ✅ Teacher dashboard loads
- ✅ "Start a meeting" button is clickable
- ✅ Console shows token generation logs
- ✅ Meeting screen appears with video preview
- ✅ Meeting starts successfully

**If any step fails, check the error logs for that specific step above.**
