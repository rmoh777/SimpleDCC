# SimpleDCC Stripe Integration Architecture

## Overview
SimpleDCC implements a comprehensive Stripe payment integration for Pro subscriptions with a 30-day trial period. The system includes production payment flows, webhook handling, and an advanced diagnostic system for troubleshooting.

## Architecture Components

### 1. Core Payment Flow
- **Subscription Model**: Monthly recurring billing at $4.99/month
- **Trial Period**: 30-day free trial for all new Pro subscriptions
- **User Tiers**: Free → Trial → Pro workflow
- **Customer Management**: Automatic Stripe customer creation and linking

### 2. Environment Variables
Required environment variables for Cloudflare Pages deployment:

#### Server-Side (Platform Environment)
```bash
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
DATABASE_URL=... # For user management
```

#### Client-Side (Build Environment)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_...
PUBLIC_ORIGIN=https://simpledcc.pages.dev # Your domain
```

### 3. File Structure
```
src/routes/api/
├── stripe/
│   ├── create-checkout-session/+server.ts  # Main checkout endpoint
│   └── webhook/+server.ts                   # Stripe webhook handler
├── admin/stripe-diagnostics/
│   ├── env-check/+server.ts                 # Environment validation
│   ├── stripe-init/+server.ts               # SDK initialization test
│   ├── price-validation/+server.ts          # Price ID validation
│   ├── stripe-customer/+server.ts           # Customer operations test
│   ├── checkout-session/+server.ts          # Checkout session test
│   ├── webhook-test/+server.ts              # Webhook simulation
│   └── full-integration/+server.ts          # End-to-end test
└── admin/
    └── stripe-diagnostics/+page.svelte      # Diagnostic UI
```

## Stripe Diagnostics System

### Purpose
The diagnostic system provides step-by-step testing of the entire Stripe integration to identify and resolve issues quickly. It's accessible at `/admin/stripe-diagnostics`.

### Diagnostic Steps

1. **Environment Check** - Validates all required environment variables
2. **Stripe SDK Initialization** - Tests Stripe SDK setup
3. **Price Validation** - Verifies price ID configuration
4. **Customer Operations** - Tests customer creation/management
5. **Checkout Session Creation** - Tests session configuration
6. **Webhook Simulation** - Tests webhook handling
7. **Full Integration Test** - End-to-end payment flow simulation

### Features
- Real-time step execution with detailed logging
- Error isolation and specific troubleshooting tips
- Safe testing environment (uses test customers/sessions)
- Copy-to-clipboard functionality for error reports
- Visual success/failure indicators

## Critical Issues & Fixes

### 1. Environment Variable Access (Cloudflare Pages)
**Problem**: Using `process.env` in Cloudflare Pages environment
```javascript
// ❌ WRONG - Causes "process is not defined"
const key = process.env.STRIPE_SECRET_KEY;
```

**Solution**: Use `platform.env` in all server-side endpoints
```javascript
// ✅ CORRECT - Works in Cloudflare Pages
const key = platform.env.STRIPE_SECRET_KEY;
```

**Files Affected**: All API endpoints, especially diagnostic endpoints

### 2. Stripe SDK Initialization
**Problem**: Using custom `getStripe()` utility function
```javascript
// ❌ WRONG - Circular dependencies and initialization issues
import getStripe from '$lib/stripe/stripe';
const stripe = getStripe();
```

**Solution**: Direct Stripe initialization
```javascript
// ✅ CORRECT - Direct, reliable initialization
import Stripe from 'stripe';
const stripe = new Stripe(platform.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});
```

### 3. Function Import Mismatches
**Problem**: Importing non-existent functions
```javascript
// ❌ WRONG - Function doesn't exist
import { updateUserSubscriptionData } from '$lib/users/user-operations';
```

**Solution**: Use correct function names
```javascript
// ✅ CORRECT - Function exists
import { updateUserSubscriptionStatus } from '$lib/users/user-operations';
```

### 4. Subscription Mode Payment Method Options (LATEST ISSUE)
**Problem**: Invalid parameter combination in checkout session
```javascript
// ❌ WRONG - Not allowed in subscription mode
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_options: {
    card: {
      setup_future_usage: 'off_session'  // Conflicts with subscription mode
    }
  }
});
```

**Error**: `"You can not pass payment_method_options[setup_future_usage] in subscription mode."`

**Solution**: Remove payment_method_options for subscription mode
```javascript
// ✅ CORRECT - Subscription mode handles payment method storage automatically
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  customer: customerId,
  line_items: [...],
  subscription_data: {
    trial_period_days: 30
  },
  customer_update: {
    name: 'auto',
    address: 'auto'
  },
  // payment_method_options removed - not needed in subscription mode
});
```

**Why This Happens**: 
- Subscription mode automatically saves payment methods for future billing
- `setup_future_usage` is for one-time payments where you want to save the method
- Stripe enforces separation between one-time and subscription payment patterns

## Webhook Integration

### Supported Events
- `customer.subscription.created` - New subscription activation
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription cancellation
- `invoice.payment_failed` - Payment failure handling
- `invoice.payment_succeeded` - Payment success confirmation
- `customer.subscription.trial_will_end` - Trial expiration warnings

### Security
- Webhook signature verification using `STRIPE_WEBHOOK_SECRET`
- Proper error handling and logging
- Database transaction safety

## User Management Integration

### Database Schema
- Users table with `stripe_customer_id` linking
- Subscription status tracking
- Tier management (free/trial/pro)
- Trial expiration dates

### Functions Used
- `createOrGetUser()` - User account management
- `updateUserSubscriptionStatus()` - Subscription state updates
- `getUserByStripeCustomerId()` - Customer lookup
- `updateUserStripeCustomerId()` - Link Stripe customer to user

## Deployment Considerations

### Cloudflare Pages Specific
1. **Environment Variables**: Must use `platform.env` not `process.env`
2. **Build Process**: Ensure all imports are resolvable at build time
3. **Function Signatures**: All handlers must accept `{ request, platform }` parameters
4. **Webhook Endpoints**: Must handle Cloudflare's request/response format

### Production Checklist
- [ ] All environment variables configured in Cloudflare Pages
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Live API keys properly set (not test keys)
- [ ] Price IDs match Stripe Dashboard configuration
- [ ] Domain URLs correctly set in `PUBLIC_ORIGIN`
- [ ] Database schema up to date with user management tables

## Testing Strategy

### Development Testing
1. Use diagnostic page for initial validation
2. Test with Stripe test keys first
3. Verify webhook endpoints with Stripe CLI
4. Check database integration with test users

### Production Validation
1. Run diagnostics with live keys
2. Test actual payment flow with small amounts
3. Verify webhook delivery in Stripe Dashboard
4. Monitor user tier updates in database

## Lessons Learned

### Critical Bugs to Avoid
1. **Never mix `process.env` and `platform.env`** - Causes deployment failures
2. **Don't use custom Stripe utilities** - Direct SDK initialization is more reliable
3. **Verify function exports before importing** - Check actual exported function names
4. **Don't use payment_method_options in subscription mode** - Stripe API restriction
5. **Always test in production-like environment** - Cloudflare Pages behaves differently than local dev

### Best Practices Established
1. **Comprehensive diagnostics first** - Build diagnostic tools before production features
2. **Step-by-step error isolation** - Break complex flows into testable components
3. **Detailed error logging** - Include context and troubleshooting tips
4. **Environment-specific testing** - Test both local and Cloudflare environments
5. **Follow Stripe mode restrictions** - Each checkout mode has specific parameter rules

### Development Workflow
1. Create branch from latest GitHub master
2. Implement fixes with proper testing
3. Use diagnostic page to validate changes
4. Push branch and create PR via CLI
5. Test in production after deployment

## Future Enhancements

### Planned Improvements
- Enhanced error recovery mechanisms
- Automatic retry logic for failed payments
- Advanced subscription management features
- Integration with email notification system
- Real-time subscription status dashboard

### Monitoring & Analytics
- Payment success/failure rates
- Trial conversion metrics
- Customer lifecycle tracking
- Revenue reporting integration

---

**Last Updated**: January 19, 2025
**Status**: Production Ready (pending payment_method_options fix)
**Next Priority**: Remove payment_method_options from subscription checkout sessions
