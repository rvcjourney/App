# Quick Start: Payment System & Admin Access

## 📊 Option 1: Access Admin Dashboard from Web Browser

**EASIEST WAY** - Open this file in Chrome/Firefox:
```
c:\App\App\admin-dashboard.html
```

**Just double-click the file** and your admin dashboard opens!

**What you can do**:
- ✅ View total revenue and pending withdrawals
- ✅ See payment analytics and top teachers  
- ✅ Approve/reject withdrawal requests
- ✅ Real-time updates every 30 seconds

---

## 🔧 Fix Backend Payment Endpoints (Required)

### Step 1: Get Supabase Service Role Key

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **wgyoarzdzlkadefydfvk**
3. Go to **Settings** → **API** (left sidebar)
4. Under "Project API keys", copy the **Service Role** key (the long one)
   - ⚠️ NOT the "anon" key
   - It's the longer key below the anon key

### Step 2: Update Backend .env File

**File**: `c:\App\App\backend\.env`

Find this line:
```
SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_YOUR_SERVICE_ROLE_KEY
```

Replace `REPLACE_WITH_YOUR_SERVICE_ROLE_KEY` with your copied Service Role key:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJl...
```

### Step 3: Restart Backend Server

Open PowerShell or Command Prompt in `c:\App\App\backend`:

```bash
node server.js
```

**Expected Output**:
```
==================================================
🚀 VideoSDK Token Server Started
==================================================
📍 Server running at: http://localhost:3000
...
```

---

## 📱 Step 4: Test Payment Flow on App

### 4a. Reload React Native App
- Shake your phone/emulator
- Select "Reload"
- App will now connect to `10.0.2.2:3000` (Android) or `localhost:3000` (iOS)

### 4b. Go Through Payment Flow
1. **StudentDashboard** → Select a teacher
2. **Select a slot** → Click "Confirm Booking"
3. **StudentCheckout** screen opens
   - Should see pricing: Teacher ₹600 + Admin ₹150 = **Total ₹750**
   - ✅ NO "Network request failed" error
4. Click **Pay Now**
5. **Razorpay modal** opens
   - Enter test card: `4111 1111 1111 1111`
   - Expiry: Any future date (e.g., 12/25)
   - CVV: Any 3 digits (e.g., 123)
6. **Payment success** ✅
   - App navigates back to StudentDashboard
   - Booking shows as "Paid"

---

## 🌐 Admin Dashboard Features

### Access from Web Browser
1. **Open file**: `c:\App\App\admin-dashboard.html`
2. **Enter backend URL**: `http://localhost:3000` (pre-filled)
3. **Click "Test Connection"**
   - Should show: ✅ "Connected"

### View Analytics
- 💰 **Total Revenue**: Sum of all payments
- 📊 **Payment Count**: Number of transactions
- 👨‍🏫 **Top Teachers**: Earnings per teacher
- 📤 **Pending Withdrawals**: Queue of withdrawal requests

### Manage Withdrawals
- **See** pending teacher withdrawal requests
- **Approve** → Sends money to teacher's bank
- **Reject** → Refunds amount to teacher wallet

### Set Admin Charges
Soon: Customize admin charge per teacher (default: ₹150)

---

## 🔍 Troubleshooting

### "Error: Not Found" when clicking Pay Now

**Solution**: Backend server crashed or not started
```bash
# Kill any running node servers
taskkill /F /IM node.exe

# Navigate to backend
cd c:\App\App\backend

# Start fresh
node server.js
```

### "Network request failed"

**Causes**:
1. ❌ Backend not running
   - Start with: `node server.js` in backend folder
2. ❌ Wrong API URL
   - Check app is using `10.0.2.2:3000` (Android)
   - Or `localhost:3000` (iOS)

**Fix**: See "Step 3" above

### Admin Dashboard shows "Disconnected"

**Causes**:
1. Backend not running → Start with `node server.js`
2. Wrong URL in dashboard → Change to `http://localhost:3000`
3. CORS issue → Backend should have CORS enabled ✅

**Verify**:
```bash
# In PowerShell
Invoke-WebRequest -Uri http://localhost:3000/health

# Should return "status": "ok"
```

### Razorpay Payment Modal Doesn't Open

**Causes**:
1. Razorpay keys not set in `.env`
2. Payment order creation failed at backend

**Fix**:
1. Check `.env` has valid Razorpay keys:
   - `RAZORPAY_KEY_ID=rzp_test_...`
   - `RAZORPAY_KEY_SECRET=...`
2. Check backend console for errors
3. Restart server: `node server.js`

---

## 📋 Environment Variables (.env) Checklist

**All of these must be set**:

| Variable | Value | Status |
|----------|-------|--------|
| `SUPABASE_URL` | `https://wgyoarzdzlkadefydfvk.supabase.co` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | ⚠️ **NEEDS FIX** |
| `VIDEOSDK_API_KEY` | Your API key | ✅ Set |
| `VIDEOSDK_SECRET_KEY` | Your secret key | ✅ Set |
| `RAZORPAY_KEY_ID` | `rzp_test_...` | ✅ Set |
| `RAZORPAY_KEY_SECRET` | Your key secret | ✅ Set |
| `EMAIL_USER` | Your email | ✅ Set |
| `EMAIL_PASSWORD` | App password | ✅ Set |

**Only SUPABASE_SERVICE_ROLE_KEY needs to be updated!**

---

## 🚀 Complete Checklist

- [ ] Copy Supabase Service Role key
- [ ] Update `.env` with the key
- [ ] Start backend: `node server.js`
- [ ] Wait for "🚀 Server running on http://localhost:3000"
- [ ] Reload React Native app
- [ ] Test payment flow (book → pay → success)
- [ ] Open admin dashboard: `admin-dashboard.html`
- [ ] Verify analytics are loading
- [ ] ✅ Done!

---

## 📞 Need Help?

Check logs in:
1. **Backend console**: What `node server.js` outputs
2. **React Native debugger**: Console logs from app
3. **Admin dashboard**: Shows connection status

All problems are usually one of these:
1. ❌ Backend not running → Start it
2. ❌ Wrong Supabase key → Update it
3. ❌ Wrong app URL → Reload app
4. ❌ Database schema not created → Run SQL in Supabase

---

## Next Steps After Payment Works

1. **Test teacher withdrawal** - Accumulate ₹10K+ earnings
2. **Verify bank transfers** - Set up Razorpay Payouts
3. **Configure email notifications** - OTP and payment emails
4. **Go live** - Switch from test to production keys

