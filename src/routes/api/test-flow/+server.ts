import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ request, platform, url }) => {
  // Only allow in development mode
  if (!dev) {
    return json({ error: 'Test endpoint only available in development' }, { status: 403 });
  }

  try {
    const { email, docket_number } = await request.json();
    
    if (!email || !docket_number) {
      return json({ error: 'Email and docket_number required for flow test' }, { status: 400 });
    }

    // Validate email format
    const isValidEmail = !!(email && email.includes('@') && email.includes('.'));
    
    // Validate docket format (XX-XXX)
    const isValidDocket = !!(docket_number && /^\d{2}-\d{2,3}$/.test(docket_number.trim()));

    const now = Date.now();
    const oneHourFromNow = now + (60 * 60 * 1000);
    const mockToken = 12345; // Mock pending signup ID
    
    // Test database connection
    let dbConnected = false;
    let dbError = null;
    try {
      if (platform?.env?.DB) {
        // Try a simple query to test connection
        await platform.env.DB.prepare('SELECT 1').first();
        dbConnected = true;
      }
    } catch (error) {
      dbError = error.message;
    }

    // Mock what each step would do
    const flowTest = {
      input_validation: {
        email_valid: isValidEmail,
        docket_valid: isValidDocket,
        email_normalized: email.toLowerCase()
      },
      
      database_connection: {
        connected: dbConnected,
        error: dbError
      },

      step1_pending_creation: {
        description: `Would create pending signup record with email ${email}, docket ${docket_number}`,
        sql_query: `INSERT INTO pending_signups (email, docket_number, status, expires_at, created_at) VALUES ('${email.toLowerCase()}', '${docket_number}', 'pending', ${oneHourFromNow}, ${now})`,
        mock_response: {
          success: true,
          redirect: `/upgrade?token=${mockToken}`
        }
      },

      step2_lookup: {
        description: `Would lookup pending signup for token ${mockToken}`,
        sql_query: `SELECT id, email, docket_number, status, expires_at FROM pending_signups WHERE id = ${mockToken}`,
        mock_response: {
          email: email.toLowerCase(),
          docket_number: docket_number
        }
      },

      step3_free_completion: {
        description: `Would create free user account and subscription for ${email}`,
        operations: [
          "Check if user exists with getUserByEmail()",
          "Create user with createUser() - tier: 'free'",
          "Create subscription with createUserSubscription()",
          "Create session with createUserSession()",
          "Set 'user_session' cookie",
          "Mark pending signup as completed"
        ],
        sql_queries: [
          `SELECT * FROM users WHERE email = '${email.toLowerCase()}'`,
          `INSERT INTO users (email, user_tier, created_at, ...) VALUES ('${email.toLowerCase()}', 'free', ${now}, ...)`,
          `INSERT INTO subscriptions (user_id, docket_number, tier, ...) VALUES (USER_ID, '${docket_number}', 'free', ...)`,
          `UPDATE users SET session_token = 'UUID', session_expires = ${now + (30 * 24 * 60 * 60 * 1000)} WHERE id = USER_ID`,
          `UPDATE pending_signups SET status = 'completed', completed_at = ${now}, user_id = USER_ID WHERE id = ${mockToken}`
        ],
        mock_response: {
          success: true,
          redirect: '/manage'
        }
      },

      step4_stripe_session: {
        description: `Would create Stripe checkout session for pro trial`,
        stripe_config: {
          price_id: "price_1QQPAkCJaxUnOvgcgRqBJoKG",
          trial_days: 14,
          mode: "subscription"
        },
        stripe_metadata: {
          pending_signup_id: mockToken.toString(),
          docket_number: docket_number
        },
        success_url: `${url.origin}/api/stripe-success?session_id={CHECKOUT_SESSION_ID}&token=${mockToken}`,
        cancel_url: `${url.origin}/upgrade?token=${mockToken}&cancelled=true`
      },

      step5_stripe_completion: {
        description: `Would complete pro signup after Stripe payment`,
        operations: [
          "Validate Stripe session and subscription",
          "Create pro user with createUser() - tier: 'pro'", 
          "Create pro subscription with Stripe details",
          "Create session and set cookie",
          "Mark pending signup as completed"
        ],
        webhook_handling: {
          subscription_created: "Would update user tier based on pending_signup_id metadata",
          subscription_updated: "Would handle tier changes (trial → pro → cancelled)"
        }
      },

      function_signatures: {
        createUser: "createUser(userObject, db) → Promise<User>",
        createUserSession: "createUserSession(userId: number, extendedSession: boolean = false, db) → Promise<{sessionToken, sessionExpires}>",
        getUserByEmail: "getUserByEmail(email: string, db) → Promise<User | null>",
        createUserSubscription: "createUserSubscription(subscriptionObject, db) → Promise<void>"
      },

      required_database_tables: [
        "pending_signups (id, email, docket_number, status, expires_at, created_at, completed_at, user_id, stripe_session_id)",
        "users (session_token, session_expires columns required for manage page)",
        "subscriptions (standard subscription table)"
      ],

      potential_issues: [
        dbConnected ? null : "Database connection failed",
        isValidEmail ? null : "Invalid email format", 
        isValidDocket ? null : "Invalid docket format (should be XX-XXX)",
        "Pending signups table must exist before testing",
        "Session cookie name MUST be 'user_session' (not 'session')",
        "Stripe webhook endpoint must handle pending_signup_id metadata"
      ].filter(Boolean),

      next_steps: [
        "Create pending_signups table in database",
        "Test Step 1: POST to /api/create-pending-signup",
        "Test Step 2: Visit /upgrade?token={id} to verify lookup",
        "Test Step 3: Click 'Continue with Free' button",
        "Test Step 4: Click 'Start Pro Trial' button",
        "Verify session creation and /manage redirect"
      ]
    };

    return json(flowTest, { status: 200 });

  } catch (error) {
    return json({ 
      error: 'Test flow validation failed',
      details: error.message 
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async () => {
  if (!dev) {
    return json({ error: 'Test endpoint only available in development' }, { status: 403 });
  }

  return json({
    message: 'Pending signup flow test endpoint',
    usage: 'POST with { email, docket_number } to simulate the complete flow',
    example: {
      email: 'test@example.com',
      docket_number: '11-42'
    }
  });
}; 