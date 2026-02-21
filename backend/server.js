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
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔵 [SERVER] Supabase Config:');
console.log('  URL:', supabaseUrl);
console.log('  Service Role Key Present:', !!supabaseKey, `(${supabaseKey?.length || 0} chars)`);

if (!supabaseKey) {
  console.error('🔴 [CRITICAL] SUPABASE_SERVICE_ROLE_KEY is not set! Payments will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
    subject: 'Your Verification OTP - Connectiqo Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E2BFF; text-align: center;">Email Verification</h2>
        <p>Welcome to Connectiqo!</p>
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
 * GET /api/diagnostics
 * Check database connectivity and RLS configuration
 */
app.get('/api/diagnostics', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      supabase: {
        url: process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set',
        keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      },
      database: {
        connected: false,
        bookingsTableExists: false,
        error: null,
      },
    };

    // Test database connectivity
    const { data: bookingCount, error: bookingsError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true });

    if (bookingsError) {
      diagnostics.database.error = bookingsError.message;
    } else {
      diagnostics.database.connected = true;
      diagnostics.database.bookingsTableExists = true;
    }

    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      error: 'Diagnostics check failed',
      message: error.message,
    });
  }
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
app.post('/api/meetings/start', async (req, res) => {
  try {
    const { bookingId, teacherId, meetingId } = req.body;

    if (!bookingId || !teacherId || !meetingId) {
      return res.status(400).json({
        success: false,
        error: 'bookingId, teacherId, and meetingId are required',
      });
    }

    console.log('🔵 Starting meeting for booking:', bookingId, 'with meetingId:', meetingId);

    // Don't generate a new ID - use the one the teacher is already in!
    // Generate meeting token using VideoSDK (using the existing meetingId)
    const meetingToken = generateVideoSDKToken(VIDEOSDK_API_KEY, VIDEOSDK_SECRET_KEY);

    // Get booking details
    console.log('🔵 Fetching booking details for ID:', bookingId);
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('🔴 Booking fetch error:', JSON.stringify(bookingError));
      throw new Error(`Booking not found: ${bookingError?.message}`);
    }
    
    if (!bookingData) {
      console.error('🔴 No booking data returned');
      throw new Error('Booking not found - no data returned');
    }
    
    console.log('✅ Booking found:', {
      id: bookingData.id,
      student_id: bookingData.student_id,
      teacher_id: bookingData.teacher_id,
      status: bookingData.status,
      hasStudentId: !!bookingData.student_id,
    });

    // Get teacher profile
    console.log('🔵 Fetching teacher profile...');
    const { data: teacherProfile, error: teacherError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', bookingData.teacher_id)
      .single();

    if (teacherError) console.warn('⚠️ Teacher profile error:', teacherError);

    // Update booking with meeting ID
    console.log('🔵 Updating booking with meeting ID...');
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        meeting_id: meetingId,
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('🔴 Update error:', updateError);
      throw updateError;
    }
    console.log('✅ Booking updated');

    // Create meeting log
    console.log('🔵 Creating meeting log...');
    const { error: logError } = await supabase
      .from('meeting_logs')
      .insert([{
        booking_id: bookingId,
        meeting_id: meetingId,
        started_at: new Date().toISOString(),
        teacher_joined: true,
      }]);

    if (logError) console.warn('⚠️ Meeting log error:', logError);

    // Send notification to student with meeting ID
    console.log('🔵 Sending notification to student ID:', bookingData.student_id);
    const notificationPayload = {
      user_id: bookingData.student_id,
      notification_type: 'meeting_started',
      title: '📞 Class is Starting!',
      message: `Your class with ${teacherProfile?.full_name || 'Teacher'} is starting now! Meeting ID: ${meetingId}. Copy this ID and join the meeting.`,
      booking_id: bookingId,
      is_read: false,
    };
    console.log('📋 Notification payload:', JSON.stringify(notificationPayload));
    
    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .insert([notificationPayload])
      .select();

    if (notifError) {
      console.error('🔴 Notification insertion error:', JSON.stringify(notifError));
      throw notifError;
    }
    
    console.log('✅ Notification sent, ID:', notifData?.[0]?.id);

    console.log(`✅ Meeting started: ${bookingId}, Meeting ID: ${meetingId}`);

    res.json({
      success: true,
      message: 'Meeting started',
      meetingToken: meetingToken,
      meetingId: meetingId,
      bookingId: bookingId,
    });
  } catch (error) {
    console.error('🔴 Error starting meeting:', error.message, error);
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
app.post('/api/meetings/end', async (req, res) => {
  try {
    const { bookingId, duration } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'bookingId is required',
      });
    }

    // Get booking details
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!bookingData) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Update booking with meeting ended time
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        meeting_ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(), // Explicitly set updated_at to trigger real-time subscriptions
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;
    console.log(`✅ Booking updated: status='completed' for bookingId=${bookingId}`);

    // Update meeting log
    await supabase
      .from('meeting_logs')
      .update({
        ended_at: new Date().toISOString(),
        duration_minutes: duration || 60,
      })
      .eq('booking_id', bookingId);

    // Get earnings record for this booking and update status
    const { data: earningsData } = await supabase
      .from('teacher_earnings')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (earningsData && earningsData.status === 'pending') {
      // Update earnings status to completed
      await supabase
        .from('teacher_earnings')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', earningsData.id);

      // Update teacher's wallet - add to total/available balance, reduce pending
      const { data: wallet } = await supabase
        .from('teacher_wallet')
        .select('*')
        .eq('teacher_id', bookingData.teacher_id)
        .single();

      if (wallet) {
        const teacherEarn = parseFloat(earningsData.total_collected || 0) - parseFloat(earningsData.admin_deduction || 0) - parseFloat(earningsData.platform_fee || 0);
        const newTotalBalance = (wallet.total_balance || 0) + teacherEarn;
        const newAvailableBalance = (wallet.available_balance || 0) + teacherEarn;
        const newPendingBalance = Math.max(0, (wallet.pending_balance || 0) - teacherEarn);

        await supabase
          .from('teacher_wallet')
          .update({
            total_balance: newTotalBalance,
            available_balance: newAvailableBalance,
            pending_balance: newPendingBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('teacher_id', bookingData.teacher_id);

        console.log(`✅ Wallet updated: +₹${teacherEarn} added to teacher ${bookingData.teacher_id}`);
      }
    }

    // Create notification for both
    const teacherEarnAmount = parseFloat(earningsData?.total_collected || 0) - parseFloat(earningsData?.admin_deduction || 0) - parseFloat(earningsData?.platform_fee || 0);
    await supabase
      .from('notifications')
      .insert([
        {
          user_id: bookingData.student_id,
          notification_type: 'meeting_completed',
          title: '✅ Session Completed',
          message: `Your session has been completed successfully. Duration: ${duration || 60} minutes.`,
          booking_id: bookingId,
          is_read: false,
        },
        {
          user_id: bookingData.teacher_id,
          notification_type: 'earnings_added',
          title: '💰 Earnings Added',
          message: `Session completed! ₹${teacherEarnAmount} has been added to your wallet.`,
          booking_id: bookingId,
          is_read: false,
        },
      ]);

    console.log(`✅ Meeting ended: ${bookingId}`);

    res.json({
      success: true,
      message: 'Meeting ended',
      bookingId: bookingId,
    });
  } catch (error) {
    console.error('🔴 Error ending meeting:', error.message);
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
app.post('/api/notifications/send-reminder', async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'bookingId is required',
      });
    }

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

    console.log(`✅ Reminder sent for booking: ${bookingId}`);

    res.json({
      success: true,
      message: 'Reminder sent',
    });
  } catch (error) {
    console.error('🔴 Error sending reminder:', error.message);
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

// RazorpayX Payout API (contacts, fund_accounts, payouts) – same auth as Payments
const RAZORPAY_X_KEY = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_X_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_PAYOUT_ACCOUNT = process.env.RAZORPAY_PAYOUT_ACCOUNT_NUMBER || '';

function razorpayXRequest(method, path, body, idempotencyKey = null) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${RAZORPAY_X_KEY}:${RAZORPAY_X_SECRET}`).toString('base64');
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.razorpay.com',
      path: `/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
    if (idempotencyKey) options.headers['X-Payout-Idempotency'] = idempotencyKey;

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (ch) => { raw += ch; });
      res.on('end', () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else reject(new Error(parsed.error?.description || parsed.error?.reason || raw || `HTTP ${res.statusCode}`));
        } catch (e) {
          reject(new Error(raw || e.message));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

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
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { bookingId, studentId, teacherId, basePrice, adminCharge, totalAmount } = req.body;

    if (!bookingId || !studentId || !teacherId || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    console.log('🔵 Creating Razorpay order for booking:', bookingId, 'Amount:', totalAmount);

    // Validate Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('🔴 Razorpay keys not configured in environment');
      return res.status(500).json({
        success: false,
        error: 'Payment service not configured',
      });
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

    console.log('✅ Order created:', order.id);

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

    if (logError) console.warn('⚠️ Order log error:', logError);

    res.json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('🔴 Error creating order:', error.message);
    console.error('Full error:', error);
    
    // Check if it's a Razorpay API error
    if (error.statusCode) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create order',
        message: error.message,
        razorpayError: error.error?.description || error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error.message,
    });
  }
});

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
app.post('/api/payments/verify', async (req, res) => {
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

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment details',
      });
    }

    // Validate amounts
    if (!basePrice || basePrice <= 0 || !totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment amounts',
        details: { basePrice, totalAmount },
      });
    }

    console.log('🔵 Verifying payment:', razorpayPaymentId);
    console.log('📌 Request payload:', {
      bookingId,
      studentId,
      teacherId,
      basePrice,
      totalAmount,
    });

    // Verify signature
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      console.error('🔴 Signature mismatch');
      return res.status(400).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    console.log('✅ Signature verified');

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
      console.error('🔴 Payment creation error:', paymentError);
      // Still log payment, but continue - might be duplicate
    }

    console.log('✅ Payment created:', payment?.[0]?.id);

    // Create teacher earnings record (PENDING - will be completed after meeting)
    // Calculate percentage-based deductions: GST 18% + Platform Fee 7.5% = 25.5% total deductions
    // Use basePrice to calculate fees (not totalAmount which already includes fees)
    const gstAmount = Math.round(basePrice * 0.18); // 18% GST
    const platformFeeAmount = Math.round(basePrice * 0.075); // 7.5% Platform Fee
    const teacherEarn = basePrice; // Teacher gets 100% of their rate (fees already deducted from student)

    if (!payment || !payment[0]) {
      console.error('🔴 Payment record was not created');
      throw new Error('Payment record creation returned no data');
    }

    const { data: earnings, error: earningsError } = await supabase
      .from('teacher_earnings')
      .insert([{
        teacher_id: teacherId,
        payment_id: payment[0].id,
        booking_id: bookingId,
        total_collected: totalAmount,
        admin_deduction: gstAmount, // Store GST as admin_deduction
        platform_fee: platformFeeAmount, // Store percentage-based platform fee
        status: 'pending', // Will change to 'completed' after meeting ends
      }])
      .select();

    if (earningsError) {
      console.error('🔴 Earnings creation error:', earningsError);
      // Log but continue - not critical for payment completion
    }

    console.log('✅ Earnings record created (PENDING). Breakdown:', {
      totalCollected: totalAmount,
      gstDeduction: gstAmount,
      platformFee: platformFeeAmount,
      teacherEarn: teacherEarn
    });

    // Update booking payment status and auto-confirm (teacher availability already set)
    const { data: updatedBooking, error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'completed', // Payment is done
        status: 'confirmed', // Auto-confirm since teacher has set availability slots
        total_price: totalAmount,
        payment_id: payment[0].id,
        updated_at: new Date().toISOString(), // Ensure timestamp updates for real-time
      })
      .eq('id', bookingId)
      .select();

    if (bookingError) {
      console.error('🔴 Booking update error:', bookingError);
      // Don't throw - log and continue
    } else {
      console.log(`✅ Booking auto-confirmed (teacher availability already set)`);
      console.log(`✅ Booking status: payment_status='completed', status='confirmed'`);
      console.log('📌 Updated booking:', updatedBooking);
    }

    // NOTE: Wallet is NOT updated here - it will be updated when meeting ends
    // Ensure wallet exists for teacher (create if not)
    try {
      const { data: wallet, error: walletQueryError } = await supabase
        .from('teacher_wallet')
        .select('*')
        .eq('teacher_id', teacherId)
        .single();

      if (walletQueryError && walletQueryError.code !== 'PGRST116') { // PGRST116 = not found
        console.warn('⚠️ Wallet query error:', walletQueryError);
      }

      if (!wallet) {
        // Create wallet if not exists (with zero balance)
        const { error: walletCreateError } = await supabase
          .from('teacher_wallet')
          .insert([{
            teacher_id: teacherId,
            total_balance: 0,
            available_balance: 0,
            pending_balance: teacherEarn,
            created_at: new Date().toISOString(),
          }]);
        
        if (walletCreateError) {
          console.warn('⚠️ Wallet creation error:', walletCreateError);
        } else {
          console.log('✅ Wallet created with pending balance');
        }
      } else {
        // Update pending balance
        const newPending = (wallet.pending_balance || 0) + teacherEarn;
        const { error: walletUpdateError } = await supabase
          .from('teacher_wallet')
          .update({
            pending_balance: newPending,
            updated_at: new Date().toISOString(),
          })
          .eq('teacher_id', teacherId);
        
        if (walletUpdateError) {
          console.warn('⚠️ Wallet update error:', walletUpdateError);
        } else {
          console.log('✅ Wallet pending balance updated');
        }
      }
    } catch (walletError) {
      console.warn('⚠️ Wallet operation failed:', walletError.message);
      // Don't throw - wallet is non-critical
    }

    // Update order status
    const { error: orderUpdateError } = await supabase
      .from('razorpay_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpayOrderId);
    
    if (orderUpdateError) {
      console.warn('⚠️ Order status update error:', orderUpdateError);
    } else {
      console.log('✅ Razorpay order status updated to paid');
    }

    // Send notification to student
    try {
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
    } catch (err) {
      console.warn('⚠️ Student notification error:', err.message);
    }

    // Send notification to teacher
    try {
      await supabase
        .from('notifications')
        .insert([{
          user_id: teacherId,
          notification_type: 'payment_received',
          title: '💰 New Booking Confirmed',
          message: `A student has booked and paid for your session. ₹${teacherEarn} will be added to your wallet after the session is completed.`,
          booking_id: bookingId,
          is_read: false,
        }]);
    } catch (err) {
      console.warn('⚠️ Teacher notification error:', err.message);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: payment?.[0]?.id,
      bookingUpdated: !bookingError && updatedBooking?.length > 0,
      bookingUpdateError: bookingError?.message,
      earnings: {
        totalCollected: totalAmount,
        adminDeduction: adminCharge,
        platformFee: platformFeeAmount,
        teacherEarn: teacherEarn,
      },
    });
  } catch (error) {
    console.error('🔴 Error verifying payment:', error.message);
    console.error('Full error stack:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      message: error.message,
      details: error.details || error.toString(),
    });
  }
});

/**
 * POST /api/admin/charges/set
 * Admin sets additional charge for a teacher
 * 
 * Request Body:
 * {
 *   "teacherId": "uuid",
 *   "baseCharge": 600,
 *   "adminCharge": 150
 * }
 */
app.post('/api/admin/charges/set', async (req, res) => {
  try {
    const { teacherId, baseCharge, adminCharge } = req.body;

    if (!teacherId || !baseCharge || adminCharge === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    console.log('🔵 Setting admin charge for teacher:', teacherId);

    // Check if charge exists
    const { data: existing } = await supabase
      .from('admin_charges')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('admin_charges')
        .update({
          base_charge_amount: baseCharge,
          admin_charge_amount: adminCharge,
          updated_at: new Date().toISOString(),
        })
        .eq('teacher_id', teacherId)
        .select();
      result = { data, error };
    } else {
      // Create new
      result = await supabase
        .from('admin_charges')
        .insert([{
          teacher_id: teacherId,
          base_charge_amount: baseCharge,
          admin_charge_amount: adminCharge,
        }])
        .select();
    }

    if (result.error) throw result.error;

    console.log('✅ Admin charge set:', result.data[0]);

    res.json({
      success: true,
      message: 'Admin charge updated',
      data: result.data[0],
      totalAmount: baseCharge + adminCharge,
    });
  } catch (error) {
    console.error('🔴 Error setting admin charge:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to set admin charge',
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

    console.log('🔵 Fetching admin charge for teacher:', teacherId);

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

    console.log('✅ Admin charge found:', data);

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('🔴 Error fetching admin charge:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin charge',
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

    console.log('🔵 Fetching earnings for teacher:', teacherId);

    // Get wallet
    const { data: wallet } = await supabase
      .from('teacher_wallet')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();

    // Get recent earnings
    const { data: earnings, error: earningsError } = await supabase
      .from('teacher_earnings')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Compute withdrawal eligibility: balance > 10,000 and 1 month since last withdrawal or account creation
    let eligibility = null;
    if (wallet) {
      const totalBalance = Number(wallet.total_balance || 0);
      const referenceDate = wallet.last_withdrawal_date ? new Date(wallet.last_withdrawal_date) : new Date(wallet.created_at);
      const oneMonthLater = new Date(referenceDate);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      const now = new Date();
      const minimumBalanceReached = totalBalance > 10000;
      const oneMonthCovered = now >= oneMonthLater;
      const canWithdraw = minimumBalanceReached && oneMonthCovered;
      let eligibilityReason = 'Eligible to withdraw';
      if (!minimumBalanceReached) eligibilityReason = `Balance must be greater than ₹10,000 (current: ₹${totalBalance.toLocaleString()})`;
      else if (!oneMonthCovered) eligibilityReason = `Wait until ${oneMonthLater.toLocaleDateString()} (1 month from ${wallet.last_withdrawal_date ? 'last withdrawal' : 'account creation'})`;
      eligibility = {
        can_withdraw: canWithdraw,
        eligibility_reason: eligibilityReason,
        minimum_balance_reached: minimumBalanceReached,
        one_month_covered: oneMonthCovered,
        next_eligible_date: oneMonthCovered ? null : oneMonthLater.toISOString(),
      };
    }

    console.log('✅ Earnings response prepared');

    res.json({
      success: true,
      wallet: wallet || {
        total_balance: 0,
        available_balance: 0,
        pending_balance: 0,
        last_withdrawal_date: null,
      },
      earnings: earnings || [],
      eligibility,
    });
  } catch (error) {
    console.error('🔴 Error fetching earnings:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings',
      message: error.message,
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
app.post('/api/teacher/withdrawal/request', async (req, res) => {
  try {
    const { teacherId, amount, bankAccountNumber, bankIFSCCode, accountHolderName } = req.body;

    if (!teacherId || !amount || !bankAccountNumber || !bankIFSCCode || !accountHolderName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    console.log('🔵 Processing withdrawal request for teacher:', teacherId, 'Amount:', amount);

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

    // Minimum balance: must be greater than ₹10,000
    if (wallet.total_balance <= 10000) {
      return res.status(400).json({
        success: false,
        error: 'Balance must be greater than ₹10,000 to withdraw',
        currentBalance: wallet.total_balance,
      });
    }

    // One month rule: from last withdrawal date, or from account creation if never withdrawn
    const referenceDate = wallet.last_withdrawal_date ? new Date(wallet.last_withdrawal_date) : new Date(wallet.created_at);
    const oneMonthLater = new Date(referenceDate);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    if (new Date() < oneMonthLater) {
      const fromLabel = wallet.last_withdrawal_date ? 'last withdrawal' : 'account creation';
      return res.status(400).json({
        success: false,
        error: `Please wait for 1 month from ${fromLabel} to withdraw again`,
        eligibleDate: oneMonthLater.toISOString(),
      });
    }

    // Create withdrawal request
    const insertRow = {
      teacher_id: teacherId,
      amount: amount,
      status: 'pending',
      bank_account_number: bankAccountNumber,
      bank_ifsc_code: bankIFSCCode,
      account_holder_name: accountHolderName,
    };
    if (bankName) insertRow.bank_name = bankName;
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert([insertRow])
      .select();

    if (withdrawalError) throw withdrawalError;

    console.log('✅ Withdrawal request created:', withdrawal[0].id);

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
    console.error('🔴 Error processing withdrawal:', error.message);
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
app.patch('/api/admin/teacher/:teacherId/wallet', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { total_balance, available_balance } = req.body;

    if (total_balance === undefined && available_balance === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Provide at least one of total_balance or available_balance',
      });
    }

    const total = total_balance !== undefined ? Number(total_balance) : undefined;
    const available = available_balance !== undefined ? Number(available_balance) : undefined;
    if ((total !== undefined && (isNaN(total) || total < 0)) || (available !== undefined && (isNaN(available) || available < 0))) {
      return res.status(400).json({
        success: false,
        error: 'Amounts must be non-negative numbers',
      });
    }

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
    console.error('🔴 Error updating teacher wallet:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update wallet',
    });
  }
});

/** Mask account number: show only last 6 digits */
function maskAccountNumber(accountNumber) {
  if (!accountNumber || typeof accountNumber !== 'string') return '******';
  const s = accountNumber.replace(/\D/g, '');
  if (s.length <= 6) return '******' + s;
  return '******' + s.slice(-6);
}

/**
 * GET /api/admin/withdrawals
 * Get all pending withdrawal requests (Admin only).
 * Returns sender info, available balance, account masked (last 6 digits), bank name.
 */
app.get('/api/admin/withdrawals', async (req, res) => {
  try {
    console.log('🔵 Fetching withdrawal requests');

    const { data: withdrawals, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) throw error;

    const list = withdrawals || [];
    if (list.length === 0) {
      return res.json({ success: true, data: [], count: 0 });
    }

    const teacherIds = [...new Set(list.map((w) => w.teacher_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', teacherIds);
    const { data: wallets } = await supabase
      .from('teacher_wallet')
      .select('teacher_id, available_balance, total_balance')
      .in('teacher_id', teacherIds);

    const profileMap = (profiles || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
    const walletMap = (wallets || []).reduce((acc, w) => { acc[w.teacher_id] = w; return acc; }, {});

    const data = list.map((w) => {
      const profile = profileMap[w.teacher_id] || {};
      const wallet = walletMap[w.teacher_id] || {};
      return {
        ...w,
        bank_account_number_masked: maskAccountNumber(w.bank_account_number),
        bank_account_number: undefined,
        sender: {
          full_name: profile.full_name,
          email: profile.email,
          teacher_id: w.teacher_id,
        },
        available_balance: wallet.available_balance ?? 0,
        total_balance: wallet.total_balance ?? 0,
      };
    });

    console.log('✅ Withdrawal requests fetched:', data.length);
    res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('🔴 Error fetching withdrawals:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch withdrawals',
    });
  }
});

/**
 * GET /api/admin/withdrawals/:id
 * Get single withdrawal request detail (sender info, balance, masked account).
 */
app.get('/api/admin/withdrawals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: w, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !w) {
      return res.status(404).json({ success: false, error: 'Withdrawal request not found' });
    }

    const [profileRes, walletRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').eq('id', w.teacher_id).single(),
      supabase.from('teacher_wallet').select('teacher_id, available_balance, total_balance').eq('teacher_id', w.teacher_id).single(),
    ]);

    const profile = profileRes.data || {};
    const wallet = walletRes.data || {};

    res.json({
      success: true,
      data: {
        ...w,
        bank_account_number: undefined,
        bank_account_number_masked: maskAccountNumber(w.bank_account_number),
        bank_name: w.bank_name || null,
        sender: {
          full_name: profile.full_name,
          email: profile.email,
          teacher_id: w.teacher_id,
        },
        available_balance: wallet.available_balance ?? 0,
        total_balance: wallet.total_balance ?? 0,
      },
    });
  } catch (error) {
    console.error('🔴 Error fetching withdrawal detail:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/withdrawals/:id/reveal
 * Reveal full account number for admin (eye icon). Use sparingly.
 */
app.get('/api/admin/withdrawals/:id/reveal', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: w, error } = await supabase
      .from('withdrawal_requests')
      .select('id, teacher_id, bank_account_number, bank_ifsc_code, bank_name, account_holder_name')
      .eq('id', id)
      .single();

    if (error || !w) {
      return res.status(404).json({ success: false, error: 'Withdrawal request not found' });
    }

    res.json({
      success: true,
      data: {
        bank_account_number: w.bank_account_number,
        bank_ifsc_code: w.bank_ifsc_code,
        bank_name: w.bank_name || null,
        account_holder_name: w.account_holder_name,
      },
    });
  } catch (error) {
    console.error('🔴 Error revealing account:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/withdrawals/:withdrawalId/approve
 * Admin approves and processes withdrawal. If RAZORPAY_PAYOUT_ACCOUNT_NUMBER is set,
 * creates RazorpayX Contact (if needed), Fund account (if needed), and Payout.
 */
app.post('/api/admin/withdrawals/:withdrawalId/approve', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { adminId } = req.body;

    console.log('🔵 Approving withdrawal:', withdrawalId);

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

    // Mark as processing first
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

    let payoutId = null;
    let finalStatus = 'processing';
    const payoutAccount = (RAZORPAY_PAYOUT_ACCOUNT || '').trim();

    if (payoutAccount) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email, razorpay_contact_id, razorpay_fund_account_id')
          .eq('id', withdrawal.teacher_id)
          .single();

        let contactId = profile?.razorpay_contact_id;
        let fundAccountId = profile?.razorpay_fund_account_id;

        if (!contactId) {
          const phone = (profile?.phone || '0000000000').replace(/\D/g, '').slice(0, 10) || '0000000000';
          const contactRes = await razorpayXRequest('POST', '/contacts', {
            name: (profile?.full_name || withdrawal.account_holder_name || 'Teacher').substring(0, 50),
            email: profile?.email || `teacher-${withdrawal.teacher_id}@placeholder.local`,
            contact: phone,
            type: 'vendor',
            reference_id: `teacher_${withdrawal.teacher_id}`,
          });
          contactId = contactRes.id;
          await supabase.from('profiles').update({ razorpay_contact_id: contactId }).eq('id', withdrawal.teacher_id);
        }

        if (!fundAccountId) {
          const faRes = await razorpayXRequest('POST', '/fund_accounts', {
            contact_id: contactId,
            account_type: 'bank_account',
            bank_account: {
              name: withdrawal.account_holder_name || profile?.full_name || 'Teacher',
              ifsc: (withdrawal.bank_ifsc_code || '').trim(),
              account_number: String(withdrawal.bank_account_number || '').replace(/\D/g, ''),
            },
          });
          fundAccountId = faRes.id;
          await supabase.from('profiles').update({ razorpay_fund_account_id: fundAccountId }).eq('id', withdrawal.teacher_id);
        }

        const amountPaise = Math.max(100, Math.round(Number(withdrawal.amount) * 100));
        const payoutRes = await razorpayXRequest(
          'POST',
          '/payouts',
          {
            account_number: payoutAccount,
            fund_account_id: fundAccountId,
            amount: amountPaise,
            currency: 'INR',
            mode: 'IMPS',
            purpose: 'payout',
            reference_id: `wd_${withdrawalId}`,
            narration: 'Teacher withdrawal',
          },
          withdrawalId
        );
        payoutId = payoutRes.id;
        finalStatus = payoutRes.status === 'queued' || payoutRes.status === 'processing' || payoutRes.status === 'reversed' ? 'processing' : 'completed';
        if (payoutRes.status === 'processed' || payoutRes.status === 'completed') finalStatus = 'completed';
        console.log('✅ Razorpay payout created:', payoutId, payoutRes.status);
      } catch (payoutErr) {
        console.error('🔴 Razorpay payout error:', payoutErr.message);
        await supabase
          .from('withdrawal_requests')
          .update({
            status: 'processing',
            rejected_reason: payoutErr.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', withdrawalId);
        return res.status(500).json({
          success: false,
          error: 'Payout failed',
          message: payoutErr.message,
        });
      }
    } else {
      console.log('⚠️ RAZORPAY_PAYOUT_ACCOUNT_NUMBER not set – skipping actual payout');
    }

    const updatePayload = {
      status: finalStatus,
      updated_at: new Date().toISOString(),
    };
    if (payoutId) updatePayload.razorpay_payout_id = payoutId;
    if (finalStatus === 'completed') updatePayload.completed_at = new Date().toISOString();

    await supabase.from('withdrawal_requests').update(updatePayload).eq('id', withdrawalId);

    // Reset one-month condition after redeem/withdraw: set last_withdrawal_date so next withdrawal is allowed only after 1 month
    const { data: w } = await supabase.from('teacher_wallet').select('withdrawn_amount').eq('teacher_id', withdrawal.teacher_id).single();
    const currentWithdrawn = Number(w?.withdrawn_amount || 0);
    await supabase
      .from('teacher_wallet')
      .update({
        last_withdrawal_date: new Date().toISOString(),
        withdrawn_amount: currentWithdrawn + Number(withdrawal.amount),
        updated_at: new Date().toISOString(),
      })
      .eq('teacher_id', withdrawal.teacher_id);

    await supabase.from('notifications').insert([{
      user_id: withdrawal.teacher_id,
      notification_type: 'withdrawal_approved',
      title: '✅ Withdrawal Approved',
      message: `Your withdrawal of ₹${withdrawal.amount} has been approved. Your amount will be redeemed in your bank within 24hrs.`,
      is_read: false,
    }]);

    res.json({
      success: true,
      message: payoutId ? 'Withdrawal approved and payout initiated' : 'Withdrawal approved and processing',
      data: { ...updated[0], status: finalStatus, razorpay_payout_id: payoutId },
    });
  } catch (error) {
    console.error('🔴 Error approving withdrawal:', error.message);
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
    console.log('🔵 Fetching payment analytics');

    // Total revenue
    const { data: totalRevenue } = await supabase
      .from('payments')
      .select('total_amount')
      .eq('status', 'completed');

    const total = totalRevenue?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

    // Get top teachers by earnings
    const { data: topTeachersData } = await supabase
      .from('teacher_earnings')
      .select('teacher_id, total_collected, admin_deduction, platform_fee')
      .eq('status', 'pending')
      .order('total_collected', { ascending: false })
      .limit(10);

    // Calculate teacher_earn for each and group by teacher_id
    const topTeachersByEarnings = (topTeachersData || []).map(e => ({
      teacher_id: e.teacher_id,
      teacher_earn: parseFloat(e.total_collected || 0) - parseFloat(e.admin_deduction || 0) - parseFloat(e.platform_fee || 0),
    }));

    // Get pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from('withdrawal_requests')
      .select('amount')
      .eq('status', 'pending');

    const totalPending = pendingWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

    console.log('✅ Analytics fetched');

    res.json({
      success: true,
      analytics: {
        totalRevenue: total,
        totalPayments: totalRevenue?.length || 0,
        pendingWithdrawals: totalPending,
        topTeachers: topTeachersByEarnings,
      },
    });
  } catch (error) {
    console.error('🔴 Error fetching analytics:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

app.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 VideoSDK Token Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log(`📍 Also reachable at: http://192.168.0.130:${PORT}`);
  console.log('\n📌 Available Endpoints:');
  console.log(`   POST /send-otp        - Send OTP to email`);
  console.log(`   POST /verify-otp      - Verify OTP`);
  console.log(`   GET  /get-token       - Get fresh token`);
  console.log(`   GET  /health          - Health check`);
  console.log(`   POST /validate-token  - Validate token`);
  console.log(`\n💳 Payment Endpoints:`);
  console.log(`   POST /api/payments/create-order    - Create Razorpay order`);
  console.log(`   POST /api/payments/verify          - Verify payment`);
  console.log(`   POST /api/admin/charges/set        - Set admin charge`);
  console.log(`   GET  /api/admin/charges/:id        - Get admin charge`);
  console.log(`   GET  /api/teacher/earnings/:id     - Get earnings`);
  console.log(`   POST /api/teacher/withdrawal/request - Request withdrawal`);
  console.log(`   PATCH /api/admin/teacher/:id/wallet - Admin update wallet amounts`);
  console.log(`   GET  /api/admin/withdrawals        - Get pending withdrawals`);
  console.log(`   POST /api/admin/withdrawals/:id/approve - Approve withdrawal`);
  console.log(`   GET  /api/admin/analytics          - Analytics`);
  console.log('\n💡 Use this in your .env:');
  console.log(`   REACT_APP_AUTH_URL = "http://192.168.0.130:${PORT}"`);
  console.log('='.repeat(50) + '\n');
});

// ==========================================
// Error Handling (Must be LAST)
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
