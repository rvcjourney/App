# Backend Quick Improvements Guide

## 🔴 CRITICAL: Secure Exposed Credentials

### Step 1: Add .gitignore Entry
```bash
cd backend
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore
echo "node_modules/" >> .gitignore
```

### Step 2: Create .env.example (Template for Developers)
```bash
cp .env .env.example
```

Then edit `.env.example` to remove sensitive values:

```env
# ==========================================
# SUPABASE CONFIGURATION
# ==========================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ==========================================
# VideoSDK Token Server Configuration
# ==========================================
VIDEOSDK_API_KEY=your_api_key_here
VIDEOSDK_SECRET_KEY=your_secret_key_here

# Razorpay Configuration
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_here

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Server Port
PORT=3000
```

---

## ⚠️ HIGH: Add Input Validation

### Installation
```bash
npm install express-validator
```

### Add to server.js (after line 49)
```javascript
const { body, param, validationResult } = require('express-validator');

// Middleware to handle validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.param, message: e.msg }))
    });
  }
  next();
};
```

### Update /send-otp Endpoint (line 168)
```javascript
app.post('/send-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .trim(),
], validateRequest, async (req, res) => {
  // ... existing code ...
});
```

### Update /verify-otp Endpoint (line 226)
```javascript
app.post('/verify-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .trim(),
  body('otp')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be 6 digits'),
], validateRequest, (req, res) => {
  // ... existing code ...
});
```

### Update /api/payments/create-order Endpoint (line 718)
```javascript
app.post('/api/payments/create-order', [
  body('amount')
    .isInt({ min: 1, max: 1000000 })
    .withMessage('Amount must be between 1 and 1000000'),
  body('email')
    .isEmail()
    .normalizeEmail(),
  body('bookingId')
    .isUUID()
    .withMessage('Invalid booking ID'),
  body('studentId')
    .isUUID()
    .withMessage('Invalid student ID'),
  body('teacherId')
    .isUUID()
    .withMessage('Invalid teacher ID'),
], validateRequest, async (req, res) => {
  // ... existing code ...
});
```

---

## ⚠️ MEDIUM: Add Rate Limiting

### Installation
```bash
npm install express-rate-limit
```

### Add to server.js (after line 49)
```javascript
const rateLimit = require('express-rate-limit');

// Rate limit for OTP (5 attempts per 15 minutes per IP)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many OTP requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for login attempts (10 per 30 minutes)
const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again later',
});

// Rate limit for payments (20 per hour)
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many payment requests, please try again later',
});
```

### Apply Rate Limiters to Endpoints
```javascript
// Update line 168:
app.post('/send-otp', otpLimiter, [
  body('email').isEmail().normalizeEmail(),
], validateRequest, async (req, res) => {
  // ... existing code ...
});

// Update line 226:
app.post('/verify-otp', loginLimiter, [
  body('email').isEmail(),
  body('otp').matches(/^\d{6}$/),
], validateRequest, (req, res) => {
  // ... existing code ...
});

// Update line 718:
app.post('/api/payments/create-order', paymentLimiter, [
  body('amount').isInt({ min: 1 }),
  // ... other validations ...
], validateRequest, async (req, res) => {
  // ... existing code ...
});
```

---

## 🟡 MEDIUM: Structured Logging

### Installation
```bash
npm install winston
```

### Create logger.js
```javascript
// backend/logger.js
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'connectiqo-backend' },
  transports: [
    // Log errors to error.log
    new winston.transports.File({
      filename: path.join(__dirname, 'logs', 'error.log'),
      level: 'error'
    }),
    // Log all messages to combined.log
    new winston.transports.File({
      filename: path.join(__dirname, 'logs', 'combined.log')
    }),
    // Log to console in development
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ]
});

module.exports = logger;
```

### Update server.js to Use Logger
```javascript
const logger = require('./logger');

// Replace all console.log calls:
// OLD: console.log('✅ OTP sent to ${email}: ${otp}');
// NEW:
logger.info('OTP sent', { email, otp });

// Replace all console.error calls:
// OLD: console.error('🔴 Error sending OTP:', error.message);
// NEW:
logger.error('Error sending OTP', { error: error.message, email });

// Create logs directory
const fs = require('fs');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}
```

---

## 🟢 LOW: Standardized Error Responses

### Create error handler (Add after line 49)
```javascript
// Error response standardizer
const sendError = (res, statusCode, errorCode, message, details = {}) => {
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...details
    }
  });
};

// Error codes for client handling
const ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INVALID: 'OTP_INVALID',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  TOKEN_GENERATION_FAILED: 'TOKEN_GENERATION_FAILED',
};
```

### Update error responses
```javascript
// In /send-otp (line 172):
if (!email) {
  return sendError(res, 400, ERROR_CODES.INVALID_REQUEST, 'Email is required');
}

// In /verify-otp (line 239):
if (!storedOTPData) {
  return sendError(res, 400, ERROR_CODES.OTP_EXPIRED, 'OTP not found or expired');
}

// In /api/payments/create-order (line 423):
if (bookingError) {
  return sendError(res, 404, ERROR_CODES.BOOKING_NOT_FOUND, 'Booking not found');
}
```

---

## 🟢 LOW: Move OTP to Database

### Create OTP table in Supabase
```sql
CREATE TABLE otp_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_otp_email ON otp_cache(email);
CREATE INDEX idx_otp_expires ON otp_cache(expires_at);

-- Auto-cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### Update server.js to use database OTP
```javascript
// Replace in-memory otpStore with database:

// OLD (line 35):
// const otpStore = new Map();

// NEW: Function to send OTP (update line 168)
app.post('/send-otp', otpLimiter, [
  body('email').isEmail().normalizeEmail(),
], validateRequest, async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store in database
    const { data, error } = await supabase
      .from('otp_cache')
      .insert([{
        email,
        otp,
        expires_at: expiresAt.toISOString()
      }]);

    if (error) throw error;

    // Send email
    await sendOTPEmail(email, otp);

    logger.info('OTP sent', { email });

    res.json({
      success: true,
      message: 'OTP sent to your email',
      expiresIn: '10 minutes',
    });
  } catch (error) {
    logger.error('Error sending OTP', { error: error.message });
    sendError(res, 500, ERROR_CODES.INVALID_REQUEST, 'Failed to send OTP');
  }
});
```

---

## Testing Improvements

### Installation
```bash
npm install --save-dev jest supertest
```

### Create test file (backend/server.test.js)
```javascript
const request = require('supertest');
const app = require('./server'); // Export app from server.js

describe('API Endpoints', () => {
  describe('POST /send-otp', () => {
    it('should send OTP to valid email', async () => {
      const res = await request(app)
        .post('/send-otp')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/send-otp')
        .send({ email: 'invalid-email' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
```

### Update package.json (line 8)
```json
"test": "jest --runInBand"
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Remove .env from git history
- [ ] Add input validation to all endpoints
- [ ] Implement rate limiting
- [ ] Add structured logging
- [ ] Update error response format
- [ ] Move OTP to database
- [ ] Set up monitoring/alerting
- [ ] Test all endpoints thoroughly
- [ ] Update frontend API_URL for production
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Enable database backups
- [ ] Set up error tracking (Sentry)
- [ ] Document all API endpoints

---

## Quick Command to Start

```bash
cd backend
npm install
npm run dev  # Uses nodemon for auto-restart on changes
```

Then test health check:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-16T12:00:00.000Z",
  "service": "VideoSDK Token Server"
}
```

---

**Status**: Backend is functional and fully compatible with frontend refactoring
**Priority**: Implement security hardening before production deployment
**Estimated Time**: 2-3 hours for all improvements
