import { describe, it, expect } from 'vitest';

// Mock D1 database for testing
function createMockD1() {
  const data = [];
  return {
    prepare: (sql) => ({
      bind: (...args) => ({
        run: async () => {
          if (sql.includes('INSERT')) {
            const [email, docket_number] = args;
            // Check for duplicates
            if (data.some(item => item.email === email && item.docket_number === docket_number)) {
              throw new Error('UNIQUE constraint failed');
            }
            data.push({ 
              id: data.length + 1, 
              email, 
              docket_number, 
              created_at: args[2] || Math.floor(Date.now() / 1000)
            });
            return { success: true };
          }
          if (sql.includes('DELETE')) {
            const [id] = args;
            const index = data.findIndex(item => item.id === id);
            if (index > -1) data.splice(index, 1);
            return { success: true };
          }
          return { success: true };
        },
        all: async () => ({
          results: sql.includes('WHERE email = ?') 
            ? data.filter(item => item.email === args[0])
            : data
        }),
        first: async () => {
          const filtered = sql.includes('WHERE email = ?') 
            ? data.filter(item => item.email === args[0])
            : data;
          return filtered[0] || null;
        }
      })
    })
  };
}

describe('Database Operations', () => {
  it('should insert subscription successfully', async () => {
    const db = createMockD1();
    
    const result = await db.prepare('INSERT INTO subscriptions (email, docket_number, created_at) VALUES (?, ?, ?)')
      .bind('test@example.com', '23-108', Math.floor(Date.now() / 1000))
      .run();
    
    expect(result.success).toBe(true);
  });

  it('should prevent duplicate subscriptions', async () => {
    const db = createMockD1();
    
    // First subscription
    await db.prepare('INSERT INTO subscriptions (email, docket_number, created_at) VALUES (?, ?, ?)')
      .bind('test@example.com', '23-108', Math.floor(Date.now() / 1000))
      .run();
    
    // Duplicate subscription should fail
    await expect(
      db.prepare('INSERT INTO subscriptions (email, docket_number, created_at) VALUES (?, ?, ?)')
        .bind('test@example.com', '23-108', Math.floor(Date.now() / 1000))
        .run()
    ).rejects.toThrow('UNIQUE constraint failed');
  });

  it('should retrieve subscriptions by email', async () => {
    const db = createMockD1();
    
    // Add subscription
    await db.prepare('INSERT INTO subscriptions (email, docket_number, created_at) VALUES (?, ?, ?)')
      .bind('test@example.com', '23-108', Math.floor(Date.now() / 1000))
      .run();
    
    // Retrieve subscriptions
    const result = await db.prepare('SELECT * FROM subscriptions WHERE email = ?')
      .bind('test@example.com')
      .all();
    
    expect(result.results).toHaveLength(1);
    expect(result.results[0].email).toBe('test@example.com');
    expect(result.results[0].docket_number).toBe('23-108');
  });

  it('should delete subscription by id', async () => {
    const db = createMockD1();
    
    // Add subscription
    await db.prepare('INSERT INTO subscriptions (email, docket_number, created_at) VALUES (?, ?, ?)')
      .bind('test@example.com', '23-108', Math.floor(Date.now() / 1000))
      .run();
    
    // Delete subscription
    const result = await db.prepare('DELETE FROM subscriptions WHERE id = ?')
      .bind(1)
      .run();
    
    expect(result.success).toBe(true);
  });
}); 