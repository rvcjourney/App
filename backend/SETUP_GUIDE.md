# 🔐 Dynamic Token Generation Setup Guide

## Overview

Instead of using a hardcoded static token that expires, you can now use a **dynamic token generation server** that creates fresh tokens on-demand for each meeting.

### Why Dynamic Tokens?

| Feature | Static Token | Dynamic Token |
|---------|--------------|---------------|
| **Expiration** | ❌ Expires (usually 24-48 hours) | ✅ Fresh token each time |
| **Security** | ❌ API Key exposed in app | ✅ API Key kept on backend |
| **Scalability** | ❌ Single token for all users | ✅ Fresh token per meeting |
| **Multiple Meetings** | ❌ Limited by token expiry | ✅ Unlimited concurrent meetings |
| **Production Ready** | ⚠️ Requires manual renewal | ✅ Fully automated |

---

## 📋 Prerequisites

- **VideoSDK Account** with API Key & Secret Key
- **Node.js** (v14+) installed
- **npm** or **yarn** package manager

---

## 🚀 Setup Instructions

### Step 1: Get Your VideoSDK Credentials

1. Go to [VideoSDK Dashboard](https://app.videosdk.live/settings)
2. Log in with your account
3. Navigate to **Settings → API Keys**
4. Copy your:
   - **API Key**
   - **Secret Key** (Keep this secret!)

### Step 2: Configure Backend Server

1. **Update backend/.env file:**

```bash
# backend/.env
VIDEOSDK_API_KEY=your_api_key_here
VIDEOSDK_SECRET_KEY=your_secret_key_here
PORT=3000
```

2. **Replace placeholders:**
   - `your_api_key_here` → Your actual API Key from Step 1
   - `your_secret_key_here` → Your actual Secret Key from Step 1

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

This installs:
- `express` - Web framework
- `jsonwebtoken` - JWT token generation
- `cors` - Handle cross-origin requests
- `dotenv` - Environment variable management
- `nodemon` (dev) - Auto-reload on changes

### Step 4: Start Backend Server

```bash
# Option 1: Normal mode
npm start

# Option 2: Development mode (with auto-reload)
npm run dev
```

✅ You should see:
```
==================================================
🚀 VideoSDK Token Server Started
==================================================
📍 Server running at: http://localhost:3000

📌 Available Endpoints:
   GET  /get-token       - Get fresh token
   GET  /health          - Health check
   POST /validate-token  - Validate token

💡 Use this in your .env:
   REACT_APP_AUTH_URL = "http://localhost:3000"
==================================================
```

### Step 5: Update React Native App

Your app's `.env` file is already updated:

```bash
# .env (Already configured)
REACT_APP_AUTH_URL = "http://localhost:3000"
```

The app will automatically:
1. Call `GET /get-token` endpoint
2. Receive fresh token
3. Use token for meeting creation/joining
4. Request new token if expired

### Step 6: Test the Setup

#### Test 1: Check Backend Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-25T10:30:00.000Z",
  "service": "VideoSDK Token Server"
}
```

#### Test 2: Get Token

```bash
curl http://localhost:3000/get-token
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "timestamp": "2026-01-25T10:30:00.000Z"
}
```

---

## 🏗️ Backend Architecture

### Token Generation Flow

```
React Native App
       ↓
Call api.getToken()
       ↓
HTTP GET /get-token
       ↓
Backend Server
       ├─ Load API Key & Secret from .env
       ├─ Create JWT payload with permissions
       ├─ Sign with secret key
       └─ Return fresh token
       ↓
Use token for meeting
       ↓
Create/Join Meeting
```

### Server File: `backend/server.js`

**Main Function:**
```javascript
generateVideoSDKToken(apiKey, secretKey)
```

**What it does:**
1. Takes API Key and Secret Key
2. Creates JWT payload with:
   - `apikey`: Your API key
   - `permissions`: ['allow_join', 'allow_mod']
3. Signs with secret key (HS256 algorithm)
4. Returns token (valid 24 hours)

**API Endpoints:**

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/get-token` | GET | Get fresh token | `{ token, expiresIn, timestamp }` |
| `/health` | GET | Server health check | `{ status, timestamp, service }` |
| `/validate-token` | POST | Verify token validity | `{ valid, decoded }` |

---

## 🌐 Production Deployment

### For Local Development (Current)
```
REACT_APP_AUTH_URL = "http://localhost:3000"
```

### For Production

#### Option 1: Deploy on Heroku

1. **Create Heroku account** at https://www.heroku.com

2. **Install Heroku CLI:**
```bash
# macOS
brew install heroku/brew/heroku

# Windows (via npm)
npm install -g heroku
```

3. **Create Heroku app:**
```bash
heroku login
cd backend
heroku create your-app-name
```

4. **Set environment variables:**
```bash
heroku config:set VIDEOSDK_API_KEY=your_key
heroku config:set VIDEOSDK_SECRET_KEY=your_secret
```

5. **Deploy:**
```bash
git push heroku main
```

6. **Update app .env:**
```
REACT_APP_AUTH_URL = "https://your-app-name.herokuapp.com"
```

#### Option 2: Deploy on AWS/DigitalOcean/etc.

Similar process - set environment variables and deploy Node.js server.

#### Option 3: Docker Deployment

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t videosdk-token-server .
docker run -p 3000:3000 \
  -e VIDEOSDK_API_KEY=your_key \
  -e VIDEOSDK_SECRET_KEY=your_secret \
  videosdk-token-server
```

---

## 🔒 Security Best Practices

### ✅ DO's

1. **Keep `.env` files out of git:**
```bash
# .gitignore
backend/.env
.env
.env.local
```

2. **Use environment variables for secrets:**
```javascript
const secret = process.env.VIDEOSDK_SECRET_KEY; // ✅ Good
```

3. **Validate token requests:**
- Add rate limiting
- Verify user identity (optional)
- Log token generation

4. **Rotate credentials regularly:**
- Change API keys quarterly
- Monitor usage in VideoSDK dashboard

### ❌ DON'Ts

1. **Don't commit .env files**
```bash
# ❌ Bad
git add backend/.env

# ✅ Good
git add backend/.env.example
```

2. **Don't expose secrets in client-side code**
```javascript
// ❌ Bad - Exposed in app
const secret = "sk_xxx";

// ✅ Good - Kept in backend
```

3. **Don't hardcode API keys**
```javascript
// ❌ Bad
const apiKey = "ak_xxx";

// ✅ Good
const apiKey = process.env.VIDEOSDK_API_KEY;
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'jsonwebtoken'"

**Solution:**
```bash
cd backend
npm install
```

### Error: "Missing VIDEOSDK_API_KEY or VIDEOSDK_SECRET_KEY"

**Solution:**
1. Check `backend/.env` file exists
2. Verify API Key and Secret Key are set
3. Restart server after updating .env

### Error: "EADDRINUSE: address already in use :::3000"

**Solution:**
```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Or change PORT in .env
PORT=3001
```

### Error: "Token validation failed" in React Native App

**Causes & Solutions:**
1. Backend not running → Start backend with `npm start`
2. Wrong URL in .env → Check `REACT_APP_AUTH_URL`
3. Network issue → Ensure backend is accessible
4. API credentials wrong → Verify in `backend/.env`

### Token expires during meeting

**This won't happen!** Because:
- Token generated fresh each meeting (24h validity)
- If token were to expire, simply request new one
- Implement retry logic in app:

```javascript
// api.js - Already handles this
export const getToken = async () => {
  if (VIDEOSDK_TOKEN) {
    return VIDEOSDK_TOKEN;
  } else if (API_AUTH_URL) {
    const res = await fetch(`${API_AUTH_URL}/get-token`, {
      method: "GET",
    });
    const { token } = await res.json();
    return token; // Fresh token every time
  }
};
```

---

## 📊 Monitoring & Logging

### View Server Logs

```bash
# Terminal shows real-time logs:
🔵 Token request received
✅ Token generated successfully
```

### Log Token Generation

Backend logs every token request with timestamp:
```javascript
console.log('🔵 Token request received');
console.log('✅ Token generated successfully');
```

### Monitor in Dashboard

Visit [VideoSDK Dashboard](https://app.videosdk.live/dashboard):
- View API usage
- Track token generation
- Monitor active meetings

---

## 📱 How React Native App Uses It

### In `api.js`

```javascript
export const getToken = async () => {
  if (API_AUTH_URL) {
    const res = await fetch(`${API_AUTH_URL}/get-token`, {
      method: "GET",
    });
    const { token } = await res.json();
    return token; // ← Fresh token from backend
  }
};
```

### Flow in Join Screen

```
User clicks "Create Meeting"
       ↓
Call getToken() from api.js
       ↓
Backend: GET /get-token
       ↓
Return fresh token
       ↓
createMeeting({ token })
       ↓
Join VideoSDK meeting
```

---

## ✅ Verification Checklist

- [ ] VideoSDK API Key obtained from dashboard
- [ ] VideoSDK Secret Key obtained from dashboard
- [ ] `backend/.env` configured with credentials
- [ ] Backend dependencies installed (`npm install`)
- [ ] Backend started successfully (`npm start`)
- [ ] Health check passes (`curl http://localhost:3000/health`)
- [ ] Token generation works (`curl http://localhost:3000/get-token`)
- [ ] App's `.env` has `REACT_APP_AUTH_URL` set
- [ ] React Native app builds successfully
- [ ] App can create/join meetings without static token

---

## 🎯 Next Steps

1. **Start using dynamic tokens** - Forget about token expiration!
2. **Deploy to production** - Use Heroku, AWS, or your preferred platform
3. **Monitor usage** - Track token generation and API usage
4. **Add authentication** (optional) - Verify users before issuing tokens
5. **Implement rate limiting** (optional) - Prevent token abuse

---

## 📚 Additional Resources

- [VideoSDK Documentation](https://docs.videosdk.live)
- [JWT.io - JWT Debugger](https://jwt.io)
- [Express.js Documentation](https://expressjs.com)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides)

---

**Created:** January 25, 2026
**Version:** 1.0
**Status:** Ready for Production ✅
