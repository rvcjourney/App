# 🎯 Complete OTP Verification Setup - Final Checklist

## Prerequisites Checklist ✅

Before testing, ensure you have:

- [ ] Supabase project created (wgyoarzdzlkadefydfvk)
- [ ] Backend email configured in `backend/.env`
- [ ] Backend running: `npm run dev`
- [ ] Database columns added for email verification

---

## Step 1: Add Database Columns (5 minutes)

The profiles table needs two new columns for OTP tracking.

### Option A: Use SQL File (Easiest)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **wgyoarzdzlkadefydfvk**
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Open file: `MIGRATION_EMAIL_VERIFICATION.sql`
6. Copy entire contents and paste into Supabase SQL Editor
7. Click **Run** (Ctrl+Enter)

**Expected Result:**
```
Query executed successfully - 2 queries executed
```

### Option B: Manual SQL

In Supabase SQL Editor, run:

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);
```

### Verify it worked:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('email_verified', 'verified_at');
```

Should show 2 rows with the new columns.

---

## Step 2: Verify Backend Configuration (5 minutes)

Make sure `backend/.env` has:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

VIDEOSDK_API_KEY=your-key
VIDEOSDK_SECRET_KEY=your-secret

PORT=3000
```

**Gmail Setup:**
- Go to https://myaccount.google.com/apppasswords
- Create App Password for "Mail" on "Windows Computer"
- Copy 16-character password (no spaces)

---

## Step 3: Disable Supabase Email Confirmation (5 minutes)

In [Supabase Dashboard](https://app.supabase.com):

1. Click **Authentication** → **Providers**
2. Find **Email** section
3. Turn OFF **"Confirm email"** toggle (should be gray)
4. Turn ON **"Allow new users to sign up"** (should be green)
5. Click **Save changes**

---

## Step 4: Start Backend (2 minutes)

```bash
cd backend
npm install  # Only if first time
npm run dev
```

Wait for message:
```
🚀 VideoSDK Token Server Started
📍 Server running at: http://localhost:3000
```

---

## Step 5: Test Signup Flow (5 minutes)

1. Start app: `npm start`
2. Navigate to **Sign Up**
3. Enter:
   - Full Name: Test User
   - Email: your-test-email@gmail.com
   - Password: TestPassword123
4. Click **Create Account**

### Expected Flow:

✅ **Step 1:** Loading spinner shows  
✅ **Step 2:** Account created in Supabase  
✅ **Step 3:** Redirects to **OTP Verification Screen**  
✅ **Step 4:** Shows "We've sent a 6-digit OTP to: your-test-email@..."  
✅ **Step 5:** Check email for OTP (not Supabase confirmation email!)  
✅ **Step 6:** Enter OTP → Click "Verify OTP"  
✅ **Step 7:** Redirects to **Dashboard** 🎉

---

## What Each File Does

### Frontend Files:
- **SignupScreen.js** - Signup form, creates account & navigates to OTP
- **LoginScreen.js** - Login form, checks if email verified
- **OTPVerificationScreen.js** - Used in signup flow
- **EmailVerificationScreen.js** - Used if email not verified on login
- **RootNavigator.js** - Central hub, checks email verification status

### Backend Files:
- **backend/server.js** - OTP generation and email sending
- **backend/.env** - Email configuration

### Database Files:
- **MIGRATION_EMAIL_VERIFICATION.sql** - Adds email_verified columns

---

## Verification Endpoints

### Send OTP
```bash
curl -X POST http://localhost:3000/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

Response:
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "expiresIn": "10 minutes"
}
```

### Verify OTP
```bash
curl -X POST http://localhost:3000/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","otp":"123456"}'
```

Response:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "verified": true
}
```

---

## Common Issues & Solutions

### ❌ "Allow new users to sign up" error
**Fix:** Turn ON the toggle in Supabase Authentication → User Signups

### ❌ Still getting Supabase confirmation email
**Fix:** Turn OFF "Confirm email" toggle in Supabase → Providers → Email

### ❌ No OTP email arriving
**Fix:**
1. Check backend is running
2. Check email config in `backend/.env`
3. Check email spam folder
4. Restart backend: `npm run dev`

### ❌ "Cannot reach backend" error
**Fix:**
- Ensure backend running: `npm run dev`
- For Android emulator: use `http://10.0.2.2:3000`
- For physical device: use your computer IP (e.g., `http://192.168.x.x:3000`)

### ❌ Role fetch error after signup
**Fix:**
- Run MIGRATION_EMAIL_VERIFICATION.sql
- Clear app cache and restart
- Check profile was created in Supabase

---

## Database Check

To verify users are being marked as verified:

```sql
SELECT 
  id, 
  email, 
  role, 
  email_verified, 
  verified_at,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
```

Should show:
- New users: `email_verified = false` (before OTP)
- Verified users: `email_verified = true` (after OTP)

---

## Debug Logs to Check

### Frontend Console:
```
📧 Sending OTP to: user@email.com
✅ OTP sent successfully
✅ OTP verified successfully
✅ RootNavigator: Role fetched: student
```

### Backend Console (from `npm run dev`):
```
✅ OTP sent to user@email.com: 123456
✅ OTP verified for user@email.com
```

---

## Success Indicators ✅

When everything is working:

1. ✅ No Supabase confirmation emails
2. ✅ OTP email arrives within 2 seconds
3. ✅ 6-digit code works first try
4. ✅ Dashboard loads after verification
5. ✅ User role displays correctly
6. ✅ Login also requires OTP if email not verified

---

## Next Steps

1. **Complete all steps above** in order
2. **Test signup** with a fresh email address
3. **Test login** with the same email
4. **Check database** to verify email_verified status
5. **Check logs** for any error messages

---

## Need Help?

- Check `OTP_TROUBLESHOOTING.md` for detailed troubleshooting
- Check `OTP_SETUP_GUIDE.md` for detailed setup info
- Check `OTP_VERIFICATION_FIX.md` for architecture details
- Check backend console logs for email errors

---

**You're all set! Test it out now! 🚀**
