# 🎯 Meeting Start Flow - Visual Guide

## Current Problem Flow (Before Fix)

```
Teacher Click "Start Meeting"
    ↓
Join Component Mounts ❌
    ↓
getToken() called
    ↓
[SILENT FAILURE - No Error Thrown] ❌❌❌
    ↓
token = undefined ⚠️
    ↓
createMeeting({ token: undefined })
    ↓
[CRASHES SILENTLY] 💥
    ↓
Navigation stuck... retrying...
    ↓
Join Component Mounts Again ❌
    ↓
[INFINITE LOOP] 🔄🔄🔄
```

**Result:** Multiple "Join component mounted" logs + no meeting starts

---

## Fixed Problem Flow (After Fix)

```
Teacher Click "Start Meeting"
    ↓
Join Component Mounts ✅
    ↓
Try Block: "Start meeting creation..."
    ↓
getToken() called
    ├─ Fetch from: http://localhost:3000/get-token
    ├─ ✅ Backend responds with token
    └─ ✅ Token logged and returned
    ↓
Check: if (!token) → Continue ✅
    ↓
createMeeting({ token })
    ├─ Send token to VideoSDK API
    ├─ ✅ VideoSDK creates meeting room
    └─ ✅ Returns meeting ID
    ↓
Check: if (!meetingId) → Continue ✅
    ↓
Dispose video track & Navigate to Meeting Screen
    ↓
✅ Meeting Starts Successfully! 🎉
```

**Result:** Single mount + successful meeting start + clear console logs

---

## Backend Server - Critical Component

```
┌─────────────────────────────────────────┐
│     Your React Native App               │
│  (StudentDashboard / TeacherDashboard)  │
└──────────────┬──────────────────────────┘
               │
               │ HTTP GET /get-token
               │
               ↓
┌─────────────────────────────────────────┐
│   Backend Server (localhost:3000)       │
│                                          │
│  ├─ Reads VIDEOSDK_API_KEY from .env   │
│  ├─ Reads VIDEOSDK_SECRET_KEY from .env│
│  └─ Creates JWT Token                   │
│                                          │
└──────────────┬──────────────────────────┘
               │
               │ Returns: {"token": "eyJ..."}
               │
               ↓
┌─────────────────────────────────────────┐
│   App Receives Token                    │
│   ✅ Token is fresh & valid             │
└──────────────┬──────────────────────────┘
               │
               │ POST /rooms with token
               │
               ↓
┌─────────────────────────────────────────┐
│   VideoSDK API (api.videosdk.live)      │
│   (Uses token for authentication)       │
│   ✅ Creates meeting room               │
│   ✅ Returns meeting ID                 │
└─────────────────────────────────────────┘
```

**KEY POINT:** Backend server MUST be running for token generation!

---

## Error Detection Levels

### Level 1: Environment Variables
```
❌ REACT_APP_AUTH_URL not set
   → Console: "Please add a token or Auth Server URL"
   → User sees: "Error: Authentication not configured"
```

### Level 2: Backend Server Connection
```
❌ Backend not running on http://localhost:3000
   → Console: "ECONNREFUSED - Connection refused"
   → User sees: "Error: Connection refused"
   → Fix: Run `npm start` in /backend folder
```

### Level 3: Backend Credentials
```
❌ VIDEOSDK_API_KEY or VIDEOSDK_SECRET_KEY missing in backend/.env
   → Backend terminates immediately
   → Console: "Missing VIDEOSDK_API_KEY or VIDEOSDK_SECRET_KEY"
   → Fix: Add credentials to backend/.env
```

### Level 4: Invalid Credentials
```
❌ VIDEOSDK_API_KEY or VIDEOSDK_SECRET_KEY is wrong
   → Console: "HTTP Error 401: Unauthorized"
   → User sees: "Error: Invalid VideoSDK credentials"
   → Fix: Check credentials at https://app.videosdk.live/settings
```

### Level 5: VideoSDK API Error
```
❌ VideoSDK API returns error
   → Console: Shows specific VideoSDK error message
   → User sees: User-friendly error toast
   → Fix: Check VideoSDK account status and quota
```

---

## Checklist: Is Your Setup Complete?

```
BACKEND SETUP
├─ [ ] backend/package.json exists
├─ [ ] backend/.env created with:
│   ├─ [ ] VIDEOSDK_API_KEY=xxx
│   ├─ [ ] VIDEOSDK_SECRET_KEY=xxx
│   └─ [ ] PORT=3000
├─ [ ] npm install run in backend/
├─ [ ] npm start executed (shows "Server running on port 3000")
└─ [ ] curl http://localhost:3000/health returns OK

APP SETUP
├─ [ ] .env has REACT_APP_AUTH_URL = "http://localhost:3000"
├─ [ ] npm install completed
├─ [ ] App can connect to backend (no ECONNREFUSED errors)
└─ [ ] Login as Teacher succeeds

MEETING START
├─ [ ] Teacher Dashboard loads
├─ [ ] Click "Create a meeting" shows form
├─ [ ] Enter name and click "Start a meeting"
├─ [ ] Console shows ✅ symbols (token, meeting created, etc.)
└─ [ ] Meeting screen appears with video preview
```

---

## Quick Debug Steps

**If meeting doesn't start, follow this order:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```
   Expected: `{"status":"ok"}`

2. **Check token endpoint:**
   ```bash
   curl http://localhost:3000/get-token
   ```
   Expected: `{"token":"eyJ..."}`

3. **Check app console logs:**
   Look for 🔴 (red errors) or ❌ symbols

4. **Check backend console:**
   Look for error messages about credentials

5. **Verify credentials:**
   ```bash
   cat backend/.env | grep VIDEOSDK
   ```
   Should show non-empty API_KEY and SECRET_KEY

6. **Try meeting again:**
   Clear app cache → restart app → try meeting

---

## Success Indicators 🟢

You know it's working when:

```
✅ Backend starts without errors
✅ curl /get-token returns a token
✅ Join component mounts ONCE (not 4 times)
✅ Console shows: "✅ Token received from backend"
✅ Console shows: "✅ Meeting created successfully"
✅ Meeting screen appears with your video preview
✅ You can speak and see yourself on camera
```

---

## Still Having Issues?

1. **Check MEETING_START_TROUBLESHOOTING.md** - Detailed error scenarios
2. **Check MEETING_VERIFICATION_CHECKLIST.md** - Step-by-step verification
3. **Review console logs** - Look for 🔴 or ❌ symbols
4. **Verify all 3 files exist:**
   - backend/.env (with credentials)
   - .env (with REACT_APP_AUTH_URL)
   - backend/server.js (running)
