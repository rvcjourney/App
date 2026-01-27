# Disable Supabase Email Confirmation

Since you're using our custom OTP verification system, you need to disable Supabase's built-in email confirmation.

## Steps to Disable Supabase Email Confirmation

### 1. Go to Supabase Dashboard
- Open [https://app.supabase.com](https://app.supabase.com)
- Select your project: **wgyoarzdzlkadefydfvk**

### 2. Navigate to Authentication Settings
- Click on **Authentication** in the left sidebar
- Click on **Providers** tab
- Click on **Email** section

### 3. Disable "Confirm email"
Look for the setting:
- **"Confirm email"** toggle
- Turn it **OFF** ❌

### 4. Alternative: Modify Email Template (Optional)
If you want to keep some email confirmation but customize it:
- Go to **Email Templates** 
- Find **"Confirm signup"** template
- You can customize or disable it

### 5. Update Authentication Settings
In the same **Authentication** → **Providers** section:
- Disable: "Require email verification"
- Enable: "Enable email/password sign ups"

## What This Does

By disabling Supabase's email confirmation:
- ✅ Supabase will NOT send confirmation emails
- ✅ Your OTP system handles all verification
- ✅ Users go directly to OTP screen after signup
- ✅ No conflicting emails from Supabase

## Current Flow After Changes

```
1. User fills signup form (Name, Email, Password)
   ↓
2. Account created in Supabase (NO confirmation email)
   ↓
3. Navigate to OTP Verification Screen
   ↓
4. OTP sent via your backend (our custom email)
   ↓
5. User enters 6-digit OTP
   ↓
6. Verified! → Dashboard access
```

## Verify It's Working

After disabling Supabase email confirmation:
1. Test signup with a test email
2. You should receive ONLY the OTP email (from your configured EMAIL_USER)
3. No "Confirm your signup" email from Supabase

## Screenshots for Visual Guide

### Step 2: Click Authentication
![Navigate to Auth](./docs/auth-step1.png)

### Step 3: Email Provider Settings
Look for the Email section and find "Confirm email" toggle

### Step 4: Turn Off Confirmation
Toggle should be switched to OFF

---

**IMPORTANT**: Make sure your backend email is configured first (see OTP_SETUP_GUIDE.md) before disabling Supabase confirmation, otherwise users won't receive any verification emails!
