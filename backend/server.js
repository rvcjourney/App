/**
 * ==========================================
 * Dynamic Token Generation Server
 * VideoSDK React Native Token Generation
 * ==========================================
 * 
 * This server generates fresh VideoSDK tokens on-demand
 * instead of using hardcoded static tokens.
 * 
 * Benefits:
 * 1. Tokens never expire for active meetings
 * 2. Each meeting gets a fresh token
 * 3. API Key & Secret are kept secure (not exposed in app)
 * 4. Scalable for multiple concurrent meetings
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// Configuration from Environment Variables
// ==========================================

// Get from VideoSDK Dashboard: https://app.videosdk.live/settings
const VIDEOSDK_API_KEY = process.env.VIDEOSDK_API_KEY;
const VIDEOSDK_SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;

// Email Configuration
const EMAIL_USER = process.env.EMAIL_USER || 'your-email@gmail.com';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'your-app-password';
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';

// ==========================================
// Email Configuration Setup
// ==========================================

const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

// Validate configuration
if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET_KEY) {
  console.error('❌ ERROR: Missing VIDEOSDK_API_KEY or VIDEOSDK_SECRET_KEY in .env');
  console.error('Please set these environment variables before starting the server');
  process.exit(1);
}

console.log('✅ VideoSDK Configuration loaded successfully');
console.log(`📌 API Key: ${VIDEOSDK_API_KEY.substring(0, 8)}...`);

// ==========================================
// Token Generation Function
// ==========================================

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via email
 * @param {string} email - User email
 * @param {string} otp - OTP to send
 * @returns {Promise} Email sending promise
 */
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: 'Your Verification OTP - LearnEasy App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E2BFF; text-align: center;">Email Verification</h2>
        <p>Welcome to LearnEasy!</p>
        <p>Your One-Time Password (OTP) for email verification is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <h1 style="color: #1E2BFF; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this verification, please ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Generates a fresh VideoSDK JWT token
 * 
 * @param {string} apiKey - VideoSDK API Key
 * @param {string} secretKey - VideoSDK Secret Key
 * @returns {string} JWT token
 */
function generateVideoSDKToken(apiKey, secretKey) {
  const options = {
    expiresIn: '24h', // Token valid for 24 hours
    algorithm: 'HS256',
  };

  const payload = {
    apikey: apiKey,
    permissions: ['allow_join', 'allow_mod'], // allow_mod = moderator (can end meeting)
  };

  const token = jwt.sign(payload, secretKey, options);
  return token;
}

// ==========================================
// API Endpoints
// ==========================================

/**
 * POST /send-otp
 * 
 * Sends OTP to user email
 * 
 * Request Body:
 * {
 *   "email": "user@example.com"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "OTP sent to email"
 * }
 */
app.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const otp = generateOTP();
    const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP with email
    otpStore.set(email, {
      otp,
      expiryTime,
      attempts: 0,
    });

    // Send OTP via email
    await sendOTPEmail(email, otp);

    console.log(`✅ OTP sent to ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to your email',
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('🔴 Error sending OTP:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
      message: error.message,
    });
  }
});

/**
 * POST /verify-otp
 * 
 * Verifies OTP sent to user email
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "otp": "123456"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "OTP verified successfully"
 * }
 */
app.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required',
      });
    }

    const storedOTPData = otpStore.get(email);

    if (!storedOTPData) {
      return res.status(400).json({
        success: false,
        error: 'OTP not found or expired. Please request a new OTP.',
      });
    }

    // Check if OTP is expired
    if (Date.now() > storedOTPData.expiryTime) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new OTP.',
      });
    }

    // Check attempt limit (max 5 attempts)
    if (storedOTPData.attempts >= 5) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        error: 'Too many failed attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    if (storedOTPData.otp !== otp) {
      storedOTPData.attempts += 1;
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please try again.',
        attemptsRemaining: 5 - storedOTPData.attempts,
      });
    }

    // OTP is valid, remove it from store
    otpStore.delete(email);

    console.log(`✅ OTP verified for ${email}`);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      verified: true,
    });
  } catch (error) {
    console.error('🔴 Error verifying OTP:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP',
      message: error.message,
    });
  }
});

/**
 * GET /get-token
 * 
 * Returns a fresh VideoSDK token
 * 
 * Response:
 * {
 *   "token": "eyJhbGc..."
 * }
 */
app.get('/get-token', (req, res) => {
  try {
    console.log('🔵 Token request received');
    
    const token = generateVideoSDKToken(VIDEOSDK_API_KEY, VIDEOSDK_SECRET_KEY);
    
    console.log('✅ Token generated successfully');
    
    res.json({
      token: token,
      expiresIn: '24h',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('🔴 Error generating token:', error.message);
    res.status(500).json({
      error: 'Failed to generate token',
      message: error.message,
    });
  }
});

/**
 * GET /health
 * 
 * Health check endpoint
 * 
 * Response:
 * {
 *   "status": "ok",
 *   "timestamp": "2026-01-25T10:30:00.000Z"
 * }
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'VideoSDK Token Server',
  });
});

/**
 * POST /validate-token
 * 
 * Validates if a token is valid (optional)
 * 
 * Request Body:
 * {
 *   "token": "eyJhbGc..."
 * }
 * 
 * Response:
 * {
 *   "valid": true,
 *   "decoded": {...}
 * }
 */
app.post('/validate-token', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token is required',
      });
    }

    const decoded = jwt.verify(token, VIDEOSDK_SECRET_KEY);
    
    res.json({
      valid: true,
      decoded: decoded,
      message: 'Token is valid',
    });
  } catch (error) {
    console.error('🔴 Token validation failed:', error.message);
    res.status(400).json({
      valid: false,
      error: 'Invalid token',
      message: error.message,
    });
  }
});

// ==========================================
// Error Handling
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint does not exist',
    availableEndpoints: [
      'POST /send-otp',
      'POST /verify-otp',
      'GET /get-token',
      'GET /health',
      'POST /validate-token',
    ],
  });
});

// ==========================================
// Start Server
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 VideoSDK Token Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log('\n📌 Available Endpoints:');
  console.log(`   POST /send-otp        - Send OTP to email`);
  console.log(`   POST /verify-otp      - Verify OTP`);
  console.log(`   GET  /get-token       - Get fresh token`);
  console.log(`   GET  /health          - Health check`);
  console.log(`   POST /validate-token  - Validate token`);
  console.log('\n💡 Use this in your .env:');
  console.log(`   REACT_APP_AUTH_URL = "http://localhost:${PORT}"`);
  console.log('='.repeat(50) + '\n');
});

module.exports = app;
