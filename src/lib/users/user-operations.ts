import type { User } from '$lib/database/schema-types';

/**
 * Create or retrieve user account by email
 * Integrates with existing email-based subscription system
 */
export async function createOrGetUser(email: string, db: any): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if user already exists
  const existingUser = await getUserByEmail(normalizedEmail, db);
  if (existingUser) {
    return existingUser;
  }
  
  // Create new user account
  const result = await db.prepare(`
    INSERT INTO users (email, user_tier, created_at)
    VALUES (?, 'free', ?)
  `).bind(normalizedEmail, Math.floor(Date.now() / 1000)).run();
  
  if (!result.success) {
    throw new Error('Failed to create user account');
  }
  
  return await getUserById(result.meta.last_row_id, db);
}

/**
 * Get user by email address
 */
export async function getUserByEmail(email: string, db: any): Promise<User | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(normalizedEmail).first();
    
    return result || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number, db: any): Promise<User | null> {
  try {
    const result = await db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(userId).first();
    
    return result || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Update user tier (free → trial → pro)
 */
export async function updateUserTier(
  userId: number, 
  newTier: 'free' | 'pro' | 'trial', 
  trialExpiresAt?: number,
  db: any
): Promise<User> {
  try {
    await db.prepare(`
      UPDATE users 
      SET user_tier = ?, 
          trial_expires_at = ?,
          grace_period_until = NULL
      WHERE id = ?
    `).bind(newTier, trialExpiresAt || null, userId).run();
    
    const updatedUser = await getUserById(userId, db);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user tier:', error);
    throw new Error('Failed to update user tier');
  }
}

/**
 * Get user's subscription preferences
 */
export async function getUserSubscriptions(userId: number, db: any) {
  try {
    const result = await db.prepare(`
      SELECT s.*, u.user_tier, u.trial_expires_at
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).bind(userId).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    return [];
  }
}

/**
 * Check if user has been notified about a specific filing
 */
export async function hasUserBeenNotified(
  userId: number, 
  filingId: string, 
  notificationType: string,
  db: any
): Promise<boolean> {
  try {
    const result = await db.prepare(`
      SELECT id FROM user_notifications 
      WHERE user_id = ? AND filing_id = ? AND notification_type = ?
    `).bind(userId, filingId, notificationType).first();
    
    return !!result;
  } catch (error) {
    console.error('Error checking user notification:', error);
    return false;
  }
}

/**
 * Mark user as notified for a filing
 */
export async function markUserNotified(
  userId: number,
  filingId: string, 
  notificationType: string,
  db: any
): Promise<void> {
  try {
    await db.prepare(`
      INSERT OR IGNORE INTO user_notifications (user_id, filing_id, notification_type, sent_at)
      VALUES (?, ?, ?, ?)
    `).bind(userId, filingId, notificationType, Math.floor(Date.now() / 1000)).run();
  } catch (error) {
    console.error('Error marking user notified:', error);
  }
}

/**
 * Get all users for admin dashboard
 */
export async function getAllUsers(db: any, limit: number = 100, offset: number = 0) {
  try {
    const result = await db.prepare(`
      SELECT u.*, 
             COUNT(s.id) as subscription_count,
             MAX(s.last_notified) as last_notification
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

/**
 * Get user count by tier for admin dashboard
 */
export async function getUserTierStats(db: any) {
  try {
    const result = await db.prepare(`
      SELECT 
        user_tier,
        COUNT(*) as count,
        COUNT(CASE WHEN trial_expires_at > ? THEN 1 END) as active_trials
      FROM users
      GROUP BY user_tier
    `).bind(Math.floor(Date.now() / 1000)).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Error getting user tier stats:', error);
    return [];
  }
}

/**
 * Handle trial expiration - downgrade expired trial users to free
 */
export async function handleTrialExpirations(db: any): Promise<number> {
  try {
    const result = await db.prepare(`
      UPDATE users 
      SET user_tier = 'free', trial_expires_at = NULL
      WHERE user_tier = 'trial' 
        AND trial_expires_at IS NOT NULL 
        AND trial_expires_at < ?
    `).bind(Math.floor(Date.now() / 1000)).run();
    
    return result.changes || 0;
  } catch (error) {
    console.error('Error handling trial expirations:', error);
    return 0;
  }
}

/**
 * Update user's Stripe customer ID
 */
export async function updateUserStripeCustomerId(
  userId: number, 
  stripeCustomerId: string, 
  db: any
): Promise<void> {
  try {
    await db.prepare(`
      UPDATE users 
      SET stripe_customer_id = ?
      WHERE id = ?
    `).bind(stripeCustomerId, userId).run();
  } catch (error) {
    console.error('Error updating user Stripe customer ID:', error);
    throw new Error('Failed to update Stripe customer ID');
  }
}

/**
 * Update user's subscription status from Stripe webhook
 */
export async function updateUserSubscriptionStatus(
  userId: number,
  subscriptionData: {
    tier: 'free' | 'pro' | 'trial';
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    trialExpiresAt?: number;
  },
  db: any
): Promise<User> {
  try {
    await db.prepare(`
      UPDATE users 
      SET user_tier = ?,
          stripe_subscription_id = ?,
          subscription_status = ?,
          trial_expires_at = ?
      WHERE id = ?
    `).bind(
      subscriptionData.tier,
      subscriptionData.stripeSubscriptionId || null,
      subscriptionData.subscriptionStatus || null,
      subscriptionData.trialExpiresAt || null,
      userId
    ).run();
    
    const updatedUser = await getUserById(userId, db);
    if (!updatedUser) {
      throw new Error('User not found after subscription update');
    }
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user subscription status:', error);
    throw new Error('Failed to update subscription status');
  }
}

/**
 * Get user by Stripe customer ID
 */
export async function getUserByStripeCustomerId(stripeCustomerId: string, db: any): Promise<User | null> {
  try {
    const result = await db.prepare(`
      SELECT * FROM users WHERE stripe_customer_id = ?
    `).bind(stripeCustomerId).first();
    
    return result || null;
  } catch (error) {
    console.error('Error getting user by Stripe customer ID:', error);
    return null;
  }
}

/**
 * Get user's current subscription info for dashboard display
 */
export async function getUserSubscriptionInfo(userId: number, db: any) {
  try {
    const user = await getUserById(userId, db);
    if (!user) return null;

    return {
      user_tier: user.user_tier,
      subscription_status: user.subscription_status,
      trial_expires_at: user.trial_expires_at,
      stripe_customer_id: user.stripe_customer_id,
      stripe_subscription_id: user.stripe_subscription_id,
      can_upgrade: user.user_tier === 'free',
      can_cancel: user.user_tier === 'pro' || user.user_tier === 'trial',
      is_trial: user.user_tier === 'trial',
      is_pro: user.user_tier === 'pro'
    };
  } catch (error) {
    console.error('Error getting user subscription info:', error);
    return null;
  }
}

/**
 * Cancel user's subscription (mark for cancellation at period end)
 */
export async function cancelUserSubscription(userId: number, db: any): Promise<boolean> {
  try {
    const user = await getUserById(userId, db);
    if (!user || !user.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    // Update user to free tier immediately
    await db.prepare(`
      UPDATE users 
      SET user_tier = 'free',
          subscription_status = 'canceled',
          trial_expires_at = NULL
      WHERE id = ?
    `).bind(userId).run();

    return true;
  } catch (error) {
    console.error('Error canceling user subscription:', error);
    return false;
  }
}

/**
 * Check if user has access to pro features
 */
export async function userHasProAccess(userId: number, db: any): Promise<boolean> {
  try {
    const user = await getUserById(userId, db);
    if (!user) return false;

    // Pro access for pro users and active trial users
    if (user.user_tier === 'pro') return true;
    
    if (user.user_tier === 'trial' && user.trial_expires_at) {
      return user.trial_expires_at > Math.floor(Date.now() / 1000);
    }

    return false;
  } catch (error) {
    console.error('Error checking pro access:', error);
    return false;
  }
}

/**
 * Link Google account to existing user
 */
export async function linkGoogleAccount(
  userId: number,
  googleId: string,
  googleEmail: string,
  db: any
): Promise<boolean> {
  try {
    const now = Date.now();
    
    await db.prepare(`
      UPDATE users 
      SET google_id = ?, 
          google_email = ?,
          google_linked_at = ?
      WHERE id = ?
    `).bind(googleId, googleEmail, Math.floor(now / 1000), userId).run();
    
    console.log(`✅ Google account linked: ${googleEmail} → user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error linking Google account:', error);
    return false;
  }
}

/**
 * Get user by Google ID
 */
export async function getUserByGoogleId(googleId: string, db: any): Promise<User | null> {
  try {
    const result = await db.prepare(`
      SELECT * FROM users WHERE google_id = ?
    `).bind(googleId).first();
    
    return result || null;
  } catch (error) {
    console.error('Error getting user by Google ID:', error);
    return null;
  }
}

/**
 * Unlink Google account from user
 */
export async function unlinkGoogleAccount(userId: number, db: any): Promise<boolean> {
  try {
    await db.prepare(`
      UPDATE users 
      SET google_id = NULL, 
          google_email = NULL,
          google_linked_at = NULL
      WHERE id = ?
    `).bind(userId).run();
    
    console.log(`✅ Google account unlinked from user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error unlinking Google account:', error);
    return false;
  }
}

/**
 * Create session token (used by both magic link and Google OAuth)
 */
export async function createUserSession(
  userId: number,
  extendedSession: boolean = false,
  db: any
): Promise<{ sessionToken: string; sessionExpires: number } | null> {
  try {
    const sessionToken = crypto.randomUUID();
    const sessionDuration = extendedSession ? 24 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000; // 24 hours or 1 hour
    const sessionExpires = Date.now() + sessionDuration;

    await db.prepare(`
      UPDATE users 
      SET session_token = ?,
          session_expires = ?
      WHERE id = ?
    `).bind(sessionToken, sessionExpires, userId).run();

    return { sessionToken, sessionExpires };
  } catch (error) {
    console.error('Error creating user session:', error);
    return null;
  }
} 