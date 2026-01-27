# OTP Not Receiving? Troubleshooting Guide

## Problem: Getting Supabase Confirmation Email Instead of OTP

### Solution Checklist

#### 1. ✅ Disable Supabase Email Confirmation
**CRITICAL - Do this first!**

Go to [Supabase Dashboard](https://app.supabase.com):
- Project: `wgyoarzdzlkadefydfvk`
- **Authentication** → **Providers** → **Email**
- Find **"Confirm email"** toggle → Turn it **OFF** ❌
- Save changes

**Why?** Supabase still sends its default confirmation email. You must disable it.

---

#### 2. ✅ Backend Email Configuration
Check `backend/.env` file exists with:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
VIDEOSDK_API_KEY=xxx
VIDEOSDK_SECRET_KEY=xxx
PORT=3000
```

**For Gmail:**
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Copy the 16-character password (remove spaces)
5. Paste in `.env` as `EMAIL_PASSWORD`

---

#### 3. ✅ Backend is Running
Run in terminal (from `backend/` folder):
```bash
npm install
npm run dev
```

You should see:
```
🚀 VideoSDK Token Server Started
📍 Server running at: http://localhost:3000
```

Check if backend is accessible:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"...","service":"VideoSDK Token Server"}
```

---

#### 4. ✅ Backend URL in Frontend
Check your frontend environment or update OTPVerificationScreen:

Look for this line in `src/scenes/OTPVerificationScreen.js`:
```javascript
const BACKEND_URL = process.env.REACT_APP_AUTH_URL || 'http://localhost:3000';
```

**For Android Emulator:**
```javascript
const BACKEND_URL = 'http://10.0.2.2:3000'; // Android default to host machine
```

**For Physical Device:**
```javascript
const BACKEND_URL = 'http://YOUR_COMPUTER_IP:3000'; // e.g., http://192.168.x.x:3000
```

Find your IP:
- **Windows**: `ipconfig` → Look for IPv4 Address
- **Mac**: `ifconfig` → Look for inet

---

#### 5. ✅ Database Schema
In Supabase SQL Editor, run:
```sql
-- Add columns to profiles table if missing
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
```

---

## Testing Steps

### 1. Test Backend Email Directly
Create file `test-otp.js` in `backend/`:
```javascript
const fetch = require('node-fetch');

const testEmail = 'your-test-email@gmail.com';

// Send OTP
fetch('http://localhost:3000/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: testEmail })
})
  .then(r => r.json())
  .then(data => console.log('Send Result:', data))
  .catch(err => console.error('Error:', err.message));
```

Run: `node test-otp.js`

Check if you receive email with OTP.

---

### 2. Test App Signup
1. Start backend: `npm run dev`
2. Start app: `npm start`
3. Create account with test email
4. **Check console logs** - should see:
   - `📧 Sending OTP to: user@email.com`
   - `✅ OTP sent successfully` OR error details
5. Check email for OTP

---

## Common Errors & Fixes

### "Failed to send OTP"
**Cause:** Email not configured or credentials wrong

**Fix:**
- Verify `.env` in `backend/` folder
- For Gmail, check App Password (16 characters, no spaces)
- Restart backend: `npm run dev`

---

### "Cannot reach backend at http://localhost:3000"
**Cause:** Backend not running or wrong URL

**Fix:**
- Ensure backend running: `npm run dev`
- Check port 3000 is available
- Update BACKEND_URL in OTPVerificationScreen.js
- For Android emulator: use `http://10.0.2.2:3000`

---

### Still Getting Supabase Confirmation Email
**Cause:** Email confirmation not disabled in Supabase

**Fix:**
- Go to [Supabase Dashboard](https://app.supabase.com)
- **Authentication** → **Providers** → **Email**
- Turn off "Confirm email" toggle
- Wait 5 minutes and test again

---

### OTP Expires Too Quickly
**Current:** 10 minutes

**To change:** In `backend/server.js`, find:
```javascript
const expiryTime = Date.now() + 10 * 60 * 1000; // Change 10 to desired minutes
```

---

## Detailed Flow Verification

### Expected Signup Flow:
```
1. User enters: Name, Email, Password → Click "Create Account"
   ✓ Loading spinner shows
   
2. Account created in Supabase
   ✓ No email from Supabase (because you disabled it)
   
3. Automatically navigates to OTP screen
   ✓ Shows: "We've sent a 6-digit OTP to: user@email.com"
   
4. Backend sends OTP via email
   ✓ User receives email with 6-digit code
   
5. User enters OTP → Click "Verify OTP"
   ✓ Backend validates
   
6. Success! Redirects to dashboard
   ✓ Email marked as verified in database
```

---

## Logs to Check

### Backend Console (from `npm run dev`):
```
✅ OTP sent to user@email.com: 123456
✅ OTP verified for user@email.com
```

### Frontend Console (React Native):
```
📧 Sending OTP to: user@email.com
🔗 Backend URL: http://localhost:3000
✅ OTP sent successfully
```

---

## Need More Help?

1. **Check Backend Logs**: Look at console output from `npm run dev`
2. **Check Email Spam**: OTP might be in spam folder
3. **Verify Supabase Settings**: Confirm email confirmation is OFF
4. **Test Email Service**: Check if Gmail App Password is correct

---

**Quick Reference:**

| Issue | Check | Fix |
|-------|-------|-----|
| No email received | Email configured in `.env` | Add valid email credentials |
| Supabase confirmation email | Supabase dashboard | Disable "Confirm email" toggle |
| Backend unreachable | Backend running on 3000 | Start with `npm run dev` |
| Wrong backend URL | Frontend env vars | Set correct URL for device |
| OTP expired | Timer logic | Ensure backend time is synced |

---

**After fixing, test with a new account!** 🚀
