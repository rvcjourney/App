# ⚡ Quick Fix Checklist - OTP Not Sending

Complete these steps in order:

## Step 1: Disable Supabase Email (5 minutes)
- [ ] Go to https://app.supabase.com
- [ ] Select project: `wgyoarzdzlkadefydfvk`
- [ ] Click **Authentication** → **Providers**
- [ ] Find **Email** section
- [ ] Turn OFF **"Confirm email"** toggle
- [ ] Click **Save**

**Verify:** Try signup - should NOT receive Supabase confirmation email

---

## Step 2: Setup Backend Email (10 minutes)

### Gmail Setup:
- [ ] Go to https://myaccount.google.com/security
- [ ] Enable **2-Step Verification** if not done
- [ ] Go to https://myaccount.google.com/apppasswords
- [ ] Select "Mail" and "Windows Computer"
- [ ] Copy the 16-character password

### Configure Backend:
- [ ] Open `backend/.env` file
- [ ] Fill in:
  ```env
  EMAIL_SERVICE=gmail
  EMAIL_USER=your-gmail@gmail.com
  EMAIL_PASSWORD=your-16-char-password
  VIDEOSDK_API_KEY=your-api-key
  VIDEOSDK_SECRET_KEY=your-secret-key
  PORT=3000
  ```

- [ ] Save the file

**Verify:** `backend/.env` exists with email credentials

---

## Step 3: Install & Run Backend (5 minutes)

Open terminal in `backend/` folder:

```bash
npm install
npm run dev
```

Wait for message:
```
🚀 VideoSDK Token Server Started
📍 Server running at: http://localhost:3000
```

**Verify:** See the success message in terminal

---

## Step 4: Test OTP Email (3 minutes)

In another terminal (backend still running):
```bash
curl -X POST http://localhost:3000/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"your-test@gmail.com\"}"
```

Expected response:
```json
{"success":true,"message":"OTP sent to your email","expiresIn":"10 minutes"}
```

**Verify:** You receive email with 6-digit OTP code

---

## Step 5: Test Full Signup Flow (5 minutes)

1. [ ] Start app: `npm start`
2. [ ] Navigate to **Sign Up**
3. [ ] Enter: Name, Email (use test email), Password
4. [ ] Click **Create Account**
5. [ ] Should go to **OTP Verification screen**
6. [ ] Check email for OTP
7. [ ] Enter the 6-digit code
8. [ ] Click **Verify OTP**
9. [ ] Should redirect to dashboard

---

## Troubleshooting Quick Links

- **Still getting Supabase email?** → Check Step 1 (disable in dashboard)
- **No email at all?** → Check Step 2 & 3 (email not configured or backend not running)
- **Backend not connecting?** → Check Step 3 (run `npm run dev`)
- **OTP code not working?** → Check expiration (10 minutes) and try **Resend OTP**

---

## Debug: Check Backend Email Config

To verify email is properly configured, check `backend/.env`:
```bash
# Windows
type backend\.env

# Mac/Linux
cat backend/.env
```

Should show:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxxxxxxxxxx
```

---

## If Still Not Working

1. **Check backend logs** (where you ran `npm run dev`)
   - Look for error messages
   - Screenshot and share errors

2. **Verify Gmail App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Regenerate if unsure
   - Use the NEW password in `.env`
   - Restart backend

3. **Check email spam folder**
   - Email might be marked as spam
   - Check spam/junk folder

4. **Verify Supabase disabled email**
   - Go to Authentication → Providers
   - Screenshot to confirm toggle is OFF

---

## Success! 🎉

When OTP is working you'll see:
- ✅ No more Supabase confirmation emails
- ✅ OTP email arrives within seconds
- ✅ 6-digit code works for verification
- ✅ User redirected to dashboard after verification

---

**Questions? Check:**
- `OTP_SETUP_GUIDE.md` - Full setup details
- `OTP_TROUBLESHOOTING.md` - Detailed troubleshooting
