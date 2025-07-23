# Signup Flow Implementation Plan

## ⚠️ CRITICAL INSTRUCTIONS FOR CURSOR

**READ THIS SECTION FIRST - DO NOT SKIP**

1. **VERIFY FUNCTION SIGNATURES**: Before calling ANY existing function, check its actual signature in the codebase. Do not assume parameter order or types.

2. **NO FEATURE CREEP**: Implement ONLY what's specified in this document. Do not add analytics, email verification, magic links, or other "enhancements" unless explicitly requested.

3. **TEST EACH STEP**: Implement and test each step individually before moving to the next. Do not implement the entire flow at once.

4. **PRESERVE EXISTING CODE**: Do not modify existing subscription APIs or email sending logic unless explicitly stated.

5. **SESSION CREATION**: When calling session creation functions, verify the exact parameters required. The previous failure was caused by incorrect function parameters.

6. **ERROR HANDLING**: Keep error handling simple - log errors and show user-friendly messages. Do not build complex recovery mechanisms.

## Overview

Transform the current signup flow from:
- **Current**: Email + Docket → Subscription Created → Success Popup
- **New**: Email + Docket → Pending Record → Plan Selection → Full Subscription → Dashboard

## Database Changes (Human Will Handle)

The human will create this table in Cloudflare Console:

```sql
CREATE TABLE pending_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  docket_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  stripe_session_id TEXT,
  expires_at DATETIME DEFAULT (datetime('now', '+1 hour'))
);
```

## Step 1: Create Pending Signup API

**File**: Create new API endpoint `/api/create-pending-signup`

**Input**: `{ email, docket_number }`

**Logic**:
1. Validate email format and docket format (existing validation logic)
2. Check rate limiting: max 3 attempts per email in 5 minutes
3. Create record in `pending_signups` table with status='pending'
4. Return redirect to `/upgrade?token={pending_id}`

**Important**: 
- Use the `pending_id` (integer) as the token, not a cryptographic token
- Do NOT create any user records or subscriptions
- Do NOT send any emails
- Return HTTP redirect response, not JSON

```typescript
// Example structure (verify actual DB syntax)
const result = await db.prepare(`
  INSERT INTO pending_signups (email, docket_number, status) 
  VALUES (?, ?, 'pending')
`).bind(email, docketNumber).run();

return new Response(null, {
  status: 302,
  headers: { Location: `/upgrade?token=${result.meta.last_row_id}` }
});
```

## Step 2: Modify Homepage Form

**File**: Find the current homepage signup form handler

**Changes**:
1. Change the API call from current subscription endpoint to `/api/create-pending-signup`
2. Handle redirect response instead of JSON response
3. Remove success popup display logic

**Important**: Keep all existing validation and UI, just change the endpoint and response handling.

## Step 3: Create Pending Lookup API

**File**: Create new API endpoint `/api/get-pending-signup`

**Input**: `{ token }` (the pending_id from URL)

**Logic**:
1. Look up pending_signups record by ID
2. Check if record exists and not expired
3. Return `{ email, docket_number }` as JSON

**Error Cases**:
- Invalid token: Return 404
- Expired record: Return 410 Gone
- Already completed: Return 409 Conflict

## Step 4: Update Upgrade Page

**File**: `/routes/upgrade/+page.svelte` (or similar)

**Changes**:
1. Read `token` parameter from URL on page load
2. Call `/api/get-pending-signup` to get email/docket
3. Display the information (no email input field needed)
4. Wire up "Select Free" button to new free completion endpoint
5. Wire up "Start Pro Trial" button to new Stripe creation endpoint

**Important**: 
- Handle loading states while fetching pending signup data
- Handle error cases (invalid/expired tokens) by redirecting to homepage
- Keep existing plan display UI, just change the data source and button handlers

## Step 5: Create Free Completion API

**File**: Create new API endpoint `/api/complete-free-signup`

**Input**: `{ token }` (pending_id)

**Logic**:
1. Look up pending_signups record
2. Create full user record and free subscription (use existing subscription creation logic)
3. **VERIFY SESSION FUNCTION SIGNATURE** before calling
4. Create login session using existing session creation function
5. Update pending_signups status to 'completed'
6. Send welcome email using existing email logic
7. Return redirect to `/manage`

**Critical**: 
- Find the existing `createUserSession` function and verify its exact parameters
- Use existing subscription creation logic, don't reinvent it
- Set appropriate cookies for the session

## Step 6: Create Stripe Session API

**File**: Create new API endpoint `/api/create-stripe-session`

**Input**: `{ token }` (pending_id)

**Logic**:
1. Look up pending_signups record
2. Create Stripe checkout session using existing Stripe logic
3. Add `pending_signup_id: token` to Stripe metadata
4. Update pending_signups with `stripe_session_id`
5. Return Stripe checkout URL

**Important**: 
- Use existing Stripe session creation code as template
- Set success_url to `/stripe-success?session_id={CHECKOUT_SESSION_ID}`
- Keep existing webhook URL unchanged

## Step 7: Create Stripe Success Handler

**File**: Create new page `/routes/stripe-success/+page.svelte`

**Logic**:
1. Get `session_id` from URL parameters
2. Show loading spinner
3. Call completion API
4. Redirect to `/manage` on success

**File**: Create new API endpoint `/api/complete-stripe-signup`

**Input**: `{ stripe_session_id }`

**Logic**:
1. Look up pending_signups record by stripe_session_id
2. Get Stripe session details to verify payment
3. Create/update user record and pro subscription (use existing logic)
4. **VERIFY SESSION FUNCTION SIGNATURE** before calling
5. Create login session
6. Update pending_signups status to 'completed'
7. Send welcome email
8. Return success response

## Step 8: Update Stripe Webhook

**File**: Find existing Stripe webhook handler

**Changes**:
1. Add logic to find pending_signups record by session_id
2. Update status to 'completed' when payment succeeds
3. Keep all existing webhook logic intact

**Important**: Do NOT try to create sessions in the webhook. Only update database records.

## Step 9: Add Cleanup to Cron Job

**File**: Find existing cron worker

**Changes**:
1. Add query for old pending records: `status='pending' AND created_at < datetime('now', '-10 minutes') AND stripe_session_id IS NULL`
2. For each record: create free subscription using existing logic
3. Update status to 'converted_to_free'
4. Send "account created" email (can use existing email template)

**Important**: 
- Add this as additional logic to existing cron, don't create new cron
- Check for `stripe_session_id IS NULL` to avoid converting users who started Stripe checkout

## Testing Checklist

Test each step individually before proceeding:

1. **Pending Creation**: Email + docket creates record and redirects
2. **Upgrade Page**: Token lookup works and displays correct info
3. **Free Path**: Free selection creates user and logs in
4. **Stripe Path**: Pro selection goes to Stripe correctly
5. **Stripe Return**: Success page processes payment and logs in
6. **Abandonment**: Cron job converts old pending records

## Error Handling Guidelines

Keep it simple:
- Invalid tokens → redirect to homepage with message
- Database errors → log error, show "try again" message
- Session creation failures → log error, show "contact support"
- Stripe failures → use existing Stripe error handling

## Rollback Plan

If issues arise:
1. Change homepage form back to original endpoint
2. Original flow still works as backup
3. Clean up pending_signups table if needed

## Final Reminders for Cursor

1. **Check function signatures** - the last failure was caused by wrong parameters
2. **Test incrementally** - don't implement everything at once
3. **Keep it simple** - resist the urge to add extra features
4. **Use existing code** - don't rewrite subscription or email logic
5. **Verify each step** - make sure redirects and sessions work before moving on