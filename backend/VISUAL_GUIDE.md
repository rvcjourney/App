# 🎨 Visual Implementation Guide - Dynamic Token System

## System Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          YOUR INFRASTRUCTURE                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  React Native App                           │   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────┐      │   │
│  │  │ .env Configuration                               │      │   │
│  │  │ REACT_APP_AUTH_URL="http://localhost:3000"       │      │   │
│  │  └──────────────────────────────────────────────────┘      │   │
│  │              ↓                                             │   │
│  │  ┌──────────────────────────────────────────────────┐      │   │
│  │  │ Join Screen                                      │      │   │
│  │  │ User clicks: "Create Meeting"                    │      │   │
│  │  └──────────────────────────────────────────────────┘      │   │
│  │              ↓                                             │   │
│  │  ┌──────────────────────────────────────────────────┐      │   │
│  │  │ api.getToken()                                   │      │   │
│  │  │ fetch(REACT_APP_AUTH_URL + "/get-token")         │      │   │
│  │  └──────────────────────────────────────────────────┘      │   │
│  │              ↓ HTTP GET Request                           │   │
│  └──────────────┼───────────────────────────────────────────┘   │
│                 │ http://localhost:3000/get-token              │
│                 ↓                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Backend Token Server                        │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ .env Configuration                              │    │   │
│  │  │ VIDEOSDK_API_KEY=your_api_key                   │    │   │
│  │  │ VIDEOSDK_SECRET_KEY=your_secret_key             │    │   │
│  │  │ PORT=3000                                       │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │              ↓                                            │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ server.js - Token Generation Logic              │    │   │
│  │  │                                                 │    │   │
│  │  │ generateVideoSDKToken() {                       │    │   │
│  │  │   payload = {                                   │    │   │
│  │  │     apikey: VIDEOSDK_API_KEY,                   │    │   │
│  │  │     permissions: [                              │    │   │
│  │  │       "allow_join",                             │    │   │
│  │  │       "allow_mod"                               │    │   │
│  │  │     ],                                          │    │   │
│  │  │     iat: timestamp,                             │    │   │
│  │  │     exp: timestamp + 24h                        │    │   │
│  │  │   }                                             │    │   │
│  │  │                                                 │    │   │
│  │  │   token = jwt.sign(                             │    │   │
│  │  │     payload,                                    │    │   │
│  │  │     VIDEOSDK_SECRET_KEY,                        │    │   │
│  │  │     { algorithm: 'HS256' }                      │    │   │
│  │  │   )                                             │    │   │
│  │  │                                                 │    │   │
│  │  │   return token                                  │    │   │
│  │  │ }                                               │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │              ↓                                            │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ HTTP Response                                   │    │   │
│  │  │ {                                               │    │   │
│  │  │   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",    │    │   │
│  │  │   "expiresIn": "24h",                           │    │   │
│  │  │   "timestamp": "2026-01-25T10:30:00.000Z"       │    │   │
│  │  │ }                                               │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └───────────┬────────────────────────────────────────────┘   │
│              ↓ Token Returned                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Native App (continued)               │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────┐    │   │
│  │  │ createMeeting({ token })                       │    │   │
│  │  │ POST /v2/rooms with JWT token                  │    │   │
│  │  └────────────────────────────────────────────────┘    │   │
│  │              ↓                                           │   │
│  │  ┌────────────────────────────────────────────────┐    │   │
│  │  │ Navigate to Meeting Screen                     │    │   │
│  │  │ Pass: token, meetingId, name, ...              │    │   │
│  │  └────────────────────────────────────────────────┘    │   │
│  │              ↓                                           │   │
│  │  ┌────────────────────────────────────────────────┐    │   │
│  │  │ Meeting Container                              │    │   │
│  │  │ useMeeting() hook joins meeting                │    │   │
│  │  └────────────────────────────────────────────────┘    │   │
│  │              ↓                                           │   │
│  │  ┌────────────────────────────────────────────────┐    │   │
│  │  │ Render Meeting View                            │    │   │
│  │  │ ✅ Local video feed                            │    │   │
│  │  │ ✅ Control buttons                             │    │   │
│  │  │ ✅ Remote participant video                    │    │   │
│  │  └────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                           ↓ (Uses Token)
┌──────────────────────────────────────────────────────────────────┐
│                  VideoSDK Live Infrastructure                    │
│                  (Video/Audio Streaming)                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Sequential Flow Chart

```
Timeline: User Creates a Meeting

1. APP STARTUP
   ┌─────────────────────────────────┐
   │ App Loads                       │
   │ .env: REACT_APP_AUTH_URL=...   │
   │ Ready for token requests        │
   └─────────────────────────────────┘
   
2. USER ACTION
   ┌─────────────────────────────────┐
   │ User clicks "Create Meeting"    │
   └─────────────────────────────────┘
                    ↓
   
3. PERMISSION CHECK
   ┌─────────────────────────────────┐
   │ Request camera permission       │
   │ Request microphone permission   │
   │ User grants permissions         │
   └─────────────────────────────────┘
                    ↓
   
4. TOKEN REQUEST
   ┌─────────────────────────────────┐
   │ App: getToken()                 │
   │ ↓                               │
   │ fetch("http://localhost:3000    │
   │   /get-token")                  │
   │ ↓                               │
   │ HTTP GET sent                   │
   └─────────────────────────────────┘
                    ↓ [Network]
   
5. BACKEND PROCESSING
   ┌─────────────────────────────────┐
   │ Backend: Receives request       │
   │ ↓                               │
   │ Load VIDEOSDK_API_KEY           │
   │ Load VIDEOSDK_SECRET_KEY        │
   │ ↓                               │
   │ Create JWT payload              │
   │ Sign with secret                │
   │ ↓                               │
   │ Token: eyJhbGc... (24h valid)   │
   └─────────────────────────────────┘
                    ↓ [Network]
   
6. TOKEN RECEIVED
   ┌─────────────────────────────────┐
   │ App receives token              │
   │ Token ready: eyJhbGc...         │
   │ Valid for 24 hours              │
   └─────────────────────────────────┘
                    ↓
   
7. CREATE MEETING
   ┌─────────────────────────────────┐
   │ app.createMeeting({             │
   │   token: "eyJhbGc...",          │
   │   name: "User Name"             │
   │ })                              │
   │ ↓                               │
   │ POST /v2/rooms with token       │
   │ ↓                               │
   │ VideoSDK validates token        │
   │ Creates meeting room            │
   │ Returns meetingId               │
   └─────────────────────────────────┘
                    ↓
   
8. NAVIGATE TO MEETING
   ┌─────────────────────────────────┐
   │ navigation.navigate(             │
   │   SCREEN_NAMES.Meeting,         │
   │   {                             │
   │     token: "eyJhbGc...",        │
   │     meetingId: "xxxxxx",        │
   │     name: "User Name",          │
   │     meetingType: "GROUP"        │
   │   }                             │
   │ )                               │
   │ ↓                               │
   │ Meeting screen mounted          │
   └─────────────────────────────────┘
                    ↓
   
9. MEETING SETUP
   ┌─────────────────────────────────┐
   │ Request Android permissions     │
   │ Create video track              │
   │ Initialize audio devices        │
   │ Setup WebRTC connection         │
   └─────────────────────────────────┘
                    ↓
   
10. JOIN MEETING
    ┌─────────────────────────────────┐
    │ MeetingContainer.join()         │
    │ useMeeting() hook               │
    │ ↓                               │
    │ Connect to VideoSDK             │
    │ Send token & meetingId          │
    │ ↓                               │
    │ VideoSDK validates              │
    │ Establishes connection          │
    │ Routes audio/video              │
    └─────────────────────────────────┘
                    ↓
    
11. MEETING ACTIVE
    ┌─────────────────────────────────┐
    │ ✅ Local video displayed        │
    │ ✅ Audio working                │
    │ ✅ Ready for participants       │
    │ ✅ Can share screen             │
    │ ✅ Can record meeting           │
    └─────────────────────────────────┘
```

---

## Comparison: Old vs New

### Old System (Static Token)

```
┌────────────────────────────────────┐
│        App Source Code             │
│                                    │
│ .env:                              │
│ REACT_APP_VIDEOSDK_TOKEN =         │
│   "eyJhbGc..."                     │
│                                    │
│ (Token hardcoded, visible)         │
└────────────────────────────────────┘
           ↓
┌────────────────────────────────────┐
│      Use Token for Meeting         │
│                                    │
│ createMeeting({ token })           │
│ validateMeeting({ token })         │
│ fetchSession({ token })            │
└────────────────────────────────────┘
           ↓
        [Works]
           ↓ (24-48 hours pass)
        [Token Expires]
           ↓
    ❌ App Broken ❌

Problems:
❌ Token visible in code
❌ API key exposed
❌ Expires over time
❌ Manual renewal needed
❌ Same token for all
❌ Not production ready
```

### New System (Dynamic Token)

```
┌────────────────────────────────────┐
│        App Source Code             │
│                                    │
│ .env:                              │
│ REACT_APP_AUTH_URL =               │
│   "http://localhost:3000"          │
│                                    │
│ (Only backend URL, no secrets)     │
└────────────────────────────────────┘
           ↓
┌────────────────────────────────────┐
│    Request Fresh Token             │
│                                    │
│ getToken()                         │
│ fetch(REACT_APP_AUTH_URL +         │
│   "/get-token")                    │
│ ↓                                  │
│ Receive: eyJhbGc... (new token)    │
└────────────────────────────────────┘
           ↓
┌────────────────────────────────────┐
│      Use Fresh Token               │
│                                    │
│ createMeeting({ token })           │
│ validateMeeting({ token })         │
│ fetchSession({ token })            │
└────────────────────────────────────┘
           ↓
        [Works]
           ↓ (24 hours pass)
    [Token Still Valid]
           ↓
        [Still Works]
           ↓ (Meeting ends)
    [Request New Token]
           ↓
    [Fresh Token Ready]
           ↓
✅ Works Forever ✅

Benefits:
✅ No secrets in code
✅ API key protected
✅ Never expires (renewed per meeting)
✅ Fully automated
✅ Unique per meeting
✅ Production ready
```

---

## Deployment Architecture

### Development (Local)

```
Your Computer
├── React Native App
│   └── .env: REACT_APP_AUTH_URL = "http://localhost:3000"
│
└── Backend Server
    ├── server.js
    ├── .env: VIDEOSDK_API_KEY, VIDEOSDK_SECRET_KEY
    └── Running on localhost:3000
```

### Production (Cloud)

```
                           Internet
                             ↓
                    ┌────────────────┐
                    │  Your Domain   │
                    │  example.com   │
                    └────────────────┘
                             ↓
        ┌────────────────────┴────────────────────┐
        ↓                                         ↓
┌──────────────────┐              ┌──────────────────────────┐
│ App Store        │              │  Backend API Server      │
│ (Deployed App)   │              │  (AWS/Heroku/etc)        │
│                  │              │                          │
│ REACT_APP_       │──────────→   │ /get-token               │
│ AUTH_URL=        │              │ /health                  │
│ "https://api.    │              │ /validate-token          │
│ example.com"     │              │                          │
│                  │              │ .env (secure):           │
│                  │              │ - API_KEY                │
└──────────────────┘              │ - SECRET_KEY             │
                                  │ - PORT                   │
                                  └──────────────────────────┘
```

---

## File Organization

```
Project Root
│
├── CODEBASE_DOCUMENTATION.md
│   └─ Complete codebase explanation
│
├── DYNAMIC_TOKEN_SETUP.md
│   └─ This solution overview
│
├── .env (Modified)
│   └─ REACT_APP_AUTH_URL = "http://localhost:3000"
│
├── src/
│   ├── api/api.js (Unchanged)
│   │   └─ Uses REACT_APP_AUTH_URL automatically
│   │
│   └── scenes/join/index.js (Unchanged)
│       └─ Calls api.getToken() automatically
│
└── backend/ (NEW)
    ├── server.js ⭐
    │   └─ Token generation logic
    │
    ├── package.json ⭐
    │   └─ npm install this
    │
    ├── .env ⭐ (CREATE THIS)
    │   ├─ VIDEOSDK_API_KEY=your_key
    │   └─ VIDEOSDK_SECRET_KEY=your_secret
    │
    ├── .env.example
    │   └─ Template (copy to .env)
    │
    ├── .gitignore
    │   └─ Prevent committing secrets
    │
    └── Documentation/
        ├── README.md
        ├── QUICKSTART.md
        ├── SETUP_GUIDE.md
        ├── ARCHITECTURE.md
        └── OVERVIEW.md
```

---

## Setup Checklist

```
Phase 1: Preparation
☐ Go to VideoSDK Dashboard
☐ Copy API Key
☐ Copy Secret Key
☐ Save somewhere secure

Phase 2: Backend Setup
☐ Open backend/.env
☐ Paste API_KEY
☐ Paste SECRET_KEY
☐ Save file

Phase 3: Installation
☐ cd backend
☐ npm install (takes 1-2 minutes)
☐ Check node_modules created

Phase 4: Testing
☐ npm start
☐ See "🚀 VideoSDK Token Server Started"
☐ See "📍 Server running at: http://localhost:3000"
☐ curl http://localhost:3000/health (works?)
☐ curl http://localhost:3000/get-token (works?)

Phase 5: App Integration
☐ Check app's .env has REACT_APP_AUTH_URL set
☐ Rebuild React Native app
☐ Test creating meeting
☐ Observe automatic token request
☐ Meeting created successfully ✅

Phase 6: Production Ready
☐ Deploy backend to cloud
☐ Update REACT_APP_AUTH_URL in app
☐ Rebuild and publish app
☐ Test in production
☐ Monitor logs
☐ Setup alerts
```

---

## Success Indicators

### ✅ You're Done When:

1. Backend server starts without errors
```
🚀 VideoSDK Token Server Started
📍 Server running at: http://localhost:3000
```

2. Health check works
```
curl http://localhost:3000/health
→ { "status": "ok", ... }
```

3. Token generation works
```
curl http://localhost:3000/get-token
→ { "token": "eyJhbGc...", ... }
```

4. App can create meetings
```
Click "Create Meeting" in app
→ App gets token automatically
→ Meeting created successfully
→ Video works!
```

5. Multiple meetings work
```
Create meeting 1 → Works ✅
Create meeting 2 → Works ✅
Create meeting 3 → Works ✅
No conflicts or errors ✅
```

---

**This visual guide completes your dynamic token implementation! 🎉**

For detailed information, refer to the documentation files in the `backend/` folder.
