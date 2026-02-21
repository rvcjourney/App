# Razorpay Payout – Implementation Steps

This guide explains how to implement **Razorpay Payout** so that when an admin approves a teacher’s withdrawal request, the money is transferred to the teacher’s bank account via Razorpay.

---

## What you need to provide (to integrate payouts)

To integrate Razorpay Payout for teachers, provide the following. Once these are set, the backend can create Contacts, Fund accounts, and Payouts automatically when admin approves a withdrawal.

| What | Where to get it | Where to set it |
|------|------------------|------------------|
| **1. RazorpayX Current Account number** | [RazorpayX Dashboard](https://dashboard.razorpay.com/) → RazorpayX → **Current Account** → your account number. This is the **source** account from which payouts are sent (not the teacher’s account). | `backend/.env` as `RAZORPAY_PAYOUT_ACCOUNT_NUMBER=7878780080316316` (use your real account number). |
| **2. API keys (for Payout API)** | Same as Payments: [Razorpay Dashboard](https://dashboard.razorpay.com/) → Settings → API Keys. If Payouts use different keys, use the key that has **Payout** permission. | Already in `backend/.env`: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. If you use separate keys for Payouts, add `RAZORPAY_X_KEY_ID` and `RAZORPAY_X_KEY_SECRET` and the code can be updated to use them. |
| **3. IP allowlist** | Razorpay requires allowlisting IPs for Payout API. | [Razorpay – Allowlist IP](https://razorpay.com/docs/x/dashboard/allowlist-ip/): add your backend server’s public IP (or your dev machine IP for testing). |

**Summary:** Set `RAZORPAY_PAYOUT_ACCOUNT_NUMBER` in `backend/.env` with your RazorpayX Current Account number, ensure your existing API keys have Payout access (or add X keys), and allowlist your server IP. After that, when admin approves a withdrawal, the backend will create a Contact (if needed), Fund account (if needed), and then the Payout to the teacher’s bank.

**Integration status:** The backend already implements this flow. If `RAZORPAY_PAYOUT_ACCOUNT_NUMBER` is not set, approve only marks the request as “processing” (no real transfer). Once you add the account number and allowlist your IP, the same approve action will call Razorpay’s Payout API and transfer money to the teacher’s bank.

---

## 1. Banking details in the app (done)

- **Settings → Bank Account** opens the **Bank Account** screen.
- Teachers enter:
  - **Account holder name** (as on bank account)
  - **Bank name** (e.g. HDFC Bank, SBI)
  - **Account number** (9–18 digits)
  - **IFSC code** (11 characters)
- These are saved in the `profiles` table and used when they request a withdrawal. The same fields are required for Razorpay Payout.

---

## 2. Razorpay dashboard setup

1. **RazorpayX / Payouts**
   - Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
   - Enable **RazorpayX** (or **Payouts**) for your account.
   - Complete KYC if required for payouts.



2. **Funding**
   - Add funds to your **Payout / Current Account** (RazorpayX) so you can transfer to beneficiaries.
   - Ensure sufficient balance before processing payouts.

3. **API keys**
   - Use **Key ID** and **Key Secret** (already in `backend/.env` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`).
   - For **RazorpayX Payout API**, confirm in the dashboard whether you use the same keys or separate X API credentials; use the ones shown for “Payouts” / “X”.

4. **IP allowlist (if required)**
   - In Razorpay Dashboard → Settings → **IP allowlist**, add the IP(s) from which your backend will call the Payout API (e.g. your server IP or dev machine IP for testing).

---

## 3. Backend: Razorpay Payout flow (high level)

Razorpay expects:

1. **Contact** – beneficiary (teacher): name, email, phone.
2. **Fund account** – bank account linked to that contact: account holder name, IFSC, account number, (optional) bank name.
3. **Payout** – transfer from your Razorpay account to that fund account.

Suggested flow:

- When a **teacher saves Bank Account** in the app (or on first withdrawal):  
  - Option A: Call your backend to create/update **Contact** + **Fund account** and store `contact_id` and `fund_account_id` (e.g. in `profiles` or a `teacher_fund_accounts` table).  
  - Option B: Create Contact + Fund account **only when admin approves** the first withdrawal for that teacher, then store IDs for future use.
- When **admin approves** a withdrawal request:  
  - Backend creates a **Payout** using the teacher’s `fund_account_id` and the approved amount.  
  - On success, update `withdrawal_requests` (e.g. `status = 'completed'`, `razorpay_payout_id`, `completed_at`) and optionally notify the teacher.

---

## 4. Backend implementation steps (Node.js)

### Step 4.1 – Install Razorpay SDK (if not already)

```bash
cd backend
npm install razorpay
```

### Step 4.2 – Environment variables

In `backend/.env` you already have:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

For **RazorpayX Payouts**, if the dashboard gives different credentials for “X” or “Payouts”, add:

- `RAZORPAY_X_KEY_ID`  
- `RAZORPAY_X_KEY_SECRET`  

Use the appropriate key pair in the client you use for payout API calls (see Razorpay docs for “Payouts” vs “Payments” API).

### Step 4.3 – Create Contact (RazorpayX)

Before creating a fund account, create a **Contact** for the teacher.

- **Inputs:** name, email, phone (from profile or withdrawal context).
- **API:** `POST https://api.razorpay.com/v1/contacts` (or the X endpoint from the docs).
- **Response:** `contact_id`.
- Store `contact_id` (e.g. in `profiles.razorpay_contact_id` or a separate table keyed by `teacher_id`).

### Step 4.4 – Create Fund Account (bank account)

- **Inputs:** `contact_id`, account_type `bank_account`, and:
  - `account_holder_name`
  - `ifsc`
  - `account_number`
- **API:** `POST https://api.razorpay.com/v1/fund_accounts` (or X equivalent).
- **Response:** `fund_account_id`.
- Store `fund_account_id` (e.g. in `profiles.razorpay_fund_account_id` or a table keyed by teacher + account).

You can create one fund account per teacher (one bank account). If a teacher updates bank details, you can create a new fund account and replace the stored ID, or use Razorpay’s update if supported.

### Step 4.5 – (Optional) Fund account validation

- Use Razorpay’s **account validation** API (if enabled for your account) to verify the bank account before the first payout.
- Reduces failed payouts due to wrong account/IFSC.

### Step 4.6 – Create Payout when admin approves

In your existing **approve withdrawal** handler (e.g. `POST /api/admin/withdrawals/:withdrawalId/approve`):

1. Load the withdrawal request and teacher’s `fund_account_id` (and ensure amount ≤ available balance, etc.).
2. Call Razorpay **Create Payout**:
   - **Account number:** Your RazorpayX **payout account number** (from dashboard).
   - **Fund account ID:** teacher’s `fund_account_id`.
   - **Amount:** in paise (e.g. ₹1000 = 100000).
   - **Currency:** `INR`.
   - **Reference ID:** e.g. `withdrawal_requests.id` (for idempotency and reconciliation).
3. On success:
   - Update `withdrawal_requests`: `status = 'completed'`, `razorpay_payout_id = response.id`, `completed_at = now()`.
   - Optionally update wallet (e.g. `withdrawn_amount`) and notify the teacher.
4. On failure:
   - Keep status as `processing` or set to `failed`, store error message, and notify admin/teacher.

Use **idempotency** (same reference_id for the same withdrawal) to avoid duplicate payouts on retries.

---

## 5. Database (optional) for Razorpay IDs

If you want to store Razorpay Contact and Fund account per teacher:

```sql
-- Add to profiles (or create teacher_razorpay table)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS razorpay_contact_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS razorpay_fund_account_id VARCHAR(255);
```

Then in your backend, after creating Contact and Fund account, update the teacher’s row with these IDs so you can reuse them for every payout to that teacher.

---

## 6. Order of operations summary

| Step | Who / When | Action |
|------|------------|--------|
| 1 | Teacher | Fills **Bank Account** in Settings (app already collects and saves to profile). |
| 2 | Backend (on first withdrawal or on save) | Create Razorpay **Contact** + **Fund account**; store `contact_id`, `fund_account_id`. |
| 3 | Teacher | Requests withdrawal (existing flow). |
| 4 | Admin | Approves request (existing flow). |
| 5 | Backend (on approve) | Create Razorpay **Payout** using `fund_account_id` and amount; update `withdrawal_requests` and notify. |

---

## 7. References

- Razorpay **Payouts**: [Razorpay Docs – Payouts](https://razorpay.com/docs/x/payouts/)
- **Fund accounts** (bank): [Razorpay Docs – Fund Accounts](https://razorpay.com/docs/api/x/fund-accounts/)
- **Create payout** (bank): [Razorpay Docs – Create Payout (Bank)](https://razorpay.com/docs/api/x/payouts/create/bank-account/)
- **Account validation** (optional): [Razorpay Docs – Fund Account Validation](https://razorpay.com/docs/x/fund-account-validation/)

Use the exact endpoint URLs and request/response formats from the Razorpay docs for your product (RazorpayX vs standard) and region (India).

---

## 8. Security and compliance

- Store only necessary bank and Razorpay IDs; never log full account numbers.
- Use server-side environment variables for API keys; never expose them in the app.
- Prefer server-to-server calls to Razorpay from your backend; do not call Payout APIs from the mobile app.
- Keep withdrawal approval and payout creation behind admin-only APIs and proper auth.

Once the above steps are implemented, “Bank Account” in Settings will be the single place for payout-ready banking details, and admin approval will trigger the actual Razorpay Payout from your backend.
