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