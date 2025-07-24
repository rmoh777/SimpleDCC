# SimpleDCC Authentication & Payment Flow Documentation

## Overview

SimpleDCC uses a dual authentication system supporting both email-based signup with pending verification and Google OAuth. The payment flow integrates with Stripe for pro tier subscriptions, offering a 30-day trial period. This document details the complete user journey from initial signup through payment to accessing the dashboard.

## Architecture Components

### Authentication Methods

1. **Email-Based Signup (Pending Flow)**
   - User provides email and docket number
   - Creates pending signup record with 1-hour expiration
   - Token-based verification for security
   - Supports both free and pro tier selection

2. **Google OAuth**
   - Direct account creation via Google
   - Automatic session creation
   - Bypasses pending signup flow
   - Immediate access to dashboard

### Database Tables

```sql
-- Users table
users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  session_token TEXT,
  tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Pending signups table
pending_signups (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  docket_number TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  completed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Subscriptions table
subscriptions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  docket_number TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily',
  active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

## User Flow Paths

### Path 1: Email Signup → Free Tier

1. **Homepage Form Submission**
   - User enters email and docket number
   - Form posts to `/api/create-pending-signup`
   - Rate limited: 3 requests per 5 minutes per email

2. **Pending Signup Creation**
   ```javascript
   // Creates record in pending_signups table
   {
     id: crypto.randomUUID(),
     email: user_email,
     docket_number: validated_docket,
     expires_at: new Date(Date.now() + 3600000) // 1 hour
   }
   ```

3. **Redirect to Upgrade Page**
   - Browser redirected to `/upgrade?token={pending_id}`
   - Token validated server-side
   - Pending signup data displayed

4. **Free Tier Selection**
   - User clicks "Continue with Free"
   - Posts to `/api/complete-free-signup`
   - Creates user account with tier='free'
   - Creates subscription record
   - Sets session cookie

5. **Dashboard Access**
   - Redirected to `/manage`
   - Session validated via cookie
   - Free tier features available

### Path 2: Email Signup → Pro Trial (Stripe)

1. **Steps 1-3 same as Path 1**

2. **Pro Trial Selection**
   - User clicks "Start Pro Trial"
   - Posts to `/api/create-stripe-session`

3. **Stripe Customer Creation**
   ```javascript
   // First-time Stripe interaction
   const customer = await stripe.customers.create({
     email: pendingSignup.email,
     metadata: {
       docket_number: pendingSignup.docket_number,
       pending_signup_id: token
     }
   });
   // Store customer ID in pending_signups
   ```

4. **Stripe Checkout Session**
   ```javascript
   const session = await stripe.checkout.sessions.create({
     customer: customer.id,
     mode: 'subscription',
     line_items: [{
       price: STRIPE_PRO_PRICE_ID,
       quantity: 1
     }],
     subscription_data: {
       trial_period_days: 30,
       metadata: {
         docket_number: pendingSignup.docket_number,
         pending_signup_id: token
       }
     },
     success_url: `${origin}/api/stripe-success?token=${token}`,
     cancel_url: `${origin}/upgrade?token=${token}`
   });
   ```

5. **Stripe Checkout Page**
   - User enters payment details
   - Stripe handles payment processing
   - Trial starts immediately

6. **Success Callback**
   - Stripe redirects to `/api/stripe-success?token={token}`
   - Endpoint redirects to `/api/complete-stripe-payment?token={token}`

7. **Account Creation**
   ```javascript
   // Complete-stripe-payment endpoint
   - Retrieves pending signup by token
   - Creates user with tier='trial'
   - Stores stripe_customer_id and stripe_subscription_id
   - Sets trial_expires_at to 30 days future
   - Creates subscription record
   - Sets session cookie
   ```

8. **Dashboard Access**
   - Redirected to `/manage`
   - Pro features available during trial

### Path 3: Google OAuth

1. **Google Auth Initiation**
   - User clicks "Sign in with Google"
   - Redirected to `/auth/google`

2. **OAuth Flow**
   ```javascript
   // Using Lucia Auth + Google Provider
   const authUrl = await google.createAuthorizationURL(state, codeVerifier, {
     scopes: ['openid', 'email', 'profile']
   });
   ```

3. **Google Callback**
   - Google redirects to `/auth/google/callback`
   - Code exchanged for tokens
   - User info retrieved

4. **Account Creation/Login**
   ```javascript
   // Check if user exists
   const existingUser = await getUserByGoogleId(googleUser.sub);
   
   if (!existingUser) {
     // Create new user
     const user = await createUser({
       email: googleUser.email,
       google_id: googleUser.sub,
       tier: 'free'
     });
   }
   
   // Create session
   await createUserSession(user.id, false, db);
   ```

5. **Direct Dashboard Access**
   - Session cookie set
   - Redirected to `/manage`
   - No pending signup involved

## Session Management

### Cookie Configuration
```javascript
{
  name: 'user_session',
  value: sessionToken,
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: extendedSession ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days or 24 hours
}
```

### Session Validation
- Every protected route checks session cookie
- Token matched against users.session_token
- Invalid/expired sessions redirect to homepage

## Stripe Webhook Integration

### Webhook Events Handled

1. **checkout.session.completed**
   - Confirms successful payment setup
   - Updates user tier from 'trial' to 'pro' if payment received

2. **customer.subscription.updated**
   - Handles subscription changes
   - Updates trial_expires_at if trial extended

3. **customer.subscription.deleted**
   - Handles cancellations
   - Downgrades user to 'free' tier

### Webhook Flow
```javascript
// Verify webhook signature
const sig = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);

// Handle pending signup flow
if (event.data.object.metadata?.pending_signup_id) {
  // New flow - find user by completed pending signup
  const user = await findUserByCompletedPendingSignup(pending_signup_id);
}
// Handle existing customer flow
else if (event.data.object.customer) {
  // Legacy flow - find by Stripe customer ID
  const user = await getUserByStripeCustomerId(customer_id);
}
```

## Security Considerations

### Rate Limiting
- Pending signup: 3 requests per 5 minutes per email
- Prevents spam and abuse

### Token Security
- UUID v4 tokens (cryptographically secure)
- 1-hour expiration for pending signups
- Tokens invalidated after use

### Session Security
- HTTP-only cookies prevent XSS
- Secure flag ensures HTTPS only
- SameSite protection against CSRF

### Stripe Security
- Webhook signature verification
- Customer IDs stored, not payment details
- PCI compliance maintained

## Error Handling

### Common Error Scenarios

1. **Expired Pending Signup**
   - Status: 410 Gone
   - Message: "This signup link has expired"
   - User must restart signup

2. **Already Completed Signup**
   - Status: 409 Conflict
   - Message: "This signup has already been completed"

3. **Invalid Token**
   - Status: 404 Not Found
   - Message: "Invalid signup token"

4. **Stripe Checkout Failure**
   - User returned to upgrade page
   - Can retry or choose free tier

5. **Session Expiration**
   - Redirect to homepage
   - User must log in again

## Deployment Considerations

### Environment Variables Required
```env
# Database
DATABASE_URL

# Stripe
STRIPE_SECRET_KEY
STRIPE_PRO_PRICE_ID
STRIPE_WEBHOOK_SECRET

# Google OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI

# App
ADMIN_SECRET
PUBLIC_APP_URL
```

### Cloudflare Workers Specifics
- Use `platform.env` not `process.env`
- Stripe initialization: `new Stripe(platform.env.STRIPE_SECRET_KEY)`
- Database access via `platform.env.DB`

## Testing Checklist

### Email Signup Flow
- [ ] Rate limiting works correctly
- [ ] Token expiration enforced
- [ ] Free tier completion creates account
- [ ] Pro trial redirects to Stripe
- [ ] Session cookie set correctly

### Stripe Integration
- [ ] Customer creation successful
- [ ] Checkout session includes trial
- [ ] Success callback processes correctly
- [ ] Webhook updates user data
- [ ] Subscription cancellation handled

### Google OAuth
- [ ] OAuth redirect works
- [ ] New users created correctly
- [ ] Existing users log in properly
- [ ] Session created successfully

### Dashboard Access
- [ ] Session validation works
- [ ] Tier-based features displayed
- [ ] Subscription management functional
- [ ] Logout clears session

## Monitoring & Maintenance

### Key Metrics to Track
- Signup conversion rates (pending → completed)
- Trial to paid conversion rates
- Session duration and activity
- Stripe webhook success rates
- OAuth success/failure rates

### Regular Maintenance Tasks
- Clean up expired pending signups (automated via cron)
- Monitor Stripe webhook failures
- Review session token security
- Update OAuth scopes if needed
- Check rate limiting effectiveness

## Future Enhancements

### Planned Improvements
1. Welcome emails after signup
2. Initial docket seeding for new users
3. Remember me functionality
4. Social login expansion (Twitter, LinkedIn)
5. Two-factor authentication
6. Account recovery flow
7. Team/organization accounts

### Technical Debt
- Consolidate user creation logic
- Improve error messages
- Add comprehensive logging
- Implement retry logic for Stripe
- Cache session lookups

## Support & Troubleshooting

### Common User Issues

1. **"I paid but can't access pro features"**
   - Check Stripe webhook logs
   - Verify user.tier updated
   - Confirm subscription active

2. **"My session keeps expiring"**
   - Check cookie settings
   - Verify clock synchronization
   - Review session duration

3. **"I can't complete signup"**
   - Check rate limiting
   - Verify email format
   - Test token generation

### Debug Endpoints (Admin Only)
- `/admin/stripe-diagnostics` - Test Stripe configuration
- `/admin/database-viewer` - Inspect user records
- `/admin/monitoring` - System health checks

## Conclusion

The SimpleDCC authentication and payment flow provides a robust, secure system for user onboarding with multiple paths to account creation. The integration of pending signups, Stripe payments, and Google OAuth offers flexibility while maintaining security and user experience standards. 