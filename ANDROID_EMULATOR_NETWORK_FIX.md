# Android Emulator Backend Connection Fix ✅

## Problem
Your backend server is running on `localhost:3000`, but:
- **Android Emulator cannot reach `localhost`** - it refers to the emulator itself, not your host machine
- The app was failing to connect with: `Network request failed`

## Solution Applied ✅

**File Updated**: `src/api/api.js`

### What Changed
```javascript
// BEFORE - Doesn't work on Android Emulator
const API_AUTH_URL = REACT_APP_AUTH_URL || "http://192.168.1.5:3000";

// AFTER - Works on both Android Emulator and iOS Simulator
const getBackendURL = () => {
  if (REACT_APP_AUTH_URL) {
    return REACT_APP_AUTH_URL;
  }
  // Android emulator uses 10.0.2.2 as special alias for host machine
  const baseURL = Platform.OS === 'android' ? "http://10.0.2.2:3000" : "http://localhost:3000";
  console.log(`📌 Using backend URL for ${Platform.OS}: ${baseURL}`);
  return baseURL;
};

const API_AUTH_URL = getBackendURL();
export const API_URL = API_AUTH_URL;  // ✅ Now properly exported
```

### Why This Works

**On Android Emulator**:
- Uses `10.0.2.2:3000` (special alias that routes to host machine)
- This is the official Android emulator way to reach localhost

**On iOS Simulator**:
- Uses `localhost:3000` (works directly on iOS)

**On Physical Device**:
- Set `REACT_APP_AUTH_URL=http://192.168.1.x:3000` in `.env.local`
- App will use your network IP instead of localhost

---

## What Backend Endpoints Are Available

✅ **Verified running on `localhost:3000`**:

### Payment Endpoints
```
POST   /api/payments/create-order
POST   /api/payments/verify

GET    /api/admin/charges/:teacherId
POST   /api/admin/charges/set

GET    /api/teacher/earnings/:teacherId
POST   /api/teacher/withdrawal/request
```

### Health Check
```
GET    /health
Response: {"status":"ok","timestamp":"...","service":"VideoSDK Token Server"}
```

---

## Testing Checklist

### ✅ Step 1: Verify Backend is Running
Backend is already listening on port 3000

### ✅ Step 2: Reload Your App
1. Restart the React Native Metro bundler
2. Reload the app (shake phone → select "Reload")
3. Now the app will use `10.0.2.2:3000` on Android

### ✅ Step 3: Test Payment Flow Again
1. Go to **Student Dashboard**
2. Select a teacher
3. Select an available slot
4. Click **Confirm Booking**
5. StudentCheckout screen opens
6. You should **NOT see** "Network request failed" error anymore
7. Pricing should display correctly
8. Click **Pay Now**

### ✅ Step 4: Monitor Logs
Look for these successful messages in React Native debugger:
```javascript
loadCheckoutData()
  ✅ "base_charge_amount": 600
  ✅ "admin_charge_amount": 150
  ✅ "total_amount": 750

handlePayment()
  ✅ "Creating payment order..."
  ✅ "Order created: order_ABC123..."
  ✅ "Opening Razorpay checkout..."

Razorpay
  ✅ Payment modal opens with amount ₹750
  ✅ Enter test card: 4111 1111 1111 1111
  ✅ Click Pay

Backend Verification
  ✅ "Verifying payment..."
  ✅ "Signature verified"
  ✅ "Payment verified successfully!"
  ✅ Navigate back to StudentDashboard
```

---

## If Still Not Working

### Check 1: Device Network
```bash
# Inside Android Emulator, check host connectivity
adb shell ping 10.0.2.2
```
If timeout → Your firewall is blocking port 3000

### Check 2: Firewall Rule
**Windows Firewall** → Allow Node.js through:
1. Windows Defender Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Program → Browse → Select `node.exe`
4. Action → Allow
5. Click Finish

### Check 3: Backend Logs
Look at backend console output for errors like:
```
🔴 Error creating order: ...
🔴 Error verifying payment: ...
```

### Check 4: Hard Reset App
```bash
# Clear all app cache
cd c:\App\App
npm run android

# Watch logs
npx react-native log-android
```

---

## Environment Variables (.env)

If you want to use a **different backend URL**:

```env
# Optional: Override backend URL
REACT_APP_AUTH_URL=http://your-server-ip:3000

# Example for local network:
REACT_APP_AUTH_URL=http://192.168.1.5:3000

# Example for cloud server:
REACT_APP_AUTH_URL=https://api.yourapp.com
```

Then rebuild:
```bash
npm run android
```

---

## Quick Reference

| Platform | Backend URL | Status |
|----------|-------------|--------|
| Android Emulator | `10.0.2.2:3000` | ✅ Fixed |
| iOS Simulator | `localhost:3000` | ✅ Works |
| Physical Device | `192.168.1.x:3000` | 🔧 Needs manual IP |
| Cloud Server | `https://api.yourapp.com` | ✅ Works |

---

## Next Action

1. **Reload the app** in your simulator/device
2. **Try the payment flow again**
3. Check logs for the success messages above
4. Let me know if you still see "Network request failed"

The backend is ready and waiting! 🚀

