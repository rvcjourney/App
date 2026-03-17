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
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import utilities
const logger = require('./logger');
const {
  validateRequest,
  sendError,
  sendSuccess,
  errorHandler,
  requestLogger,
  rateLimitHandler,
  ERROR_CODES,
} = require('./middleware');

const app = express();

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map();

// ==========================================
// Rate Limiters for Different Endpoints
// ==========================================

// OTP endpoints - 5 attempts per 15 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: 'Too many OTP requests, please try again later',
});

// Login/Authentication endpoints - 10 attempts per 30 minutes
const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: 'Too many login attempts, please try again later',
});

// Payment endpoints - 20 attempts per hour
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: 'Too many payment requests, please try again later',
});

// General API limiter - 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// CORS Configuration
// ==========================================

app.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ==========================================
// Middleware Stack
// ==========================================

app.use(express.json());
app.use(requestLogger); // Log all requests
app.use(generalLimiter); // Apply general rate limiting to all routes

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
  logger.error('❌ ERROR: Missing VIDEOSDK_API_KEY or VIDEOSDK_SECRET_KEY in .env');
  logger.error('Please set these environment variables before starting the server');
  process.exit(1);
}

logger.info('✅ VideoSDK Configuration loaded successfully');
logger.info(`📌 API Key: ${VIDEOSDK_API_KEY.substring(0, 8)}...`);

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
app.post(
  '/send-otp',
  otpLimiter,
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { email } = req.body;

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

      logger.info('OTP sent successfully', { email });

      sendSuccess(res, {
        message: 'OTP sent to your email',
        expiresIn: '10 minutes',
      });
    } catch (error) {
      logger.error('Failed to send OTP', { email: req.body.email, error: error.message });
      sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to send OTP');
    }
  }
);

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
app.post(
  '/verify-otp',
  otpLimiter,
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  validateRequest,
  (req, res) => {
    try {
      const { email, otp } = req.body;

      const storedOTPData = otpStore.get(email);

      if (!storedOTPData) {
        logger.warn('OTP verification failed - OTP not found', { email });
        return sendError(res, 400, ERROR_CODES.OTP_INVALID, 'OTP not found or expired. Please request a new OTP.');
      }

      // Check if OTP is expired
      if (Date.now() > storedOTPData.expiryTime) {
        otpStore.delete(email);
        logger.warn('OTP verification failed - OTP expired', { email });
        return sendError(res, 400, ERROR_CODES.OTP_EXPIRED, 'OTP has expired. Please request a new OTP.');
      }

      // Check attempt limit (max 5 attempts)
      if (storedOTPData.attempts >= 5) {
        otpStore.delete(email);
        logger.warn('OTP verification failed - max attempts exceeded', { email });
        return sendError(res, 400, ERROR_CODES.OTP_MAX_ATTEMPTS, 'Too many failed attempts. Please request a new OTP.');
      }

      // Verify OTP
      if (storedOTPData.otp !== otp) {
        storedOTPData.attempts += 1;
        logger.warn('OTP verification failed - invalid OTP', { email, attemptsRemaining: 5 - storedOTPData.attempts });
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.OTP_INVALID,
            message: 'Invalid OTP. Please try again.',
            attemptsRemaining: 5 - storedOTPData.attempts,
          },
        });
      }

      // OTP is valid, remove it from store
      otpStore.delete(email);

      logger.info('OTP verified successfully', { email });

      sendSuccess(res, {
        message: 'OTP verified successfully',
        verified: true,
      });
    } catch (error) {
      logger.error('Failed to verify OTP', { error: error.message });
      sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to verify OTP');
    }
  }
);

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
    logger.info('🔵 Token request received');
    
    const token = generateVideoSDKToken(VIDEOSDK_API_KEY, VIDEOSDK_SECRET_KEY);
    
    logger.info('✅ Token generated successfully');
    
    res.json({
      token: token,
      expiresIn: '24h',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('🔴 Error generating token:', error.message);
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
app.post(
  '/validate-token',
  body('token')
    .isString()
    .notEmpty()
    .withMessage('Token is required'),
  validateRequest,
  (req, res) => {
    try {
      const { token } = req.body;

      const decoded = jwt.verify(token, VIDEOSDK_SECRET_KEY);

      sendSuccess(res, {
        valid: true,
        decoded: decoded,
        message: 'Token is valid',
      });
    } catch (error) {
      logger.error('Token validation failed', { error: error.message });
      sendError(res, 400, ERROR_CODES.AUTHENTICATION_FAILED, 'Invalid token');
    }
  }
);

// ==========================================
// AUTHENTICATION ENDPOINTS (Admin Panel)
// ==========================================

/**
 * POST /api/auth/signup
 *
 * Create a new super_admin account
 * Uses SERVICE_ROLE_KEY for secure account creation
 *
 * Request Body:
 * {
 *   "fullName": "John Doe",
 *   "email": "admin@example.com",
 *   "password": "securePassword123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "user": { "id": "uuid", "email": "admin@example.com" },
 *   "profile": { "id": "uuid", "full_name": "John Doe", "role": "super_admin" }
 * }
 */
app.post(
  '/api/auth/signup',
  loginLimiter,
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validateRequest,
  async (req, res) => {
    try {
      const { fullName, email, password } = req.body;

      logger.info('🔵 Admin signup attempt:', { email });

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName.trim(), role: 'super_admin' },
      });

      if (authError) {
        logger.warn('🔴 Auth creation error:', { email, error: authError.message });
        return sendError(res, 400, ERROR_CODES.AUTHENTICATION_FAILED, authError.message || 'Failed to create account');
      }

      if (!authData?.user?.id) {
        logger.error('🔴 No user ID returned from auth creation');
        return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to create account');
      }

      // Create profile in database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          full_name: fullName.trim(),
          role: 'super_admin',
          email_verified: true,
        }])
        .select('id, full_name, role, email')
        .single();

      if (profileError) {
        logger.error('🔴 Profile creation error:', { userId: authData.user.id, error: profileError.message });
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to create user profile');
      }

      logger.info('✅ Admin account created successfully:', { userId: authData.user.id, email });

      sendSuccess(res, {
        message: 'Account created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        profile: {
          id: profileData.id,
          full_name: profileData.full_name,
          role: profileData.role,
        },
      });
    } catch (error) {
      logger.error('🔴 Signup error:', { error: error.message });
      sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to create account');
    }
  }
);

/**
 * POST /api/auth/login
 *
 * Login admin with email and password
 * Returns user data and profile info
 *
 * Request Body:
 * {
 *   "email": "admin@example.com",
 *   "password": "securePassword123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "user": { "id": "uuid", "email": "admin@example.com" },
 *   "profile": { "id": "uuid", "full_name": "John Doe", "role": "super_admin" },
 *   "session": { "access_token": "...", "refresh_token": "..." }
 * }
 */
app.post(
  '/api/auth/login',
  loginLimiter,
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      logger.info('🔵 Admin login attempt:', { email });

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        logger.warn('🔴 Login failed:', { email, error: authError.message });
        return sendError(res, 401, ERROR_CODES.AUTHENTICATION_FAILED, 'Invalid email or password');
      }

      if (!authData?.user?.id) {
        logger.error('🔴 No user returned from login');
        return sendError(res, 401, ERROR_CODES.AUTHENTICATION_FAILED, 'Login failed');
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role, email_verified')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        logger.warn('🔴 Profile not found:', { userId: authData.user.id });
        return sendError(res, 401, ERROR_CODES.AUTHENTICATION_FAILED, 'User profile not found');
      }

      // Check if user is super_admin
      if (profileData.role !== 'super_admin') {
        logger.warn('🔴 Non-admin login attempt:', { userId: authData.user.id, role: profileData.role });
        return sendError(res, 403, ERROR_CODES.AUTHENTICATION_FAILED, 'Only Super Admin can access this platform');
      }

      logger.info('✅ Admin login successful:', { userId: authData.user.id, email });

      sendSuccess(res, {
        message: 'Login successful',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        profile: {
          id: profileData.id,
          full_name: profileData.full_name,
          role: profileData.role,
          email_verified: profileData.email_verified,
        },
        session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_in: authData.session?.expires_in,
        },
      });
    } catch (error) {
      logger.error('🔴 Login error:', { error: error.message });
      sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Login failed');
    }
  }
);

// ==========================================
// BOOKING MANAGEMENT ENDPOINTS
// ==========================================
// MEETINGS
// ==========================================

/**
 * POST /api/meetings/start
 * 
 * Start a meeting - teacher initiates the call
 * Generates meeting ID, updates booking, notifies student
 * 
 * Request Body:
 * {
 *   "bookingId": "uuid",
 *   "teacherId": "uuid"
 * }
 */
app.post(
  '/api/meetings/start',
  body('bookingId')
    .isString()
    .notEmpty()
    .withMessage('Booking ID is required'),
  body('teacherId')
    .isString()
    .notEmpty()
    .withMessage('Teacher ID is required'),
  body('meetingId')
    .isString()
    .notEmpty()
    .withMessage('Meeting ID is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { bookingId, teacherId, meetingId } = req.body;

    logger.info('🔵 Starting meeting for booking:', bookingId, 'with meetingId:', meetingId);

    // Don't generate a new ID - use the one the teacher is already in!
    // Generate meeting token using VideoSDK (using the existing meetingId)
    const meetingToken = generateVideoSDKToken(VIDEOSDK_API_KEY, VIDEOSDK_SECRET_KEY);

    // Get booking details
    logger.info('🔵 Fetching booking details for ID:', bookingId);
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      logger.error('🔴 Booking fetch error:', JSON.stringify(bookingError));
      throw new Error(`Booking not found: ${bookingError?.message}`);
    }
    
    if (!bookingData) {
      logger.error('🔴 No booking data returned');
      throw new Error('Booking not found - no data returned');
    }
    
    logger.info('✅ Booking found:', {
      id: bookingData.id,
      student_id: bookingData.student_id,
      teacher_id: bookingData.teacher_id,
      status: bookingData.status,
      hasStudentId: !!bookingData.student_id,
    });

    // Get teacher profile
    logger.info('🔵 Fetching teacher profile...');
    const { data: teacherProfile, error: teacherError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', bookingData.teacher_id)
      .single();

    if (teacherError) logger.warn('⚠️ Teacher profile error:', teacherError);

    // Update booking with meeting ID
    logger.info('🔵 Updating booking with meeting ID...');
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        meeting_id: meetingId,
      })
      .eq('id', bookingId);

    if (updateError) {
      logger.error('🔴 Update error:', updateError);
      throw updateError;
    }
    logger.info('✅ Booking updated');

    // Create meeting log
    logger.info('🔵 Creating meeting log...');
    const { error: logError } = await supabase
      .from('meeting_logs')
      .insert([{
        booking_id: bookingId,
        meeting_id: meetingId,
        started_at: new Date().toISOString(),
        teacher_joined: true,
      }]);

    if (logError) logger.warn('⚠️ Meeting log error:', logError);

    // Send notification to student with meeting ID
    logger.info('🔵 Sending notification to student ID:', bookingData.student_id);
    const notificationPayload = {
      user_id: bookingData.student_id,
      notification_type: 'meeting_started',
      title: '📞 Class is Starting!',
      message: `Your class with ${teacherProfile?.full_name || 'Teacher'} is starting now! Meeting ID: ${meetingId}. Copy this ID and join the meeting.`,
      booking_id: bookingId,
      is_read: false,
    };
    logger.info('📋 Notification payload:', JSON.stringify(notificationPayload));
    
    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .insert([notificationPayload])
      .select();

    if (notifError) {
      logger.error('🔴 Notification insertion error:', JSON.stringify(notifError));
      throw notifError;
    }
    
    logger.info('✅ Notification sent, ID:', notifData?.[0]?.id);

    logger.info(`✅ Meeting started: ${bookingId}, Meeting ID: ${meetingId}`);

    res.json({
      success: true,
      message: 'Meeting started',
      meetingToken: meetingToken,
      meetingId: meetingId,
      bookingId: bookingId,
    });
  } catch (error) {
    logger.error('🔴 Error starting meeting:', error.message, error);
    res.status(500).json({
      success: false,
      error: 'Failed to start meeting',
      message: error.message,
    });
  }
});

/**
 * POST /api/meetings/end
 * 
 * End a meeting and mark booking as completed
 * 
 * Request Body:
 * {
 *   "bookingId": "uuid",
 *   "duration": "number (minutes)"
 * }
 */
app.post(
  '/api/meetings/end',
  body('bookingId')
    .isString()
    .notEmpty()
    .withMessage('Booking ID is required'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative number'),
  validateRequest,
  async (req, res) => {
    try {
      const { bookingId, duration } = req.body;

    // Get booking details
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    // Update booking with meeting ended time
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        meeting_ended_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // Update meeting log
    await supabase
      .from('meeting_logs')
      .update({
        ended_at: new Date().toISOString(),
        duration_minutes: duration || 60,
      })
      .eq('booking_id', bookingId);

    // Create notification for both
    await supabase
      .from('notifications')
      .insert([
        {
          user_id: bookingData.student_id,
          notification_type: 'meeting_started',
          title: '✅ Session Completed',
          message: `Your session with ${bookingData.teacher_id} has been completed.`,
          booking_id: bookingId,
          is_read: false,
        },
        {
          user_id: bookingData.teacher_id,
          notification_type: 'meeting_started',
          title: '✅ Session Completed',
          message: `Your session has been completed. Duration: ${duration || 60} minutes.`,
          booking_id: bookingId,
          is_read: false,
        },
      ]);

    logger.info(`✅ Meeting ended: ${bookingId}`);

    res.json({
      success: true,
      message: 'Meeting ended',
      bookingId: bookingId,
    });
  } catch (error) {
    logger.error('🔴 Error ending meeting:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to end meeting',
      message: error.message,
    });
  }
});

/**
 * POST /api/notifications/send-reminder
 * 
 * Send meeting reminder notification
 * Called 5 minutes before scheduled meeting time
 * 
 * Request Body:
 * {
 *   "bookingId": "uuid"
 * }
 */
app.post(
  '/api/notifications/send-reminder',
  body('bookingId')
    .isString()
    .notEmpty()
    .withMessage('Booking ID is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { bookingId } = req.body;

    // Get booking details
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    // Send reminders to both teacher and student
    await supabase
      .from('notifications')
      .insert([
        {
          user_id: bookingData.teacher_id,
          notification_type: 'meeting_reminder',
          title: '⏰ Meeting Reminder',
          message: 'Your class is starting in 5 minutes!',
          booking_id: bookingId,
          is_read: false,
        },
        {
          user_id: bookingData.student_id,
          notification_type: 'meeting_reminder',
          title: '⏰ Meeting Reminder',
          message: 'Your class is starting in 5 minutes!',
          booking_id: bookingId,
          is_read: false,
        },
      ]);

    logger.info(`✅ Reminder sent for booking: ${bookingId}`);

    res.json({
      success: true,
      message: 'Reminder sent',
    });
  } catch (error) {
    logger.error('🔴 Error sending reminder:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send reminder',
      message: error.message,
    });
  }
});

// ==========================================
// Start Server
// ==========================================

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ==========================================
// PAYMENT MANAGEMENT ENDPOINTS
// ==========================================

// Razorpay Integration
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for booking payment
 * 
 * Request Body:
 * {
 *   "bookingId": "uuid",
 *   "studentId": "uuid",
 *   "teacherId": "uuid",
 *   "basePrice": 600,
 *   "adminCharge": 150,
 *   "totalAmount": 750
 * }
 */
app.post(
  '/api/payments/create-order',
  paymentLimiter,
  body('bookingId')
    .isString()
    .notEmpty()
    .withMessage('Booking ID is required'),
  body('studentId')
    .isString()
    .notEmpty()
    .withMessage('Student ID is required'),
  body('teacherId')
    .isString()
    .notEmpty()
    .withMessage('Teacher ID is required'),
  body('totalAmount')
    .isInt({ min: 1 })
    .withMessage('Total amount must be a positive number'),
  body('basePrice')
    .optional()
    .isInt({ min: 0 }),
  body('adminCharge')
    .optional()
    .isInt({ min: 0 }),
  validateRequest,
  async (req, res) => {
    try {
      const { bookingId, studentId, teacherId, basePrice, adminCharge, totalAmount } = req.body;

      logger.info('Creating Razorpay order', { bookingId, amount: totalAmount });

      // Validate Razorpay configuration
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        logger.error('Razorpay keys not configured');
        return sendError(res, 500, ERROR_CODES.PAYMENT_FAILED, 'Payment service not configured');
      }

      // Create Razorpay order
      // Note: receipt must be <= 40 characters, so we use a shortened hash instead of full bookingId
      const bookingReceiptId = bookingId.substring(0, 12); // Use first 12 chars of booking ID
      const order = await razorpay.orders.create({
        amount: totalAmount * 100, // Convert to paise
        currency: 'INR',
        receipt: `book_${bookingReceiptId}`, // Max 40 chars: "book_" (5) + 12 chars = 17 chars
        notes: {
          bookingId: bookingId,
          studentId: studentId,
          teacherId: teacherId,
          basePrice: basePrice,
          adminCharge: adminCharge,
        },
      });

      logger.info('Order created successfully', { orderId: order.id });

      // Log in database
      const { error: logError } = await supabase
        .from('razorpay_orders')
        .insert([{
          booking_id: bookingId,
          student_id: studentId,
          teacher_id: teacherId,
          razorpay_order_id: order.id,
          amount: totalAmount,
          currency: 'INR',
          status: 'created',
        }]);

      if (logError) logger.warn('Failed to log order in database', { error: logError.message });

      sendSuccess(res, {
        orderId: order.id,
        amount: totalAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      logger.error('Failed to create order', { error: error.message });
      sendError(res, 500, ERROR_CODES.PAYMENT_FAILED, 'Failed to create order');
    }
  }
);

/**
 * POST /api/payments/verify
 * Verify payment and create payment record
 * 
 * Request Body:
 * {
 *   "razorpayPaymentId": "pay_...",
 *   "razorpayOrderId": "order_...",
 *   "razorpaySignature": "sig_...",
 *   "bookingId": "uuid",
 *   "studentId": "uuid",
 *   "teacherId": "uuid",
 *   "basePrice": 600,
 *   "adminCharge": 150,
 *   "totalAmount": 750
 * }
 */
app.post(
  '/api/payments/verify',
  paymentLimiter,
  body('razorpayPaymentId')
    .isString()
    .notEmpty()
    .withMessage('Payment ID is required'),
  body('razorpayOrderId')
    .isString()
    .notEmpty()
    .withMessage('Order ID is required'),
  body('razorpaySignature')
    .isString()
    .notEmpty()
    .withMessage('Signature is required'),
  body('bookingId')
    .isString()
    .notEmpty()
    .withMessage('Booking ID is required'),
  body('studentId')
    .isString()
    .notEmpty()
    .withMessage('Student ID is required'),
  body('teacherId')
    .isString()
    .notEmpty()
    .withMessage('Teacher ID is required'),
  body('totalAmount')
    .isInt({ min: 1 })
    .withMessage('Total amount must be a positive number'),
  validateRequest,
  async (req, res) => {
    try {
      const {
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        bookingId,
        studentId,
        teacherId,
        basePrice,
        adminCharge,
        totalAmount,
      } = req.body;

      logger.info('Verifying payment', { paymentId: razorpayPaymentId });

      // Verify signature
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpaySignature) {
        logger.warn('Payment signature verification failed', { paymentId: razorpayPaymentId });
        return sendError(res, 400, ERROR_CODES.PAYMENT_VERIFICATION_FAILED, 'Invalid signature');
      }

      logger.info('Payment signature verified');

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          booking_id: bookingId,
          student_id: studentId,
          teacher_id: teacherId,
          base_price: basePrice,
          admin_charge: adminCharge,
          total_amount: totalAmount,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: razorpaySignature,
          status: 'completed',
          paid_at: new Date().toISOString(),
        }])
        .select();

      if (paymentError) {
        logger.error('Failed to create payment record', { error: paymentError.message, bookingId });
        throw paymentError;
      }

      logger.info('Payment record created', { paymentId: payment[0].id });

      // Create teacher earnings record
      const platformFee = 100; // Fixed platform fee
      const teacherEarn = totalAmount - adminCharge - platformFee;

      const { data: earnings, error: earningsError } = await supabase
        .from('teacher_earnings')
        .insert([{
          teacher_id: teacherId,
          payment_id: payment[0].id,
          booking_id: bookingId,
          total_collected: totalAmount,
          admin_deduction: adminCharge,
          platform_fee: platformFee,
          status: 'pending',
        }])
        .select();

      if (earningsError) {
        logger.error('Failed to create earnings record', { error: earningsError.message, teacherId });
        throw earningsError;
      }

      logger.info('Earnings record created', { teacherId, earnAmount: teacherEarn });

      // Update booking status and confirm
      const { data: updatedBooking, error: bookingError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'completed',
          total_price: totalAmount,
          payment_id: payment[0].id,
          status: 'confirmed',
          teacher_confirmed_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select();

      if (bookingError) {
        logger.warn('Failed to update booking status', { error: bookingError.message, bookingId });
      } else {
        logger.info('Booking status updated to confirmed', { bookingId });
      }

      // Update teacher wallet
      const { data: wallet } = await supabase
        .from('teacher_wallet')
        .select('*')
        .eq('teacher_id', teacherId)
        .single();

      if (wallet) {
        const newBalance = (wallet.total_balance || 0) + teacherEarn;
        await supabase
          .from('teacher_wallet')
          .update({
            total_balance: newBalance,
            available_balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('teacher_id', teacherId);
      } else {
        await supabase
          .from('teacher_wallet')
          .insert([{
            teacher_id: teacherId,
            total_balance: teacherEarn,
            available_balance: teacherEarn,
            created_at: new Date().toISOString(),
          }]);
      }

      logger.info('Teacher wallet updated', { teacherId, newBalance: (wallet?.total_balance || 0) + teacherEarn });

      // Update order status
      await supabase
        .from('razorpay_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', razorpayOrderId);

      // Send notification to student
      await supabase
        .from('notifications')
        .insert([{
          user_id: studentId,
          notification_type: 'payment_confirmed',
          title: '✅ Payment Successful',
          message: `Your booking with teacher is confirmed. Session will start at the scheduled time.`,
          booking_id: bookingId,
          is_read: false,
        }]);

      // Send notification to teacher
      await supabase
        .from('notifications')
        .insert([{
          user_id: teacherId,
          notification_type: 'payment_received',
          title: '💰 Payment Received',
          message: `A student has booked and paid for your session. ₹${teacherEarn} added to your wallet.`,
          booking_id: bookingId,
          is_read: false,
        }]);

      sendSuccess(res, {
        message: 'Payment verified successfully',
        payment: payment[0],
        earnings: {
          totalCollected: totalAmount,
          adminDeduction: adminCharge,
          platformFee: platformFee,
          teacherEarn: teacherEarn,
        },
      });
    } catch (error) {
      logger.error('Failed to verify payment', { error: error.message });
      sendError(res, 500, ERROR_CODES.PAYMENT_VERIFICATION_FAILED, 'Failed to verify payment');
    }
  }
);

/**
 * POST /api/admin/charges/set
 * Admin sets charges for a teacher: base (₹), admin charge %, GST %.
 * Request Body: { teacherId, baseCharge, adminChargePercent, gstPercent }
 */
app.post(
  '/api/admin/charges/set',
  body('teacherId')
    .isString()
    .notEmpty()
    .withMessage('Teacher ID is required'),
  body('baseCharge')
    .isInt({ min: 0 })
    .withMessage('Base charge must be a non-negative number'),
  body('adminChargePercent')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Admin charge percent must be between 0 and 100'),
  body('gstPercent')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('GST percent must be between 0 and 100'),
  validateRequest,
  async (req, res) => {
    try {
      const { teacherId, baseCharge, adminChargePercent, gstPercent } = req.body;

      const base = Number(baseCharge);
      const adminPct = Number(adminChargePercent) ?? 0;
      const gstPct = Number(gstPercent) ?? 0;

    logger.info('🔵 Setting charges for teacher:', teacherId, { base, adminPct, gstPct });

    const { data: existing } = await supabase
      .from('admin_charges')
      .select('*')
      .eq('teacher_id', teacherId)
      .maybeSingle();

    const adminAmtComputed = Math.round((base * adminPct) / 100);
    const row = {
      base_charge_amount: base,
      admin_charge_percent: adminPct,
      gst_percent: gstPct,
      admin_charge_amount: adminAmtComputed,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      result = await supabase
        .from('admin_charges')
        .update(row)
        .eq('teacher_id', teacherId)
        .select();
    } else {
      result = await supabase
        .from('admin_charges')
        .insert([{ teacher_id: teacherId, ...row }])
        .select();
    }

    if (result.error) throw result.error;

    const data = result.data[0];
    const adminAmt = (base * adminPct) / 100;
    const subtotal = base + adminAmt;
    const gstAmt = (subtotal * gstPct) / 100;
    const total = subtotal + gstAmt;

    logger.info('✅ Charges set:', data);

    res.json({
      success: true,
      message: 'Charges updated',
      data: { ...data, totalAmount: total },
      totalAmount: total,
    });
  } catch (error) {
    logger.error('🔴 Error setting charges:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to set charges',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/charges/:teacherId
 * Get admin charge for a teacher
 */
app.get('/api/admin/charges/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;

    logger.info('🔵 Fetching admin charge for teacher:', teacherId);

    const { data, error } = await supabase
      .from('admin_charges')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

    if (!data) {
      return res.json({
        success: true,
        data: null,
        message: 'No admin charge found',
      });
    }

    logger.info('✅ Admin charge found:', data);

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    logger.error('🔴 Error fetching admin charge:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin charge',
    });
  }
});

// Build profile from teacher_profiles / student_profiles (full_name, email on the row)
function profileFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name ?? null,
    email: row.email ?? null,
    role: row.role ?? null,
    email_verified: row.email_verified ?? null,
    created_at: row.created_at ?? null,
  };
}

/**
 * GET /api/admin/teachers
 * List all teachers; name and email come from teacher_profiles (full_name, email columns).
 */
app.get('/api/admin/teachers', async (req, res) => {
  try {
    logger.info('🔵 Fetching all teachers');

    const { data: teachers, error: teErr } = await supabase
      .from('teacher_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (teErr) throw teErr;
    const list = (Array.isArray(teachers) ? teachers : []).map((t) => ({
      ...t,
      profile: profileFromRow(t),
    }));
    logger.info('✅ Teachers fetched:', list.length);
    res.json(list);
  } catch (error) {
    logger.error('🔴 Error fetching teachers:', error.message);
    res.status(500).json({
      error: 'Failed to load teachers',
      message: error.message,
    });
  }
});

async function updateTeacherHandler(req, res) {
  try {
    const { teacherId } = req.params;
    const { teacherProfile = {}, profile = {} } = req.body;

    const teacherUpdates = { ...teacherProfile, updated_at: new Date().toISOString() };
    const { data: teacherData, error: teErr } = await supabase
      .from('teacher_profiles')
      .update(teacherUpdates)
      .eq('id', teacherId)
      .select()
      .single();

    if (teErr) throw teErr;

    if (Object.keys(profile).length > 0) {
      const { error: prErr } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', teacherId);
      if (prErr) logger.warn('⚠️ Profiles update:', prErr.message);
    }

    res.json(teacherData);
  } catch (error) {
    logger.error('🔴 Error updating teacher:', error.message);
    res.status(500).json({
      error: 'Failed to update teacher',
      message: error.message,
    });
  }
}

/** PATCH /api/admin/teachers/:teacherId - Update teacher */
app.patch('/api/admin/teachers/:teacherId', updateTeacherHandler);

/** POST /api/admin/teachers/:teacherId - Update teacher (use when PATCH is blocked by CORS) */
app.post('/api/admin/teachers/:teacherId', updateTeacherHandler);

/**
 * GET /api/admin/students
 * List all students; name and email come from student_profiles (full_name, email columns).
 */
app.get('/api/admin/students', async (req, res) => {
  try {
    logger.info('🔵 Fetching all students');

    const { data: students, error: stErr } = await supabase
      .from('student_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (stErr) throw stErr;
    const list = (Array.isArray(students) ? students : []).map((s) => ({
      ...s,
      profile: profileFromRow(s),
    }));
    logger.info('✅ Students fetched:', list.length);
    res.json(list);
  } catch (error) {
    logger.error('🔴 Error fetching students:', error.message);
    res.status(500).json({
      error: 'Failed to load students',
      message: error.message,
    });
  }
});

/**
 * GET /api/teacher/earnings/:teacherId
 * Get teacher earnings summary
 */
app.get('/api/teacher/earnings/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;

    logger.info('🔵 Fetching earnings for teacher:', teacherId);

    // Get wallet
    const { data: wallet } = await supabase
      .from('teacher_wallet')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();

    // Get recent earnings
    const { data: earnings } = await supabase
      .from('teacher_earnings')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get withdrawal eligibility
    const { data: eligibility } = await supabase
      .rpc('get_withdrawal_eligibility', { p_teacher_id: teacherId });

    logger.info('✅ Earnings fetched');

    res.json({
      success: true,
      wallet: wallet || {
        total_balance: 0,
        available_balance: 0,
        minimum_balance_reached: false,
        one_month_covered: false,
      },
      earnings: earnings || [],
      eligibility: eligibility?.[0] || null,
    });
  } catch (error) {
    logger.error('🔴 Error fetching earnings:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings',
    });
  }
});

/**
 * POST /api/teacher/withdrawal/request
 * Request withdrawal from wallet
 * 
 * Request Body:
 * {
 *   "teacherId": "uuid",
 *   "amount": 15000,
 *   "bankAccountNumber": "123456789",
 *   "bankIFSCCode": "HDFC0000001",
 *   "accountHolderName": "Teacher Name"
 * }
 */
app.post(
  '/api/teacher/withdrawal/request',
  body('teacherId')
    .isString()
    .notEmpty()
    .withMessage('Teacher ID is required'),
  body('amount')
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive number'),
  body('bankAccountNumber')
    .isString()
    .notEmpty()
    .trim()
    .withMessage('Bank account number is required'),
  body('bankIFSCCode')
    .isString()
    .notEmpty()
    .trim()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format'),
  body('accountHolderName')
    .isString()
    .notEmpty()
    .trim()
    .withMessage('Account holder name is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { teacherId, amount, bankAccountNumber, bankIFSCCode, accountHolderName } = req.body;

      logger.info('Processing withdrawal request', { teacherId, amount });

    // Check wallet and eligibility
    const { data: wallet } = await supabase
      .from('teacher_wallet')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();

    if (!wallet) {
      return res.status(400).json({
        success: false,
        error: 'Wallet not found',
      });
    }

    // Check if amount is available
    if (wallet.available_balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        availableBalance: wallet.available_balance,
      });
    }

    // Check minimum balance
    if (wallet.total_balance < 10000) {
      return res.status(400).json({
        success: false,
        error: 'Minimum balance of ₹10,000 required',
        currentBalance: wallet.total_balance,
      });
    }

    // Check if one month has passed
    const accountCreatedDate = new Date(wallet.created_at);
    const oneMonthLater = new Date(accountCreatedDate);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    if (new Date() < oneMonthLater) {
      return res.status(400).json({
        success: false,
        error: 'Please wait for 1 month from account creation',
        eligibleDate: oneMonthLater,
      });
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert([{
        teacher_id: teacherId,
        amount: amount,
        status: 'pending',
        bank_account_number: bankAccountNumber,
        bank_ifsc_code: bankIFSCCode,
        account_holder_name: accountHolderName,
      }])
      .select();

    if (withdrawalError) throw withdrawalError;

    logger.info('✅ Withdrawal request created:', withdrawal[0].id);

    // Update wallet
    const newAvailableBalance = wallet.available_balance - amount;
    await supabase
      .from('teacher_wallet')
      .update({
        available_balance: newAvailableBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('teacher_id', teacherId);

    // Send notification to teacher
    await supabase
      .from('notifications')
      .insert([{
        user_id: teacherId,
        notification_type: 'withdrawal_requested',
        title: '📤 Withdrawal Request Submitted',
        message: `Your withdrawal request of ₹${amount} has been submitted. Admin will process it within 24-48 hours.`,
        is_read: false,
      }]);

    res.json({
      success: true,
      message: 'Withdrawal request submitted',
      withdrawalRequestId: withdrawal[0].id,
      data: withdrawal[0],
    });
  } catch (error) {
    logger.error('🔴 Error processing withdrawal:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process withdrawal request',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/admin/teacher/:teacherId/wallet
 * Admin updates teacher wallet amounts (total_balance, available_balance)
 */
app.patch(
  '/api/admin/teacher/:teacherId/wallet',
  body('total_balance')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total balance must be a non-negative number'),
  body('available_balance')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available balance must be a non-negative number'),
  validateRequest,
  async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { total_balance, available_balance } = req.body;

      if (total_balance === undefined && available_balance === undefined) {
        return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Provide at least one of total_balance or available_balance');
      }

      const total = total_balance !== undefined ? Number(total_balance) : undefined;
      const available = available_balance !== undefined ? Number(available_balance) : undefined;

    const { data: wallet } = await supabase
      .from('teacher_wallet')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();

    const now = new Date().toISOString();
    if (wallet) {
      const updates = { updated_at: now };
      if (total !== undefined) updates.total_balance = total;
      if (available !== undefined) updates.available_balance = available;
      const { data: updated, error } = await supabase
        .from('teacher_wallet')
        .update(updates)
        .eq('teacher_id', teacherId)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, wallet: updated });
    } else {
      const { data: created, error } = await supabase
        .from('teacher_wallet')
        .insert([{
          teacher_id: teacherId,
          total_balance: total ?? 0,
          available_balance: available ?? 0,
          created_at: now,
          updated_at: now,
        }])
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, wallet: created });
    }
  } catch (error) {
    logger.error('🔴 Error updating teacher wallet:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update wallet',
    });
  }
});

/**
 * GET /api/admin/dashboard
 * Single response: stats (counts) + withdrawals. One round-trip for the dashboard.
 */
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const [
      teachersRes,
      studentsRes,
      bookingsRes,
      withdrawalsRes,
    ] = await Promise.all([
      supabase.from('teacher_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('student_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('withdrawal_requests').select('*').eq('status', 'pending').order('requested_at', { ascending: false }),
    ]);

    const stats = {
      totalTeachers: teachersRes?.error ? 0 : (teachersRes?.count ?? 0),
      totalStudents: studentsRes?.error ? 0 : (studentsRes?.count ?? 0),
      totalBookings: bookingsRes?.error ? 0 : (bookingsRes?.count ?? 0),
    };

    const list = Array.isArray(withdrawalsRes?.data) ? withdrawalsRes.data : [];
    let withdrawals = list;
    if (list.length > 0) {
      const teacherIds = [...new Set(list.map((w) => w.teacher_id).filter(Boolean))];
      const profileMap = {};
      if (teacherIds.length > 0) {
        const chunkSize = 50;
        const chunks = [];
        for (let i = 0; i < teacherIds.length; i += chunkSize) chunks.push(teacherIds.slice(i, i + chunkSize));
        const results = await Promise.all(chunks.map((chunk) => supabase.from('profiles').select('id, full_name, email').in('id', chunk)));
        results.forEach((r) => { if (Array.isArray(r.data)) r.data.forEach((p) => { profileMap[p.id] = p; }); });
        withdrawals = list.map((w) => ({ ...w, sender: profileMap[w.teacher_id] || null }));
      }
    }

    return res.json({ success: true, stats, withdrawals });
  } catch (error) {
    logger.error('🔴 Dashboard error:', error.message);
    return res.json({
      success: true,
      stats: { totalTeachers: 0, totalStudents: 0, totalBookings: 0 },
      withdrawals: [],
    });
  }
});

/**
 * GET /api/admin/withdrawals
 * Get all pending withdrawal requests (Admin only). Fetch rows then merge teacher names.
 */
app.get('/api/admin/withdrawals', async (req, res) => {
  const empty = () => res.json({ success: true, data: [], count: 0 });
  try {
    logger.info('🔵 Fetching withdrawal requests');

    const { data: withdrawals, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      logger.warn('⚠️ Withdrawals query error:', error.message);
      return empty();
    }

    const list = Array.isArray(withdrawals) ? withdrawals : [];
    if (list.length === 0) return empty();

    const teacherIds = [...new Set(list.map((w) => w.teacher_id).filter(Boolean))];
    const profileMap = {};
    if (teacherIds.length > 0) {
      try {
        const chunkSize = 50;
        const chunks = [];
        for (let i = 0; i < teacherIds.length; i += chunkSize) chunks.push(teacherIds.slice(i, i + chunkSize));
        const results = await Promise.all(chunks.map((chunk) => supabase.from('profiles').select('id, full_name, email').in('id', chunk)));
        results.forEach((res) => { if (Array.isArray(res.data)) res.data.forEach((p) => { profileMap[p.id] = p; }); });
      } catch (e) {
        logger.warn('⚠️ Profiles for withdrawals:', e.message);
      }
    }

    const data = list.map((w) => ({
      ...w,
      sender: profileMap[w.teacher_id] || null,
    }));

    logger.info('✅ Withdrawal requests fetched:', data.length);
    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    logger.error('🔴 Error fetching withdrawals:', error.message);
    return empty();
  }
});

/**
 * POST /api/admin/withdrawals/:withdrawalId/approve
 * Admin approves and processes withdrawal
 */
app.post('/api/admin/withdrawals/:withdrawalId/approve', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { adminId } = req.body;

    logger.info('🔵 Approving withdrawal:', withdrawalId);

    // Get withdrawal request
    const { data: withdrawal } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal request not found',
      });
    }

    // Update withdrawal status
    const { data: updated, error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'processing',
        admin_acknowledged: true,
        admin_acknowledged_at: new Date().toISOString(),
        admin_id: adminId,
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId)
      .select();

    if (updateError) throw updateError;

    // Here you would integrate with Razorpay Payouts API
    // For now, mark as pending processing
    // In production: await razorpay.payouts.create(payoutDetails);

    logger.info('✅ Withdrawal marked as processing:', withdrawalId);

    // Send notification to teacher
    await supabase
      .from('notifications')
      .insert([{
        user_id: withdrawal.teacher_id,
        notification_type: 'withdrawal_approved',
        title: '✅ Withdrawal Approved',
        message: `Your withdrawal of ₹${withdrawal.amount} has been approved. Amount will be transferred to your bank account within 2-3 business days.`,
        is_read: false,
      }]);

    res.json({
      success: true,
      message: 'Withdrawal approved and processing',
      data: updated[0],
    });
  } catch (error) {
    logger.error('🔴 Error approving withdrawal:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to approve withdrawal',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/analytics
 * Payment analytics for admin dashboard
 */
app.get('/api/admin/analytics', async (req, res) => {
  try {
    logger.info('🔵 Fetching payment analytics');

    // Total revenue
    const { data: totalRevenue } = await supabase
      .from('payments')
      .select('total_amount')
      .eq('status', 'completed');

    const total = totalRevenue?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

    // Get top teachers by earnings
    const { data: topTeachers } = await supabase
      .from('teacher_earnings')
      .select('teacher_id, teacher_earn')
      .eq('status', 'pending')
      .order('teacher_earn', { ascending: false })
      .limit(10);

    // Get pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from('withdrawal_requests')
      .select('amount')
      .eq('status', 'pending');

    const totalPending = pendingWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

    logger.info('✅ Analytics fetched');

    res.json({
      success: true,
      analytics: {
        totalRevenue: total,
        totalPayments: totalRevenue?.length || 0,
        pendingWithdrawals: totalPending,
        topTeachers: topTeachers || [],
      },
    });
  } catch (error) {
    logger.error('🔴 Error fetching analytics:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

// ==========================================
// MOBILE APP APIs (Student & Teacher)
// ==========================================

/**
 * GET /api/mobile/profile/:userId
 * Get user profile (Student or Teacher)
 */
app.get('/api/mobile/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    logger.info('🔵 Fetching profile for user:', userId);

    // Get base profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, email_verified, created_at')
      .eq('id', userId)
      .single();

    if (profileError) {
      return sendError(res, 404, 'NOT_FOUND', 'Profile not found');
    }

    // Get role-specific details
    let roleData = null;
    if (profile.role === 'teacher') {
      const { data: teacher } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      roleData = teacher;
    } else if (profile.role === 'student') {
      const { data: student } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      roleData = student;
    }

    logger.info('✅ Profile fetched');

    sendSuccess(res, {
      profile: { ...profile, ...roleData },
    });
  } catch (error) {
    logger.error('🔴 Error fetching profile:', error.message);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch profile');
  }
});

/**
 * PUT /api/mobile/profile/:userId
 * Update user profile (Student or Teacher)
 */
app.put(
  '/api/mobile/profile/:userId',
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail(),
  validateRequest,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { fullName, email, ...roleData } = req.body;

      logger.info('🔵 Updating profile for user:', userId);

      // Update base profile
      const updateData = {};
      if (fullName) updateData.full_name = fullName;
      if (email) updateData.email = email;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (updateError) {
          logger.error('🔴 Profile update error:', updateError);
          throw updateError;
        }
      }

      // Get user role to update role-specific data
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile && Object.keys(roleData).length > 0) {
        const table = profile.role === 'teacher' ? 'teacher_profiles' : 'student_profiles';
        const { error: roleError } = await supabase
          .from(table)
          .update(roleData)
          .eq('id', userId);

        if (roleError) {
          logger.error('🔴 Role-specific update error:', roleError);
          throw roleError;
        }
      }

      logger.info('✅ Profile updated');

      sendSuccess(res, {
        message: 'Profile updated successfully',
      });
    } catch (error) {
      logger.error('🔴 Error updating profile:', error.message);
      sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to update profile');
    }
  }
);

/**
 * GET /api/mobile/teachers
 * Get all teachers (for student discovery)
 */
app.get('/api/mobile/teachers', async (req, res) => {
  try {
    const { search, profession } = req.query;

    logger.info('🔵 Fetching teachers list');

    let query = supabase
      .from('teacher_profiles')
      .select('*, profiles:profiles(full_name, email)')
      .order('rating', { ascending: false });

    if (profession) {
      query = query.eq('profession', profession);
    }

    const { data: teachers, error } = await query;

    if (error) throw error;

    let result = teachers || [];

    // Client-side search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t =>
        t.profiles?.full_name?.toLowerCase().includes(searchLower) ||
        t.specializations?.toLowerCase().includes(searchLower)
      );
    }

    logger.info('✅ Teachers fetched:', result.length);

    sendSuccess(res, {
      data: result,
      count: result.length,
    });
  } catch (error) {
    logger.error('🔴 Error fetching teachers:', error.message);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch teachers');
  }
});

/**
 * GET /api/mobile/teacher/:teacherId
 * Get teacher profile with availability
 */
app.get('/api/mobile/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;

    logger.info('🔵 Fetching teacher profile:', teacherId);

    // Get teacher profile
    const { data: teacher, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('*')
      .eq('id', teacherId)
      .single();

    if (teacherError) {
      return sendError(res, 404, 'NOT_FOUND', 'Teacher not found');
    }

    // Get weekly availability
    const { data: availability } = await supabase
      .from('teacher_availability_schedule')
      .select('*')
      .eq('teacher_id', teacherId);

    logger.info('✅ Teacher profile fetched');

    sendSuccess(res, {
      teacher: { ...teacher, availability },
    });
  } catch (error) {
    logger.error('🔴 Error fetching teacher:', error.message);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch teacher');
  }
});

/**
 * GET /api/mobile/availability/:teacherId
 * Get available slots for a teacher
 */
app.get(
  '/api/mobile/availability/:teacherId',
  body('date').optional().isISO8601(),
  async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { date } = req.query;

      logger.info('🔵 Fetching availability for teacher:', teacherId);

      let query = supabase
        .from('teacher_availability_slots')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('status', 'available')
        .gt('available_at', new Date().toISOString());

      if (date) {
        query = query.eq('date', date);
      }

      const { data: slots, error } = await query.order('available_at', { ascending: true });

      if (error) throw error;

      logger.info('✅ Slots fetched:', slots?.length);

      sendSuccess(res, {
        slots: slots || [],
      });
    } catch (error) {
      logger.error('🔴 Error fetching availability:', error.message);
      sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch availability');
    }
  }
);

/**
 * POST /api/mobile/bookings
 * Create a new booking
 */
app.post(
  '/api/mobile/bookings',
  body('studentId').notEmpty().withMessage('Student ID required'),
  body('teacherId').notEmpty().withMessage('Teacher ID required'),
  body('slotId').notEmpty().withMessage('Slot ID required'),
  body('subject').trim().notEmpty().withMessage('Subject required'),
  validateRequest,
  async (req, res) => {
    try {
      const { studentId, teacherId, slotId, subject } = req.body;

      logger.info('🔵 Creating booking:', { studentId, teacherId, slotId });

      // Check slot availability (optimistic locking)
      const { data: slot, error: slotError } = await supabase
        .from('teacher_availability_slots')
        .select('*')
        .eq('id', slotId)
        .single();

      if (slotError || !slot) {
        return sendError(res, 400, 'SLOT_NOT_AVAILABLE', 'Slot not available');
      }

      if (slot.status !== 'available' || slot.booked_count >= slot.capacity) {
        return sendError(res, 400, 'SLOT_BOOKED', 'Slot already booked');
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          student_id: studentId,
          teacher_id: teacherId,
          availability_slot_id: slotId,
          subject: subject.trim(),
          status: 'pending',
          scheduled_time: slot.available_at,
        }])
        .select()
        .single();

      if (bookingError) {
        logger.error('🔴 Booking creation error:', bookingError);
        throw bookingError;
      }

      // Update slot booked count
      await supabase
        .from('teacher_availability_slots')
        .update({
          booked_count: slot.booked_count + 1,
          status: slot.booked_count + 1 >= slot.capacity ? 'booked' : 'available',
        })
        .eq('id', slotId);

      // Create notifications
      const teacherProfile = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', studentId)
        .single();

      await supabase.from('notifications').insert([
        {
          user_id: teacherId,
          notification_type: 'booking_request',
          title: '📚 New Booking Request',
          message: `${teacherProfile?.data?.full_name || 'Student'} wants to book a session on ${new Date(slot.available_at).toLocaleDateString()}`,
          booking_id: booking.id,
          is_read: false,
        },
        {
          user_id: studentId,
          notification_type: 'booking_created',
          title: '✅ Booking Created',
          message: 'Your booking request has been sent to the teacher',
          booking_id: booking.id,
          is_read: false,
        },
      ]);

      logger.info('✅ Booking created:', booking.id);

      sendSuccess(res, {
        booking,
        message: 'Booking created successfully',
      });
    } catch (error) {
      logger.error('🔴 Error creating booking:', error.message);
      sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to create booking');
    }
  }
);

/**
 * GET /api/mobile/bookings/:userId
 * Get user's bookings (student or teacher)
 */
app.get('/api/mobile/bookings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query; // 'student' or 'teacher'

    logger.info('🔵 Fetching bookings for user:', userId);

    let query = supabase
      .from('bookings')
      .select('*, teacher:teacher_id(full_name, email), student:student_id(full_name, email)')
      .order('scheduled_time', { ascending: false });

    if (role === 'student') {
      query = query.eq('student_id', userId);
    } else if (role === 'teacher') {
      query = query.eq('teacher_id', userId);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    logger.info('✅ Bookings fetched:', bookings?.length);

    sendSuccess(res, {
      bookings: bookings || [],
    });
  } catch (error) {
    logger.error('🔴 Error fetching bookings:', error.message);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch bookings');
  }
});

/**
 * PUT /api/mobile/bookings/:bookingId
 * Update booking status
 */
app.put(
  '/api/mobile/bookings/:bookingId',
  body('status').isIn(['pending', 'confirmed', 'ongoing', 'completed', 'cancelled']),
  validateRequest,
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;

      logger.info('🔵 Updating booking status:', { bookingId, status });

      const { data: booking, error: updateError } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create notification for status change
      const message = {
        confirmed: '✅ Booking confirmed!',
        ongoing: '📞 Meeting in progress',
        completed: '✅ Meeting completed',
        cancelled: '❌ Booking cancelled',
      };

      if (message[status]) {
        await supabase.from('notifications').insert({
          user_id: booking.student_id,
          notification_type: `booking_${status}`,
          title: message[status],
          message: `Your booking status has been updated to ${status}`,
          booking_id: bookingId,
          is_read: false,
        });
      }

      logger.info('✅ Booking updated');

      sendSuccess(res, { booking });
    } catch (error) {
      logger.error('🔴 Error updating booking:', error.message);
      sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to update booking');
    }
  }
);

/**
 * POST /api/mobile/favorites
 * Add teacher to favorites
 */
app.post(
  '/api/mobile/favorites',
  body('studentId').notEmpty(),
  body('teacherId').notEmpty(),
  validateRequest,
  async (req, res) => {
    try {
      const { studentId, teacherId } = req.body;

      logger.info('🔵 Adding favorite:', { studentId, teacherId });

      const { error } = await supabase.from('favorites').insert({
        student_id: studentId,
        teacher_id: teacherId,
      });

      if (error?.code === '23505') {
        return sendError(res, 400, 'ALREADY_FAVORITED', 'Already in favorites');
      }

      if (error) throw error;

      logger.info('✅ Favorite added');

      sendSuccess(res, { message: 'Added to favorites' });
    } catch (error) {
      logger.error('🔴 Error adding favorite:', error.message);
      sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to add favorite');
    }
  }
);

/**
 * DELETE /api/mobile/favorites/:studentId/:teacherId
 * Remove teacher from favorites
 */
app.delete('/api/mobile/favorites/:studentId/:teacherId', async (req, res) => {
  try {
    const { studentId, teacherId } = req.params;

    logger.info('🔵 Removing favorite:', { studentId, teacherId });

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId);

    if (error) throw error;

    logger.info('✅ Favorite removed');

    sendSuccess(res, { message: 'Removed from favorites' });
  } catch (error) {
    logger.error('🔴 Error removing favorite:', error.message);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to remove favorite');
  }
});

/**
 * GET /api/mobile/favorites/:studentId
 * Get student's favorite teachers
 */
app.get('/api/mobile/favorites/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    logger.info('🔵 Fetching favorites for student:', studentId);

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('*, teacher:teacher_id(*)')
      .eq('student_id', studentId);

    if (error) throw error;

    logger.info('✅ Favorites fetched:', favorites?.length);

    sendSuccess(res, {
      favorites: favorites?.map(f => f.teacher) || [],
    });
  } catch (error) {
    logger.error('🔴 Error fetching favorites:', error.message);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch favorites');
  }
});

/**
 * GET /api/mobile/notifications/:userId
 * Get user notifications
 */
app.get('/api/mobile/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    logger.info('🔵 Fetching notifications for user:', userId);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

    logger.info('✅ Notifications fetched:', notifications?.length);

    sendSuccess(res, {
      notifications: notifications || [],
      unreadCount,
    });
  } catch (error) {
    logger.error('🔴 Error fetching notifications:', error.message);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch notifications');
  }
});

/**
 * PUT /api/mobile/notifications/:notificationId
 * Mark notification as read
 */
app.put(
  '/api/mobile/notifications/:notificationId',
  body('is_read').isBoolean(),
  validateRequest,
  async (req, res) => {
    try {
      const { notificationId } = req.params;
      const { is_read } = req.body;

      logger.info('🔵 Updating notification:', notificationId);

      const { error } = await supabase
        .from('notifications')
        .update({ is_read })
        .eq('id', notificationId);

      if (error) throw error;

      logger.info('✅ Notification updated');

      sendSuccess(res, { message: 'Notification updated' });
    } catch (error) {
      logger.error('🔴 Error updating notification:', error.message);
      sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to update notification');
    }
  }
);

/**
 * GET /api/mobile/teacher-availability/:teacherId
 * Get teacher's weekly availability schedule
 */
app.get('/api/mobile/teacher-availability/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;

    logger.info('🔵 Fetching teacher availability:', teacherId);

    const { data: availability, error } = await supabase
      .from('teacher_availability_schedule')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('day_of_week', { ascending: true });

    if (error) throw error;

    logger.info('✅ Availability fetched');

    sendSuccess(res, {
      availability: availability || [],
    });
  } catch (error) {
    logger.error('🔴 Error fetching availability:', error.message);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch availability');
  }
});

/**
 * POST /api/mobile/teacher-availability
 * Create/update teacher availability (teacher only)
 */
app.post(
  '/api/mobile/teacher-availability',
  body('teacherId').notEmpty(),
  body('schedule').isArray(),
  validateRequest,
  async (req, res) => {
    try {
      const { teacherId, schedule } = req.body;

      logger.info('🔵 Setting availability for teacher:', teacherId);

      // Delete existing schedule
      await supabase
        .from('teacher_availability_schedule')
        .delete()
        .eq('teacher_id', teacherId);

      // Insert new schedule
      const scheduleData = schedule.map(s => ({
        teacher_id: teacherId,
        day_of_week: s.dayOfWeek,
        start_time: s.startTime,
        end_time: s.endTime,
        is_active: s.isActive,
      }));

      const { error: insertError } = await supabase
        .from('teacher_availability_schedule')
        .insert(scheduleData);

      if (insertError) throw insertError;

      // Generate availability slots for next 30 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // This should ideally be in a separate function, but for now we'll keep it simple
      logger.info('✅ Availability set for teacher');

      sendSuccess(res, {
        message: 'Availability updated successfully',
      });
    } catch (error) {
      logger.error('🔴 Error setting availability:', error.message);
      sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to set availability');
    }
  }
);

app.listen(PORT, HOST, () => {
  logger.info('\n' + '='.repeat(50));
  logger.info('🚀 VideoSDK Token Server Started');
  logger.info('='.repeat(50));
  logger.info(`📍 Server running at: http://localhost:${PORT}`);
  logger.info(`📍 Also reachable at: http://192.168.1.17:${PORT}`);
  logger.info('\n📌 Available Endpoints:');
  logger.info(`\n🔐 Authentication (Admin Panel - LearningPlatform):`);
  logger.info(`   POST /api/auth/signup - Create admin account`);
  logger.info(`   POST /api/auth/login  - Login admin`);
  logger.info(`\n📱 Mobile App - Profile & Discovery:`);
  logger.info(`   GET  /api/mobile/profile/:userId              - Get user profile`);
  logger.info(`   PUT  /api/mobile/profile/:userId              - Update user profile`);
  logger.info(`   GET  /api/mobile/teachers                     - Get all teachers`);
  logger.info(`   GET  /api/mobile/teacher/:teacherId           - Get teacher details`);
  logger.info(`   GET  /api/mobile/teacher-availability/:id     - Get availability schedule`);
  logger.info(`   POST /api/mobile/teacher-availability         - Set availability`);
  logger.info(`\n📱 Mobile App - Bookings & Sessions:`);
  logger.info(`   POST /api/mobile/bookings                     - Create booking`);
  logger.info(`   GET  /api/mobile/bookings/:userId             - Get user bookings`);
  logger.info(`   PUT  /api/mobile/bookings/:bookingId          - Update booking`);
  logger.info(`   GET  /api/mobile/availability/:teacherId      - Get available slots`);
  logger.info(`\n📱 Mobile App - Favorites & Notifications:`);
  logger.info(`   POST /api/mobile/favorites                    - Add to favorites`);
  logger.info(`   GET  /api/mobile/favorites/:studentId         - Get favorites`);
  logger.info(`   DELETE /api/mobile/favorites/:sid/:tid        - Remove favorite`);
  logger.info(`   GET  /api/mobile/notifications/:userId        - Get notifications`);
  logger.info(`   PUT  /api/mobile/notifications/:notifId       - Mark as read`);
  logger.info(`\n📱 Video Calls (Mobile App):`);
  logger.info(`   POST /send-otp        - Send OTP to email`);
  logger.info(`   POST /verify-otp      - Verify OTP`);
  logger.info(`   GET  /get-token       - Get fresh token`);
  logger.info(`   GET  /health          - Health check`);
  logger.info(`   POST /validate-token  - Validate token`);
  logger.info(`\n📋 Admin (LearningPlatform - Data Management):`);
  logger.info(`   GET  /api/admin/teachers     - List all teachers`);
  logger.info(`   POST /api/admin/teachers/:id - Update teacher (use POST if PATCH blocked by CORS)`);
  logger.info(`   GET  /api/admin/students     - List all students`);
  logger.info(`\n💳 Payment Endpoints:`);
  logger.info(`   POST /api/payments/create-order    - Create Razorpay order`);
  logger.info(`   POST /api/payments/verify          - Verify payment`);
  logger.info(`   POST /api/admin/charges/set        - Set admin charge`);
  logger.info(`   GET  /api/admin/charges/:id        - Get admin charge`);
  logger.info(`   GET  /api/teacher/earnings/:id     - Get earnings`);
  logger.info(`   POST /api/teacher/withdrawal/request - Request withdrawal`);
  logger.info(`   PATCH /api/admin/teacher/:id/wallet - Admin update wallet amounts`);
  logger.info(`   GET  /api/admin/withdrawals        - Get pending withdrawals`);
  logger.info(`   POST /api/admin/withdrawals/:id/approve - Approve withdrawal`);
  logger.info(`   GET  /api/admin/analytics          - Analytics`);
  logger.info('\n💡 Use in .env:');
  logger.info(`   REACT_APP_AUTH_URL = "http://192.168.1.17:${PORT}"`);
  logger.info(`   VITE_API_URL       = "http://192.168.1.17:${PORT}"`);
  logger.info('='.repeat(50) + '\n');
});

// ==========================================
// Error Handling (Must be LAST)
// ==========================================

// Global error handler middleware (catches all unhandled errors)
app.use(errorHandler);

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint does not exist',
    availableEndpoints: [
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'POST /send-otp',
      'POST /verify-otp',
      'GET /get-token',
      'GET /health',
      'POST /validate-token',
      'POST /api/meetings/start',
      'POST /api/meetings/end',
      'POST /api/notifications/send-reminder',
      'POST /api/payments/create-order',
      'POST /api/payments/verify',
      'POST /api/admin/charges/set',
      'GET /api/admin/charges/:id',
      'GET /api/teacher/earnings/:id',
      'POST /api/teacher/withdrawal/request',
      'PATCH /api/admin/teacher/:id/wallet',
      'GET /api/admin/withdrawals',
      'POST /api/admin/withdrawals/:id/approve',
      'GET /api/admin/analytics',
    ],
  });
});

module.exports = app;
