import { z } from 'zod';

/**
 * Zod schemas for validating API responses
 * Ensures data structure and types are correct before using in components
 */

// ==========================================
// Profile & User Schemas
// ==========================================

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  role: z.enum(['teacher', 'student', 'super_admin']).nullable().optional(),
  email_verified: z.boolean().nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
}).strict();

export const TeacherSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1),
  email: z.string().email(),
  profile: ProfileSchema.nullable().optional(),
  price_per_call: z.number().int().min(0).nullable().optional(),
  experience_years: z.number().int().min(0).nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
}).passthrough(); // Allow extra fields from Supabase

export const TeacherListSchema = z.array(TeacherSchema);

export const StudentSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1),
  email: z.string().email(),
  profile: ProfileSchema.nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
}).passthrough();

export const StudentListSchema = z.array(StudentSchema);

// ==========================================
// Dashboard Schemas
// ==========================================

export const DashboardStatsSchema = z.object({
  totalTeachers: z.number().int().min(0),
  totalStudents: z.number().int().min(0),
  totalBookings: z.number().int().min(0),
}).strict();

export const DashboardDataSchema = z.object({
  stats: DashboardStatsSchema,
  withdrawals: z.array(z.object({
    id: z.string().uuid(),
    teacher_id: z.string().uuid(),
    amount: z.number().int().min(0),
    status: z.enum(['pending', 'processing', 'completed', 'rejected']),
    requested_at: z.string().datetime().nullable().optional(),
    sender: ProfileSchema.nullable().optional(),
    account_holder_name: z.string().nullable().optional(),
    bank_account_number: z.string().nullable().optional(),
  }).passthrough()).optional(),
}).strict();

// ==========================================
// Finance & Payment Schemas
// ==========================================

export const AdminChargeSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  base_charge_amount: z.number().int().min(0),
  admin_charge_percent: z.number().int().min(0).max(100),
  gst_percent: z.number().int().min(0).max(100),
  is_active: z.boolean(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
}).passthrough();

export const WithdrawalRequestSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  amount: z.number().int().min(1),
  status: z.enum(['pending', 'processing', 'completed', 'rejected']),
  bank_account_number: z.string().min(1),
  bank_ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
  account_holder_name: z.string().min(1),
  requested_at: z.string().datetime().nullable().optional(),
  processed_at: z.string().datetime().nullable().optional(),
  sender: ProfileSchema.nullable().optional(),
}).passthrough();

export const WithdrawalListSchema = z.array(WithdrawalRequestSchema);

export const WithdrawalDetailSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  amount: z.number().int().min(1),
  status: z.enum(['pending', 'processing', 'completed', 'rejected']),
  bank_account_number: z.string().min(1),
  bank_ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
  account_holder_name: z.string().min(1),
  requested_at: z.string().datetime().nullable().optional(),
  processed_at: z.string().datetime().nullable().optional(),
  sender: ProfileSchema.nullable().optional(),
}).passthrough();

// ==========================================
// Wallet Schemas
// ==========================================

export const WalletSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  total_balance: z.number().int().min(0),
  available_balance: z.number().int().min(0),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
}).passthrough();

// ==========================================
// Earnings Schemas
// ==========================================

export const EarningsSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  payment_id: z.string().uuid().nullable().optional(),
  booking_id: z.string().uuid().nullable().optional(),
  total_collected: z.number().int().min(0),
  admin_deduction: z.number().int().min(0),
  platform_fee: z.number().int().min(0),
  status: z.enum(['pending', 'approved', 'rejected']),
  created_at: z.string().datetime().nullable().optional(),
}).passthrough();

export const EarningsSummarySchema = z.object({
  success: z.boolean(),
  wallet: WalletSchema.nullable(),
  earnings: z.array(EarningsSchema),
  eligibility: z.object({
    is_eligible: z.boolean(),
    reason: z.string().nullable().optional(),
  }).nullable().optional(),
}).passthrough();

// ==========================================
// Validation Helper Function
// ==========================================

/**
 * Safely parse and validate API response data
 * @param {*} data - Data to validate
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {string} endpoint - API endpoint name (for error messages)
 * @returns {{success: boolean, data: *, error: *}} Validation result
 */
export const validateResponse = (data, schema, endpoint = 'unknown') => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated, error: null };
  } catch (error) {
    console.error(`❌ Response validation failed for ${endpoint}:`, error.errors);
    return {
      success: false,
      data: null,
      error: {
        message: `Invalid response format from ${endpoint}`,
        details: error.errors,
        originalError: error,
      },
    };
  }
};
