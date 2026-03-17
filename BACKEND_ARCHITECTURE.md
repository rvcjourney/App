# Backend Architecture - Authentication & API Integration

## 📋 Overview

The application now uses a **proper backend architecture** where:
- **Mobile App (/App)**: Direct Supabase calls (appropriate for mobile)
- **Admin Panel (/LearningPlatform)**: Backend API calls only
- **Backend (/backend)**: Express server handling all business logic

---

## 🔐 Authentication Flow

### **OLD ARCHITECTURE (INSECURE)** ❌
```
LearningPlatform (Admin Panel)
    ↓
    Direct Supabase Client Keys
    ↓
    Supabase Database

Problem: Database credentials exposed in frontend code
```

### **NEW ARCHITECTURE (SECURE)** ✅
```
LearningPlatform (Admin Panel)
    ↓
    Backend API Calls
    ↓
    /backend/server.js
    ↓
    Supabase (SERVICE_ROLE_KEY - Server Only)
    ↓
    Database

Benefits:
✓ Credentials never exposed to frontend
✓ All auth logic on backend
✓ Rate limiting prevents abuse
✓ Audit trail of all auth attempts
✓ Server-side validation
```

---

## 📍 Backend Authentication Endpoints

### **1. POST /api/auth/signup**

**Purpose**: Create a new super_admin account

**Request Body**:
```json
{
  "fullName": "John Doe",
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "uuid-here",
    "email": "admin@example.com"
  },
  "profile": {
    "id": "uuid-here",
    "full_name": "John Doe",
    "role": "super_admin"
  }
}
```

**Response (Error - 400)**:
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "User already exists"
  }
}
```

**Rate Limit**: 5 attempts per 15 minutes
**Validation**:
- Full name: 2-100 characters, required
- Email: Valid email format, required
- Password: Minimum 6 characters

---

### **2. POST /api/auth/login**

**Purpose**: Login admin with email/password

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "admin@example.com"
  },
  "profile": {
    "id": "uuid-here",
    "full_name": "John Doe",
    "role": "super_admin",
    "email_verified": true
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

**Response (Error - 401)**:
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid email or password"
  }
}
```

**Response (Error - 403 - Not Super Admin)**:
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Only Super Admin can access this platform"
  }
}
```

**Rate Limit**: 10 attempts per 30 minutes
**Validation**:
- Email: Valid email format, required
- Password: Not empty, required
- Server-side: Checks user role is `super_admin`

---

## 🚀 How to Use

### **Admin Panel Signup**

**File**: `LearningPlatform/src/pages/Signup.jsx`

```javascript
// Now uses backend API instead of Supabase directly
const response = await fetch(`${API_URL}/api/auth/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: fullName.trim(),
    email: email.trim(),
    password,
  }),
});
```

### **Admin Panel Login**

**File**: `LearningPlatform/src/context/AuthContext.jsx`

```javascript
// Login via backend API
const response = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: email.trim(),
    password,
  }),
});

// Backend validates super_admin role
// Frontend stores user/profile data
```

### **Environment Configuration**

**File**: `LearningPlatform/.env`

```env
VITE_API_URL=http://localhost:3000          # Dev
# VITE_API_URL=https://api.yourserver.com   # Production
```

---

## 🔒 Security Features

### **1. Server-Side Validation**
- All input validated on backend before processing
- Super_admin role check happens on backend
- Password never sent back to frontend

### **2. Rate Limiting**
- Signup: 5 attempts per 15 minutes per IP
- Login: 10 attempts per 30 minutes per IP
- Prevents brute force attacks

### **3. Secure Credentials**
- Supabase SERVICE_ROLE_KEY used only on backend
- Frontend only uses environment variables for API_URL
- Database credentials never exposed to frontend

### **4. Audit Trail**
- All authentication attempts logged with:
  - Email address
  - Success/failure status
  - Error message (if applicable)
  - Timestamp

---

## 📊 Data Flow Comparison

### **Signup Flow**

```
Frontend: User fills signup form
    ↓
Frontend: Validates input (email format, password length)
    ↓
Frontend: POST /api/auth/signup with email, password, name
    ↓
Backend: Validates input (format, length, etc.)
    ↓
Backend: Checks if email already exists
    ↓
Backend: Creates user in Supabase Auth (SERVICE_ROLE_KEY)
    ↓
Backend: Creates profile in database
    ↓
Backend: Returns user ID, email, profile to frontend
    ↓
Frontend: Shows success message and redirects to login
```

### **Login Flow**

```
Frontend: User enters email/password
    ↓
Frontend: Validates input (not empty)
    ↓
Frontend: POST /api/auth/login
    ↓
Backend: Validates input
    ↓
Backend: Authenticates with Supabase Auth
    ↓
Backend: Fetches user profile
    ↓
Backend: Checks role is super_admin
    ↓
Backend: Returns user/profile/session to frontend
    ↓
Frontend: Stores user and profile in state
    ↓
Frontend: Sets authenticated = true
    ↓
Frontend: Redirects to dashboard
```

---

## 🔄 Other Admin API Endpoints (Unchanged)

The admin panel also uses these backend endpoints for data management:

```
GET  /api/admin/teachers        - List all teachers
POST /api/admin/teachers/:id    - Update teacher
GET  /api/admin/students        - List all students
GET  /api/admin/withdrawals     - Get pending withdrawals
POST /api/admin/withdrawals/:id/approve - Approve withdrawal
GET  /api/admin/analytics       - Dashboard analytics
```

These were already using the backend and remain unchanged.

---

## 📱 Mobile App (Unchanged)

The mobile app (`/App` folder) continues to use:
- Direct Supabase Anon Key calls
- Supabase's built-in session management
- Same VideoSDK token generation endpoint

This is appropriate for mobile apps as they don't expose backend credentials.

---

## ⚙️ Backend Server Requirements

### **Environment Variables** (`backend/.env`)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Video SDK
VIDEOSDK_API_KEY=your_api_key
VIDEOSDK_SECRET_KEY=your_secret_key

# Email (for OTP)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Server
PORT=3000
NODE_ENV=production
```

### **Starting Backend Server**

```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3000
```

---

## 🧪 Testing the New Auth Flow

### **1. Start Backend**
```bash
cd backend
npm start
# Wait for "Server running at http://localhost:3000"
```

### **2. Start Admin Panel**
```bash
cd LearningPlatform
npm install
npm run dev
# Open http://localhost:5173
```

### **3. Test Signup**
- Click "Sign up"
- Enter:
  - Name: "Admin User"
  - Email: "admin@example.com"
  - Password: "Password123"
- Should see success message

### **4. Test Login**
- Enter email and password from signup
- Should authenticate and show dashboard
- Try wrong password - should show error "Invalid email or password"
- Try 11 times in 30 min - should be rate limited

### **5. Verify Backend Logs**
```bash
# Check backend logs for auth attempts
# Should see: "✅ Admin login successful" or "🔴 Login failed"
```

---

## 🐛 Troubleshooting

### **"VITE_API_URL not set" Error**
- Ensure `LearningPlatform/.env` has `VITE_API_URL=http://localhost:3000`
- Restart dev server: `npm run dev`

### **"Failed to connect to backend" Error**
- Check if backend is running on port 3000
- Check if `VITE_API_URL` matches backend URL
- Check firewall allows connections to port 3000

### **"Rate limit exceeded" Error**
- Wait 15 minutes for signup limit to reset
- Wait 30 minutes for login limit to reset

### **"Only Super Admin can access" Error**
- User account was created without super_admin role
- Delete account from Supabase and create new one
- Or manually update `profiles` table to set `role = 'super_admin'`

---

## 📚 Related Files

- **Backend**: `backend/server.js` (lines 449-646)
- **Signup**: `LearningPlatform/src/pages/Signup.jsx`
- **Auth Context**: `LearningPlatform/src/context/AuthContext.jsx`
- **Config**: `LearningPlatform/.env` and `LearningPlatform/.env.example`

---

## ✅ Summary

**Before**: Admin Panel made direct Supabase calls
**After**: Admin Panel calls backend API which handles Supabase

**Benefits**:
- ✓ Credentials secured on backend
- ✓ Rate limiting prevents attacks
- ✓ Server-side validation
- ✓ Audit trail of auth attempts
- ✓ Easier to maintain and audit
- ✓ Proper separation of concerns

**Status**: ✅ Implemented and Tested
