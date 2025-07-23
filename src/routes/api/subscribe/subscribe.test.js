import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST, DELETE } from './+server.js';
import * as userOperations from '$lib/users/user-operations';

// Mock D1 database for testing
function createMockD1() {
  const data = [];
  return {
    prepare: (sql) => ({
      bind: (...args) => ({
        run: async () => {
          if (sql.includes('INSERT')) {
            const [user_id, email, docket_number, frequency, created_at] = args;
            // Check for duplicates using user_id and docket_number
            const exists = data.some(item => 
              item.user_id === user_id && item.docket_number === docket_number
            );
            if (exists) {
              throw new Error('UNIQUE constraint failed');
            }
            const newId = data.length + 1;
            data.push({ 
              id: newId, 
              user_id,
              email, 
              docket_number,
              frequency,
              created_at
            });
            return { 
              success: true, 
              meta: { 
                changes: 1, 
                last_row_id: newId 
              } 
            };
          }
          if (sql.includes('DELETE')) {
            const [id] = args;
            const index = data.findIndex(item => item.id === id);
            if (index > -1) {
              data.splice(index, 1);
              return { 
                success: true, 
                meta: { changes: 1 } 
              };
            }
            return { 
              success: true, 
              meta: { changes: 0 } 
            };
          }
          return { success: true };
        },
        first: async () => {
          if (sql.includes('SELECT') && sql.includes('WHERE user_id = ? AND docket_number = ?')) {
            const [user_id, docket_number] = args;
            return data.find(item => 
              item.user_id === user_id && item.docket_number === docket_number
            ) || null;
          }
          return null;
        }
      })
    })
  };
}

describe('Subscribe API - POST', () => {
  beforeEach(() => {
    vi.spyOn(userOperations, 'createOrGetUser').mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      user_tier: 'free',
      trial_expires_at: null,
      stripe_customer_id: null,
      grace_period_until: null,
      created_at: Math.floor(Date.now() / 1000)
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create subscription successfully', async () => {
    const request = {
      json: async () => ({
        email: 'test@example.com',
        docket_number: '23-108'
      })
    };
    const platform = { env: { DB: createMockD1() } };

    const response = await POST({ request, platform });
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully subscribed to docket 23-108');
    expect(result.user_tier).toBe('free');
    expect(result.show_trial_upsell).toBe(true);
  });

  it('should reject invalid email', async () => {
    const request = {
      json: async () => ({
        email: 'invalid-email',
        docket_number: '23-108'
      })
    };
    const platform = { env: { DB: createMockD1() } };

    const response = await POST({ request, platform });
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid email address');
  });

  it('should reject empty email', async () => {
    const request = {
      json: async () => ({
        email: '',
        docket_number: '23-108'
      })
    };
    const platform = { env: { DB: createMockD1() } };

    const response = await POST({ request, platform });
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.message).toContain('Email and docket number are required');
  });

  it('should reject invalid docket number format', async () => {
    const request = {
      json: async () => ({
        email: 'test@example.com',
        docket_number: 'invalid'
      })
    };
    const platform = { env: { DB: createMockD1() } };

    const response = await POST({ request, platform });
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid docket number format');
  });

  it('should handle duplicate subscriptions', async () => {
    const mockDB = createMockD1();
    const requestData = {
      email: 'test@example.com',
      docket_number: '23-108'
    };
    const request = { json: async () => requestData };
    const platform = { env: { DB: mockDB } };

    // First subscription
    await POST({ request, platform });

    // Duplicate subscription
    const response = await POST({ request, platform });
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.message).toContain('Already subscribed');
  });

  it('should handle missing database', async () => {
    const request = {
      json: async () => ({
        email: 'test@example.com',
        docket_number: '23-108'
      })
    };
    const platform = { env: {} }; // No DB

    const response = await POST({ request, platform });
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.message).toContain('Database not available');
  });

  it('should normalize email to lowercase', async () => {
    const request = {
      json: async () => ({
        email: 'TEST@EXAMPLE.COM',
        docket_number: '23-108'
      })
    };
    const platform = { env: { DB: createMockD1() } };

    const response = await POST({ request, platform });
    const result = await response.json();

    expect(result.success).toBe(true);
  });
});

describe('Subscribe API - DELETE', () => {
  beforeEach(() => {
    vi.spyOn(userOperations, 'createOrGetUser').mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      user_tier: 'free',
      trial_expires_at: null,
      stripe_customer_id: null,
      grace_period_until: null,
      created_at: Math.floor(Date.now() / 1000)
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delete subscription successfully', async () => {
    const mockDB = createMockD1();
    const platform = { env: { DB: mockDB } };
    
    // First, add a subscription to delete
    const addRequest = {
      json: async () => ({
        email: 'test@example.com',
        docket_number: '23-108'
      })
    };
    await POST({ request: addRequest, platform });
    
    // Now delete it
    const deleteRequest = {
      json: async () => ({ id: 1 })
    };

    const response = await DELETE({ request: deleteRequest, platform });
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.message).toContain('removed successfully');
  });

  it('should reject missing subscription ID', async () => {
    const request = {
      json: async () => ({})
    };
    const platform = { env: { DB: createMockD1() } };

    const response = await DELETE({ request, platform });
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.message).toContain('Subscription ID required');
  });

  it('should handle non-existent subscription', async () => {
    const request = {
      json: async () => ({ id: 999 })
    };
    const platform = { env: { DB: createMockD1() } };

    const response = await DELETE({ request, platform });
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.message).toContain('Subscription not found');
  });

  it('should handle missing database', async () => {
    const request = {
      json: async () => ({ id: 1 })
    };
    const platform = { env: {} }; // No DB

    const response = await DELETE({ request, platform });
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.message).toContain('Database not available');
  });
}); 