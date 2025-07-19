# Stripe Integration Architecture - SimpleDCC

## Overview
This document outlines the complete Stripe payment integration implemented in SimpleDCC, a FCC docket monitoring service. The integration enables users to upgrade from a free tier to a Pro subscription ($4.99/month) with a 30-day trial period.

## Architecture Components

### 1. Frontend Integration

#### Upgrade Page (`src/routes/upgrade/+page.svelte`)
- **Purpose**: Main conversion page for Pro tier upgrades
- **Design**: ChatPRD-inspired, single-screen compact layout
- **Features**:
  - Email pre-filling from URL parameters or user session
  - Pro tier pricing display ($4.99/month)
  - 30-day trial messaging
  - Direct Stripe Checkout integration
- **Key Functions**:
  - `startProTrial()`: Initiates Stripe Checkout Session
  - Success/error handling from Stripe redirects
  - SSR-safe window object access

#### Server-Side Loading (`src/routes/upgrade/+page.server.ts`)
- **Purpose**: Pre-fill user email from URL parameters
- **Security**: Server-side parameter extraction prevents client-side tampering
- **Data Flow**: URL → Server Load → Component Props

#### Client-Side Stripe (`src/lib/stripe/client.ts`)
- **Purpose**: Exposes publishable key for frontend Stripe.js
- **Environment**: Uses `VITE_STRIPE_PUBLISHABLE_KEY` for client-side access
- **Security**: Publishable key is safe for client-side exposure

### 2. Backend API Integration

#### Checkout Session Creation (`src/routes/api/stripe/create-checkout-session/+server.ts`)
**Core Logic**:
1. User lookup/creation in database
2. Stripe Customer creation (if needed)
3. Checkout Session configuration with trial

**Key Features**:
- 30-day trial period setup
- Stripe Link integration (automatic)
- Customer data auto-collection
- Payment method saving for future use

**Database Operations**:
- User existence validation
- Stripe Customer ID storage
- User tier checking (prevent duplicate upgrades)

#### Webhook Handler (`src/routes/api/stripe/webhook/+server.ts`)
**Event Handling**:
- `customer.subscription.created`: New subscription activation
- `customer.subscription.updated`: Plan changes, renewals
- `customer.subscription.deleted`: Cancellations
- `customer.subscription.trial_will_end`: Trial expiration warnings
- `invoice.payment_failed`: Payment failures
- `invoice.payment_succeeded`: Successful payments

**Security**:
- Webhook signature verification using `STRIPE_WEBHOOK_SECRET`
- Idempotency handling for duplicate events

### 3. Database Schema

#### Users Table Extensions
```sql
-- New columns added via migration 014_stripe_subscription_columns.sql
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN subscription_status TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
```

#### Existing Schema Support
- `user_tier`: 'free', 'trial', 'pro'
- `trial_expires_at`: Unix timestamp for trial expiration
- `created_at`: User registration timestamp

### 4. Stripe SDK Integration

#### Lazy Initialization (`src/lib/stripe/stripe.ts`)
**Problem Solved**: Prevents build-time errors when Stripe SDK tries to access environment variables during SSR bundling.

**Implementation**:
```typescript
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
    });
  }
  return stripeInstance;
}
```

### 5. User Management Operations

#### Core Functions (`src/lib/users/user-operations.ts`)
- `updateUserStripeCustomerId()`: Links Stripe Customer to user record
- `updateUserSubscriptionStatus()`: Updates subscription state
- `getUserByStripeCustomerId()`: Reverse lookup for webhook processing
- `getUserSubscriptionInfo()`: Current subscription details
- `cancelUserSubscription()`: Handles cancellation flow
- `userHasProAccess()`: Access control helper

#### Cron Worker Sync
Identical functions replicated in `cron-worker/src/lib/users/user-operations.ts` for notification processing access control.

## Environment Variables

### Required Configuration
1. **STRIPE_SECRET_KEY**: Server-side API key (sk_test_* or sk_live_*)
2. **STRIPE_PRO_PRICE_ID**: Product price ID for $4.99/month subscription (price_*)
3. **STRIPE_WEBHOOK_SECRET**: Webhook endpoint verification secret (whsec_*)
4. **VITE_STRIPE_PUBLISHABLE_KEY**: Client-side publishable key (pk_test_* or pk_live_*)

### Security Considerations
- No `.env` files committed to repository
- All secrets stored in Cloudflare Pages environment variables
- Local development uses PowerShell script (`start-dev.ps1`) - excluded from git
- Client-side variables use `VITE_` prefix for SvelteKit exposure

## Data Flow

### Subscription Creation Flow
1. User visits `/upgrade` page (email pre-filled if available)
2. User clicks "Start Pro Trial" button
3. Frontend calls `/api/stripe/create-checkout-session` with email
4. Backend:
   - Validates user doesn't already have Pro
   - Creates/retrieves user record
   - Creates Stripe Customer (if needed)
   - Creates Checkout Session with 30-day trial
5. User redirected to Stripe Checkout
6. After payment method entry, Stripe processes trial subscription
7. Webhook events update user status in database
8. User redirected back to success page

### Webhook Processing Flow
1. Stripe sends webhook to `/api/stripe/webhook`
2. Signature verification ensures authentic request
3. Event type determines processing logic
4. Database updated with new subscription status
5. User tier and access permissions updated

## Integration Points

### SvelteKit Framework
- Server-side API routes handle Stripe communication
- Client-side components manage user interaction
- SSR-safe implementation prevents build-time errors

### Cloudflare Platform
- Pages deployment hosts SvelteKit application
- Functions provide serverless API endpoints
- D1 database stores user and subscription data
- Environment variables manage secure configuration

### Email System Integration
- User tier checking in notification system
- Pro-only features (AI summaries, instant notifications)
- Trial expiration handling in cron worker

## Error Handling

### Common Issues
1. **Environment Variable Missing**: Graceful error messages, no service crash
2. **Stripe API Errors**: Proper error propagation with user-friendly messages
3. **Database Failures**: Transaction rollback and error logging
4. **Webhook Signature Failures**: Security logging and request rejection

### Monitoring
- System health logs track integration status
- Webhook events logged for audit trail
- Failed payment notifications to admin
- Trial expiration alerts

## Testing Strategy

### Local Development
- UI/UX testing without actual Stripe calls
- API endpoint structure validation
- Database operation testing

### Production Validation
- Full payment flow testing on live Stripe
- Webhook endpoint verification
- Database synchronization confirmation

## Security Model

### Payment Data
- No payment information stored locally
- Stripe handles all PCI compliance
- Customer payment methods managed by Stripe

### User Data Protection
- Minimal user data sharing with Stripe (email only)
- Stripe Customer ID acts as secure reference
- Database queries use indexed lookups

### API Security
- Server-side only Stripe SDK usage
- Webhook signature verification
- Environment variable protection

## Future Considerations

### Scalability
- Webhook idempotency for high-volume processing
- Database indexing on Stripe relationship fields
- Lazy Stripe client initialization prevents memory issues

### Feature Extensions
- Multiple subscription tiers
- Annual billing options
- Usage-based pricing models
- Customer portal integration

### Monitoring Enhancements
- Stripe Dashboard integration
- Revenue analytics tracking
- Churn analysis and prevention

## Dependencies

### NPM Packages
- `stripe`: Official Stripe Node.js SDK
- `@sveltejs/kit`: Framework for API routes and SSR

### Platform Dependencies
- Cloudflare Pages (hosting)
- Cloudflare Workers (webhook processing)
- Cloudflare D1 (database)
- Stripe (payment processing)

---

**Last Updated**: January 2025  
**Integration Status**: Fully Implemented  
**Production Ready**: Yes (pending final environment variable configuration) 

---

## Environment Variables Update (January 2025)

### Critical Variables Added for Production Fix

The following environment variables were added to resolve Stripe integration issues:

1. **VITE_STRIPE_PUBLISHABLE_KEY**
   - Same value as STRIPE_PUBLISHABLE_KEY but with VITE_ prefix
   - Required for SvelteKit frontend access to Stripe publishable key
   - Example: pk_test_1234567890abcdef

2. **PUBLIC_ORIGIN** 
   - Production domain URL for Stripe redirects and webhooks
   - Format: https://your-domain.com
   - Example: https://simpledcc.pages.dev

### Configuration Steps
1. Add both variables to Cloudflare Pages environment settings
2. Ensure VITE_STRIPE_PUBLISHABLE_KEY matches STRIPE_PUBLISHABLE_KEY value
3. Set PUBLIC_ORIGIN to actual production domain
4. Redeploy application to activate changes

### Troubleshooting
- Use /admin/stripe-diagnostics to verify all environment variables
- "Environment Variables Check Failed" indicates missing VITE_ or PUBLIC_ORIGIN variables
- Environment variable changes require full redeployment

**Last Updated**: January 2025 - Environment variables configuration fix
