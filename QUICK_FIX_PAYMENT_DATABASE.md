# 🚀 Quick Start - Fix Payment Database Issue

## What's Wrong
Database is not being updated when student completes payment. Booking status stays `pending` instead of changing to `confirmed`.

## What to Do

### 1️⃣ Run Diagnostics
Check if backend can connect to database:

```bash
curl http://localhost:3000/api/diagnostics
```

Look for any ❌ (Not set) or errors.

### 2️⃣ Fix Environment Variables

Edit `backend/.env` and make sure you have:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Get it from:**
- Supabase Dashboard → Your Project → Settings → API → Copy "service_role" key
- NOT the "anon" key - must be "service_role"

### 3️⃣ Restart Backend

```bash
cd backend
npm start
```

### 4️⃣ Apply RLS Policies

In Supabase Dashboard:
1. Go to SQL Editor
2. Copy all SQL from: [FIX_BOOKINGS_RLS_UPDATE.sql](FIX_BOOKINGS_RLS_UPDATE.sql)
3. Run it

### 5️⃣ Test Payment

- Student books and pays
- Watch backend logs
- Check if it shows `✅ Booking status updated to confirmed`

### 6️⃣ Verify Teacher Sees It

- Teacher should see booking in 15 seconds
- Or pull-to-refresh

---

## If Still Not Working

Share output from:

```bash
# 1. Diagnostics
curl http://localhost:3000/api/diagnostics

# 2. Check your env file (hide the actual keys)
type backend\.env

# 3. Backend logs when you try payment
(look for errors with "🔴" or "Error")
```

This will help me fix it immediately! 🎯
