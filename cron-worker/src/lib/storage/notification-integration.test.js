// Integration tests for notification queuing
import { queueNotificationsForNewFilings } from './notification-integration.js';

/**
 * Mock database for testing
 */
class MockDatabase {
  constructor() {
    this.subscriptions = [
      { email: 'user1@test.com', docket_number: '11-42', frequency: 'daily', user_tier: 'free', id: 1 },
      { email: 'user2@test.com', docket_number: '11-42', frequency: 'weekly', user_tier: 'pro', id: 2 },
      { email: 'user1@test.com', docket_number: '02-6', frequency: 'daily', user_tier: 'free', id: 1 },
      { email: 'user3@test.com', docket_number: '02-6', frequency: 'immediate', user_tier: 'trial', id: 3 }
    ];
    
    this.filings = [
      { id: 'filing1', docket_number: '11-42', created_at: Date.now() - 1000000, status: 'completed' },
      { id: 'filing2', docket_number: '11-42', created_at: Date.now() - 2000000, status: 'completed' },
      { id: 'filing3', docket_number: '02-6', created_at: Date.now() - 500000, status: 'completed' }
    ];
    
    this.queuedNotifications = [];
    this.systemLogs = [];
  }
  
  prepare(query) {
    return {
      bind: (...params) => ({
        all: () => {
          if (query.includes('FROM subscriptions') || query.includes('FROM users u')) {
            // Mock getUsersForNotification response
            const docketNumbers = params;
            return { 
              results: this.subscriptions.filter(sub => 
                docketNumbers.includes(sub.docket_number)
              )
            };
          }
          if (query.includes('FROM filings')) {
            const docketNumber = params[0];
            return { 
              results: this.filings.filter(filing => 
                filing.docket_number === docketNumber
              )
            };
          }
          if (query.includes('FROM system_logs')) {
            return { results: this.systemLogs };
          }
          return { results: [] };
        },
        run: () => {
          if (query.includes('INSERT INTO notification_queue')) {
            this.queuedNotifications.push({ 
              query, 
              params,
              timestamp: Date.now()
            });
          }
          if (query.includes('INSERT INTO system_logs')) {
            this.systemLogs.push({ 
              query, 
              params,
              timestamp: Date.now()
            });
          }
          return { success: true };
        }
      })
    };
  }
}

/**
 * Test notification queuing with new filings
 */
export async function testNotificationQueuing() {
  console.log('🧪 Testing notification queuing with new filings...');
  
  const mockDb = new MockDatabase();
  
  const storageResults = {
    '11-42': { newFilings: 2, duplicates: 0, errors: 0, totalProcessed: 2, enhanced: true },
    '02-6': { newFilings: 1, duplicates: 0, errors: 0, totalProcessed: 1, enhanced: true }
  };
  
  const result = await queueNotificationsForNewFilings(storageResults, mockDb);
  
  console.log('Test Results:', {
    queued: result.queued,
    errors: result.errors,
    queuedNotifications: mockDb.queuedNotifications.length,
    systemLogs: mockDb.systemLogs.length
  });
  
  // Verify expectations
  const success = result.queued > 0 && result.errors.length === 0;
  console.log(success ? '✅ Test passed' : '❌ Test failed');
  
  return success;
}

/**
 * Test with no new filings
 */
export async function testNoNewFilings() {
  console.log('🧪 Testing with no new filings...');
  
  const mockDb = new MockDatabase();
  
  const storageResults = {
    '11-42': { newFilings: 0, duplicates: 5, errors: 0, totalProcessed: 5, enhanced: true }
  };
  
  const result = await queueNotificationsForNewFilings(storageResults, mockDb);
  
  console.log('Test Results:', {
    queued: result.queued,
    errors: result.errors,
    queuedNotifications: mockDb.queuedNotifications.length
  });
  
  // Should not queue any notifications
  const success = result.queued === 0 && result.errors.length === 0;
  console.log(success ? '✅ Test passed' : '❌ Test failed');
  
  return success;
}

/**
 * Test with empty storage results
 */
export async function testEmptyStorageResults() {
  console.log('🧪 Testing with empty storage results...');
  
  const mockDb = new MockDatabase();
  const storageResults = {};
  
  const result = await queueNotificationsForNewFilings(storageResults, mockDb);
  
  console.log('Test Results:', {
    queued: result.queued,
    errors: result.errors
  });
  
  // Should handle empty results gracefully
  const success = result.queued === 0 && result.errors.length === 0;
  console.log(success ? '✅ Test passed' : '❌ Test failed');
  
  return success;
}

/**
 * Test error handling
 */
export async function testErrorHandling() {
  console.log('🧪 Testing error handling...');
  
  // Mock database that throws errors
  const mockDb = {
    prepare: () => {
      throw new Error('Database connection failed');
    }
  };
  
  const storageResults = {
    '11-42': { newFilings: 1, duplicates: 0, errors: 0, totalProcessed: 1 }
  };
  
  const result = await queueNotificationsForNewFilings(storageResults, mockDb);
  
  console.log('Test Results:', {
    queued: result.queued,
    errors: result.errors
  });
  
  // Should handle errors gracefully
  const success = result.queued === 0 && result.errors.length > 0;
  console.log(success ? '✅ Test passed' : '❌ Test failed');
  
  return success;
}

/**
 * Test safety limits
 */
export async function testSafetyLimits() {
  console.log('🧪 Testing safety limits...');
  
  const mockDb = new MockDatabase();
  
  // Add many subscriptions to test limits
  for (let i = 0; i < 150; i++) {
    mockDb.subscriptions.push({
      email: `user${i}@test.com`,
      docket_number: '11-42',
      frequency: 'daily',
      user_tier: 'free',
      id: i + 10
    });
  }
  
  const storageResults = {
    '11-42': { newFilings: 5, duplicates: 0, errors: 0, totalProcessed: 5 }
  };
  
  const result = await queueNotificationsForNewFilings(storageResults, mockDb);
  
  console.log('Test Results:', {
    queued: result.queued,
    errors: result.errors,
    hitSafetyLimit: result.queued >= 100
  });
  
  // Should respect safety limits
  const success = result.queued <= 100;
  console.log(success ? '✅ Test passed' : '❌ Test failed');
  
  return success;
}

/**
 * Test user grouping by frequency
 */
export async function testUserGrouping() {
  console.log('🧪 Testing user grouping by frequency...');
  
  const mockDb = new MockDatabase();
  
  const storageResults = {
    '11-42': { newFilings: 1, duplicates: 0, errors: 0, totalProcessed: 1 }
  };
  
  const result = await queueNotificationsForNewFilings(storageResults, mockDb);
  
  console.log('Test Results:', {
    queued: result.queued,
    errors: result.errors,
    queuedNotifications: mockDb.queuedNotifications.length
  });
  
  // Should group users by email:frequency to avoid duplicate notifications
  // user1@test.com has daily frequency for both 11-42 and 02-6
  // user2@test.com has weekly frequency for 11-42
  // But only 11-42 has new filings, so should queue for both users
  const success = result.queued >= 2 && result.errors.length === 0;
  console.log(success ? '✅ Test passed' : '❌ Test failed');
  
  return success;
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🧪 Running all notification integration tests...\n');
  
  const tests = [
    testNotificationQueuing,
    testNoNewFilings,
    testEmptyStorageResults,
    testErrorHandling,
    testSafetyLimits,
    testUserGrouping
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
      console.log(''); // Add spacing between tests
    } catch (error) {
      console.error(`❌ Test failed with error: ${error.message}`);
      results.push(false);
      console.log('');
    }
  }
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`🧪 Test Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
  }
  
  return passed === total;
}

// Export for use in other test files
export { MockDatabase }; 