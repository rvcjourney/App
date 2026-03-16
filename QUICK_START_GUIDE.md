# Quick Start Guide - Admin Panel & Backend

**Date**: March 16, 2026
**Status**: All critical fixes implemented and ready to run

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- Backend server running
- Supabase project configured

---

## 📋 Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create `.env` file in `backend/` directory:
```env
# Supabase
SUPABASE_URL=https://wgyoarzdzlkadefydfvk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# VideoSDK
VIDEOSDK_API_KEY=your_videosdk_api_key
VIDEOSDK_SECRET_KEY=your_videosdk_secret_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Start Backend Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

**Expected Output:**
```
✅ VideoSDK Configuration loaded successfully
📍 Server running at: http://localhost:3000
📌 Available Endpoints: ...
```

---

## 🎨 Admin Panel Setup

### 1. Install Dependencies
```bash
cd LearningPlatform
npm install
```

### 2. Verify .env File
File `.env` should exist in `LearningPlatform/` with:
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://wgyoarzdzlkadefydfvk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **File already created!**

### 3. Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
  VITE v7.3.1  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## ✅ Verification Checklist

### Backend
- [ ] Backend server starts without errors
- [ ] See "Server running at: http://localhost:3000"
- [ ] Logger initialized with combined.log and error.log
- [ ] API endpoints are available (see banner)

### Admin Panel
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:5173/
- [ ] Login page displays (no VITE_API_URL error)
- [ ] Can authenticate (if credentials set up in backend)
- [ ] Dashboard loads without crashes

### Critical Fixes
- [ ] Auth logic working (admin sees dashboard, non-admin sees login)
- [ ] No hardcoded IP addresses in browser console
- [ ] Error boundary catches errors gracefully
- [ ] Validation schemas prevent crashes from malformed data
- [ ] CSRF tokens generated for POST requests

---

## 🔑 Environment Variables Reference

### Backend (.env in backend/)
| Variable | Purpose | Example |
|----------|---------|---------|
| `SUPABASE_URL` | Database URL | `https://...supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Database key | Server-side only |
| `VIDEOSDK_API_KEY` | Video meeting service | From videosdk.live |
| `RAZORPAY_KEY_ID` | Payment processor | From razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | Payment secret | Keep private |
| `EMAIL_USER` | Email sender | your-email@gmail.com |
| `EMAIL_PASSWORD` | Email app password | From Google |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development/production |
| `LOG_LEVEL` | Logging level | error/warn/info/debug |

### Frontend (.env in LearningPlatform/)
| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000` |
| `VITE_SUPABASE_URL` | Database URL | `https://...supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public key | From Supabase |
| `VITE_APP_NAME` | App name | LearningPlatform Admin |
| `VITE_DEBUG` | Debug mode | true/false |

---

## 📁 Project Structure

```
App/
├── backend/
│   ├── .env                 ← Create with your credentials
│   ├── .env.example         ← Reference template
│   ├── .gitignore
│   ├── server.js            ← Main server file
│   ├── middleware.js        ← ✅ NEW: Error & validation middleware
│   ├── logger.js            ← ✅ NEW: Winston logger
│   ├── package.json
│   └── logs/                ← Generated log files
│
└── LearningPlatform/
    ├── .env                 ← ✅ Created with defaults
    ├── .env.example         ← ✅ NEW: Configuration template
    ├── .gitignore
    ├── src/
    │   ├── App.jsx          ← ✅ FIXED: Auth logic + Error Boundary
    │   ├── components/
    │   │   └── ErrorBoundary.jsx    ← ✅ NEW: Error protection
    │   ├── schemas/
    │   │   └── responses.js         ← ✅ NEW: Zod validation
    │   ├── services/
    │   │   └── api.js               ← ✅ FIXED: API configuration + validation
    │   ├── utils/
    │   │   ├── security.js          ← ✅ NEW: CSRF & security
    │   │   └── notifications.js     ← ✅ NEW: Toast notifications
    │   └── config/
    │       └── supabase.js
    ├── package.json
    └── dist/                ← Built files
```

---

## 🔧 Common Issues & Solutions

### Issue: "VITE_API_URL environment variable not set"
**Solution**: Check that `.env` file exists in LearningPlatform/ with:
```env
VITE_API_URL=http://localhost:3000
```

### Issue: Backend connection refused
**Solution**: Ensure backend server is running:
```bash
cd backend
npm start
```

### Issue: "Cannot find Supabase credentials"
**Solution**: Update .env files with valid Supabase project credentials

### Issue: "React-icons import error"
**Solution**: Already fixed! Use `import { FaIconName } from 'react-icons/fa'`

### Issue: "Validation errors in console"
**Solution**: This is normal - validation schemas warn about unexpected data structures. Check backend response format.

---

## 🧪 Testing the Setup

### 1. Test Backend API
```bash
# In a new terminal
curl http://localhost:3000/health
# Should return health check response
```

### 2. Test Frontend Connection
- Open http://localhost:5173/ in browser
- Check browser console (F12) for errors
- If no "VITE_API_URL" error → ✅ Configuration correct

### 3. Test Authentication
- Try logging in with test credentials
- Admin should see dashboard
- Non-admin should see login page only

### 4. Test Error Boundary
- Disable Network in DevTools (F12 → Network → Offline)
- Try to load teachers/students
- Should show error boundary UI (not crash)

---

## 📊 Performance Tips

### Development
- Keep DevTools closed when not debugging
- Use `npm run dev` for hot reload
- Check Console tab for validation warnings

### Production
- Run `npm run build` to create optimized build
- Serve from `dist/` folder
- Set `NODE_ENV=production` on server
- Use HTTPS for API URLs

---

## 📞 Support

### If Something Goes Wrong:
1. **Check logs**:
   - Backend: `backend/logs/combined.log`
   - Frontend: Browser Console (F12)

2. **Clear cache and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Verify configuration**:
   - Check .env files exist and are readable
   - Verify backend is running
   - Check firewall/antivirus isn't blocking ports

4. **Review documentation**:
   - [CRITICAL_FIXES_IMPLEMENTED.md](LearningPlatform/CRITICAL_FIXES_IMPLEMENTED.md)
   - [ADMIN_PANEL_ANALYSIS.md](ADMIN_PANEL_ANALYSIS.md)
   - [BACKEND_IMPROVEMENTS_SUMMARY.md](BACKEND_IMPROVEMENTS_SUMMARY.md)

---

## ✨ Summary

### What's Ready:
- ✅ Backend server with security improvements
- ✅ Admin panel with error boundaries
- ✅ API response validation with Zod
- ✅ CSRF protection and security utilities
- ✅ Toast notifications for user feedback
- ✅ Proper environment configuration

### Next Steps:
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd LearningPlatform && npm run dev`
3. Open http://localhost:5173/ in browser
4. Log in with admin credentials
5. Test the dashboard and all pages

**You're all set! 🚀**
