# OTP Email Verification Setup Guide

## Overview
The authentication system has been updated from email link verification to OTP (One-Time Password) verification. Users will now receive a 6-digit code via email that they need to enter to verify their account.

## What Changed

### 1. Backend Changes (`backend/server.js`)
- Added OTP generation and storage
- Added `/send-otp` endpoint to send OTP emails
- Added `/verify-otp` endpoint to validate OTP codes
- Integrated Nodemailer for email sending

### 2. Frontend Changes
- **SignupScreen.js**: Updated to navigate to OTP verification after account creation
- **LoginScreen.js**: Updated to verify email via OTP on first login
- **OTPVerificationScreen.js**: New screen for OTP input and verification
- **AuthStack.js**: Added OTP verification route

## Setup Instructions

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

This will install the new `nodemailer` package required for email sending.

### Step 2: Configure Email Service

Create or update `.env` file in the `backend/` directory:

```env
# VideoSDK Configuration
VIDEOSDK_API_KEY=your_videosdk_api_key_here
VIDEOSDK_SECRET_KEY=your_videosdk_secret_key_here

# Email Configuration (Gmail Example)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# Server
PORT=3000
```

### Step 3: Setup Gmail App Password (Recommended)

**For Gmail Users:**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification" if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer" (or your device)
5. Google will generate a 16-character password (with spaces)
6. Copy the password and paste it in `.env` as `EMAIL_PASSWORD` (remove spaces)

### Step 4: Update Frontend Environment

Ensure the frontend can reach your backend. Check that `REACT_APP_AUTH_URL` environment variable is set correctly (usually `http://localhost:3000` for local development).

### Step 5: Database Migration (if using Supabase)

Add the following columns to your `profiles` table if not already present:

```sql
ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMP;
```

## OTP Verification Flow

### Signup Flow:
1. User enters Full Name, Email, Password → **Create Account**
2. Account created in Supabase
3. OTP sent to email automatically
4. User enters 6-digit OTP
5. OTP verified → Email marked as verified
6. User redirected to dashboard

### Login Flow:
1. User enters Email & Password → **Login**
2. If email not verified:
   - OTP sent to email
   - User enters 6-digit OTP
   - Email marked as verified
3. User redirected to dashboard

## OTP Features

- **Expiration**: OTP expires after 10 minutes
- **Attempt Limit**: Maximum 5 failed attempts before requiring new OTP
- **Resend**: Users can request new OTP with 60-second cooldown
- **6-digit Code**: Randomly generated for security

## API Endpoints

### Send OTP
```
POST /send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "OTP sent to your email",
  "expiresIn": "10 minutes"
}
```

### Verify OTP
```
POST /verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "verified": true
}
```

## Troubleshooting

### OTP not receiving emails:
1. Check `.env` file has correct email credentials
2. For Gmail, verify App Password is correct (remove spaces)
3. Ensure 2-Step Verification is enabled on Gmail account
4. Check spam/junk folder

### "OTP expired" error:
- User has 10 minutes to verify OTP
- Request a new OTP using "Resend OTP" button

### "Too many failed attempts":
- Maximum 5 wrong attempts allowed
- User must request new OTP to try again

### Backend not connecting:
- Ensure backend is running: `npm run dev`
- Check `REACT_APP_AUTH_URL` matches backend URL
- Verify CORS is properly configured

## Email Template

The OTP email includes:
- Welcome message
- 6-digit OTP in large, prominent format
- 10-minute expiration notice
- Company branding

## Production Notes

1. **OTP Storage**: Currently stored in-memory. For production, use:
   - Redis for fast, distributed caching
   - Database for persistence
   - Consider OTP service like Twilio/SNS

2. **Email Service**: Consider using:
   - SendGrid (industry standard)
   - AWS SES (scalable)
   - Mailgun (reliable)
   - Twilio SendGrid

3. **Security**:
   - Use environment variables for credentials
   - Never commit `.env` file to version control
   - Implement rate limiting on OTP endpoints
   - Log OTP attempts for security audit

4. **Monitoring**:
   - Track OTP send/verify failures
   - Monitor email delivery rates
   - Alert on unusual verification patterns

## Testing

To test OTP locally:
1. Start backend: `npm run dev`
2. Use test email addresses
3. Check backend logs for generated OTP (visible in console during development)
4. On production, retrieve OTP from email only

---

**Need Help?** Check the backend server logs for detailed error messages during development.
