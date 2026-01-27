# 🔐 VideoSDK Token Generation Server

A **Node.js/Express backend server** that generates dynamic JWT tokens for VideoSDK on-demand, replacing static hardcoded tokens.

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure credentials
# Copy .env.example to .env and add your credentials
cp .env.example .env
# Edit .env with your API Key & Secret Key

# 3. Start server
npm start
# Server runs on http://localhost:3000
```

## 📋 Features

✅ **Dynamic Token Generation** - Fresh token for each request
✅ **No Token Expiry Issues** - Auto-generated 24h tokens
✅ **Secure API Credentials** - Keys kept on backend, never exposed
✅ **Production Ready** - Deployable to any Node.js hosting
✅ **Easy Integration** - Works with existing React Native app
✅ **Monitoring Endpoints** - Health check and token validation
✅ **CORS Enabled** - Works with mobile apps
✅ **Error Handling** - Comprehensive error messages

## 🚀 What It Does

```
React Native App
    ↓ (requests token)
Backend Server
    ├─ Load API Key & Secret from .env
    ├─ Generate JWT token
    └─ Return to app
    ↓
App uses token to create/join meetings
```

## 📁 File Structure

```
backend/
├── server.js              # Main token server
├── package.json           # Dependencies & scripts
├── .env                   # Your API credentials (keep secret!)
├── .env.example           # Template for .env
├── README.md              # This file
├── QUICKSTART.md          # 5-minute setup guide
├── SETUP_GUIDE.md         # Comprehensive setup
├── ARCHITECTURE.md        # System architecture
└── node_modules/          # Installed dependencies
```

## 🔧 Configuration

### Setup Steps

1. **Get Credentials:**
   - Go to https://app.videosdk.live/settings
   - Find your **API Key** and **Secret Key**

2. **Configure .env:**
   ```bash
   VIDEOSDK_API_KEY=your_api_key_here
   VIDEOSDK_SECRET_KEY=your_secret_key_here
   PORT=3000
   ```

3. **Install & Run:**
   ```bash
   npm install
   npm start
   ```

4. **Update React App:**
   - In app's `.env`:
   ```
   REACT_APP_AUTH_URL = "http://localhost:3000"
   ```

## 📡 API Endpoints

### GET /get-token
Returns a fresh VideoSDK token.

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "timestamp": "2026-01-25T10:30:00.000Z"
}
```

**Usage in App:**
```javascript
const response = await fetch('http://localhost:3000/get-token');
const { token } = await response.json();
// Use token for meeting creation
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-25T10:30:00.000Z",
  "service": "VideoSDK Token Server"
}
```

### POST /validate-token
Validates a token.

**Request:**
```json
{
  "token": "eyJhbGc..."
}
```

**Response:**
```json
{
  "valid": true,
  "decoded": {
    "apikey": "...",
    "permissions": ["allow_join", "allow_mod"],
    "iat": 1642000000,
    "exp": 1642086400
  }
}
```

## 📦 Dependencies

- **express** - Web framework
- **jsonwebtoken** - JWT token generation
- **cors** - Handle cross-origin requests
- **dotenv** - Environment variable management

## 🧪 Testing

### Test Health Check
```bash
curl http://localhost:3000/health
```

### Get Token
```bash
curl http://localhost:3000/get-token
```

### Validate Token
```bash
curl -X POST http://localhost:3000/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token": "your_token_here"}'
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find module` | Run `npm install` |
| `Missing VIDEOSDK_API_KEY` | Check `.env` file has credentials |
| `Port 3000 already in use` | Change `PORT` in `.env` or kill process |
| `ECONNREFUSED` from app | Make sure backend is running |

See **SETUP_GUIDE.md** for detailed troubleshooting.

## 🌐 Deployment

### Heroku (Free)
```bash
heroku create your-app-name
heroku config:set VIDEOSDK_API_KEY=your_key
heroku config:set VIDEOSDK_SECRET_KEY=your_secret
git push heroku main
```

### Docker
```bash
docker build -t videosdk-token-server .
docker run -p 3000:3000 \
  -e VIDEOSDK_API_KEY=your_key \
  -e VIDEOSDK_SECRET_KEY=your_secret \
  videosdk-token-server
```

### AWS/DigitalOcean
Deploy like any Node.js app with environment variables set.

## 📚 Documentation

- **QUICKSTART.md** - 5-minute setup
- **SETUP_GUIDE.md** - Complete guide with all details
- **ARCHITECTURE.md** - System design & flows

## 🔒 Security

✅ **API Keys Protected:**
- Kept in `.env` (not in git)
- Only in server memory
- Never logged or exposed

✅ **Token Security:**
- Signed with secret key (HS256)
- 24h expiration
- Unique per request

✅ **Production Ready:**
- Use HTTPS/TLS
- Set secure environment variables
- Enable rate limiting (optional)
- Monitor usage

## 📊 Monitoring

Server logs all token requests:
```
🔵 Token request received
✅ Token generated successfully
```

Monitor in [VideoSDK Dashboard](https://app.videosdk.live/dashboard)

## 🚀 Next Steps

1. Configure with your credentials
2. Start server (`npm start`)
3. Test health endpoint
4. Update React app's `.env`
5. Test meeting creation
6. Deploy to production

## 💡 How It Works

1. **Request:** App calls `GET /get-token`
2. **Generate:** Server creates JWT with:
   - Your API Key
   - Permissions (`allow_join`, `allow_mod`)
   - 24h expiration
3. **Sign:** Token signed with your Secret Key
4. **Return:** Fresh token sent to app
5. **Use:** App uses token for VideoSDK API calls

## 🎯 Benefits

| Feature | Static Token | Dynamic Token |
|---------|--------------|---------------|
| Security | ❌ Exposed | ✅ Protected |
| Expiration | ❌ Expires | ✅ Fresh each time |
| Scalability | ❌ Limited | ✅ Unlimited |
| Production | ⚠️ Risky | ✅ Ready |

## 📝 Scripts

```bash
npm start              # Start server (production)
npm run dev            # Start with auto-reload (development)
npm install            # Install dependencies
npm test               # Run tests (if configured)
```

## 🔗 Resources

- [VideoSDK Docs](https://docs.videosdk.live)
- [JWT.io](https://jwt.io) - JWT Debugger
- [Express.js](https://expressjs.com) - Web Framework
- [Node.js](https://nodejs.org) - Runtime

## 📞 Support

- **Setup Issues:** Check SETUP_GUIDE.md
- **Architecture Questions:** See ARCHITECTURE.md
- **API Issues:** Check endpoint examples above
- **VideoSDK Issues:** https://docs.videosdk.live

## 📄 License

MIT

---

**Created:** January 25, 2026
**Version:** 1.0
**Status:** Production Ready ✅

For more details, see the complete documentation files in this directory.
