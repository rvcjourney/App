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
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map();

// CORS: handle preflight first so PATCH is allowed from LearningPlatform (localhost:5173)
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

    console.log('🔵 Verifying payment:', razorpayPaymentId);

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
      throw paymentError;
    }

    console.log('✅ Payment created:', payment[0].id);

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
      console.error('🔴 Earnings creation error:', earningsError);
      throw earningsError;
    }

    console.log('✅ Earnings record created. Teacher will earn:', teacherEarn);

    // Update booking status and confirm
    const { data: updatedBooking, error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'completed',
        total_price: totalAmount,
        payment_id: payment[0].id,
        status: 'confirmed', // Mark booking as confirmed after payment
        teacher_confirmed_at: new Date().toISOString(), // Auto-confirm at payment time
      })
      .eq('id', bookingId)
      .select();

    if (bookingError) {
      console.warn('⚠️ Booking update error:', bookingError);
    } else {
      console.log(`✅ Booking status updated to confirmed`);
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
      // Create wallet if not exists
      await supabase
        .from('teacher_wallet')
        .insert([{
          teacher_id: teacherId,
          total_balance: teacherEarn,
          available_balance: teacherEarn,
          created_at: new Date().toISOString(),
        }]);
    }

    console.log('✅ Wallet updated');

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

    res.json({
      success: true,
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
    console.error('🔴 Error verifying payment:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/charges/set
 * Admin sets charges for a teacher: base (₹), admin charge %, GST %.
 * Request Body: { teacherId, baseCharge, adminChargePercent, gstPercent }
 */
app.post('/api/admin/charges/set', async (req, res) => {
  try {
    const { teacherId, baseCharge, adminChargePercent, gstPercent } = req.body;

    if (!teacherId || baseCharge === undefined || baseCharge === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (teacherId, baseCharge)',
      });
    }

    const base = Number(baseCharge) || 0;
    const adminPct = Number(adminChargePercent) ?? 0;
    const gstPct = Number(gstPercent) ?? 0;

    console.log('🔵 Setting charges for teacher:', teacherId, { base, adminPct, gstPct });

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

    console.log('✅ Charges set:', data);

    res.json({
      success: true,
      message: 'Charges updated',
      data: { ...data, totalAmount: total },
      totalAmount: total,
    });
  } catch (error) {
    console.error('🔴 Error setting charges:', error.message);
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
    console.log('🔵 Fetching all teachers');

    const { data: teachers, error: teErr } = await supabase
      .from('teacher_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (teErr) throw teErr;
    const list = (Array.isArray(teachers) ? teachers : []).map((t) => ({
      ...t,
      profile: profileFromRow(t),
    }));
    console.log('✅ Teachers fetched:', list.length);
    res.json(list);
  } catch (error) {
    console.error('🔴 Error fetching teachers:', error.message);
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
      if (prErr) console.warn('⚠️ Profiles update:', prErr.message);
    }

    res.json(teacherData);
  } catch (error) {
    console.error('🔴 Error updating teacher:', error.message);
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
    console.log('🔵 Fetching all students');

    const { data: students, error: stErr } = await supabase
      .from('student_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (stErr) throw stErr;
    const list = (Array.isArray(students) ? students : []).map((s) => ({
      ...s,
      profile: profileFromRow(s),
    }));
    console.log('✅ Students fetched:', list.length);
    res.json(list);
  } catch (error) {
    console.error('🔴 Error fetching students:', error.message);
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

    console.log('🔵 Fetching earnings for teacher:', teacherId);

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

    console.log('✅ Earnings fetched');

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
    console.error('🔴 Error fetching earnings:', error.message);
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
    console.error('🔴 Dashboard error:', error.message);
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
    console.log('🔵 Fetching withdrawal requests');

    const { data: withdrawals, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      console.warn('⚠️ Withdrawals query error:', error.message);
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
        console.warn('⚠️ Profiles for withdrawals:', e.message);
      }
    }

    const data = list.map((w) => ({
      ...w,
      sender: profileMap[w.teacher_id] || null,
    }));

    console.log('✅ Withdrawal requests fetched:', data.length);
    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('🔴 Error fetching withdrawals:', error.message);
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

    console.log('🔵 Approving withdrawal:', withdrawalId);

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

    console.log('✅ Withdrawal marked as processing:', withdrawalId);

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

    console.log('✅ Analytics fetched');

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
  console.log(`📍 Also reachable at: http://192.168.1.19:${PORT}`);
  console.log('\n📌 Available Endpoints:');
  console.log(`   POST /send-otp        - Send OTP to email`);
  console.log(`   POST /verify-otp      - Verify OTP`);
  console.log(`   GET  /get-token       - Get fresh token`);
  console.log(`   GET  /health          - Health check`);
  console.log(`   POST /validate-token  - Validate token`);
  console.log(`\n📋 Admin (LearningPlatform):`);
  console.log(`   GET  /api/admin/teachers     - List all teachers`);
  console.log(`   POST /api/admin/teachers/:id - Update teacher (use POST if PATCH blocked by CORS)`);
  console.log(`   GET  /api/admin/students     - List all students`);
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
  console.log('\n💡 Use in .env:');
  console.log(`   REACT_APP_AUTH_URL = "http://192.168.1.19:${PORT}"`);
  console.log(`   VITE_API_URL       = "http://192.168.1.19:${PORT}"`);
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
