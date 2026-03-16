/**
 * Middleware for validation, error handling, and standardized responses
 */

const { validationResult } = require('express-validator');
const logger = require('./logger');

// Error codes for consistent client handling
const ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INVALID: 'OTP_INVALID',
  OTP_MAX_ATTEMPTS: 'OTP_MAX_ATTEMPTS',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
  TOKEN_GENERATION_FAILED: 'TOKEN_GENERATION_FAILED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
};

/**
 * Middleware to handle validation errors from express-validator
 * Standardizes error response format
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));

    logger.warn('Validation error', {
      endpoint: req.path,
      errors: validationErrors,
    });

    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: validationErrors,
      },
    });
  }
  next();
};

/**
 * Standardized error response sender
 * Provides consistent error format across all endpoints
 */
const sendError = (res, statusCode, errorCode, message, details = {}) => {
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...details,
    },
  });
};

/**
 * Standardized success response sender
 * Provides consistent success format across all endpoints
 */
const sendSuccess = (res, data = {}, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    ...data,
  });
};

/**
 * Global error handler middleware
 * Should be added last in the middleware chain
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    endpoint: req.path,
    method: req.method,
  });

  // Don't expose sensitive error details in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: message,
    },
  });
};

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, and timestamp
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log response when it's finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http('API Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};

/**
 * Rate limit error handler
 * Provides custom response for rate limit exceeded
 */
const rateLimitHandler = (req, res, options) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    endpoint: req.path,
  });

  sendError(
    res,
    429,
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    'Too many requests. Please try again later.',
    {
      retryAfter: options.windowMs / 1000,
    }
  );
};

module.exports = {
  validateRequest,
  sendError,
  sendSuccess,
  errorHandler,
  requestLogger,
  rateLimitHandler,
  ERROR_CODES,
};
