/**
 * Eastern Time utilities for intelligent cron scheduling
 * Integrates with existing cron system to add timezone awareness
 */

/**
 * Get current Eastern Time information
 */
export function getETTimeInfo() {
  const now = new Date();
  const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const etHour = etTime.getHours();
  
  // Determine if DST is active
  const january = new Date(now.getFullYear(), 0, 1);
  const july = new Date(now.getFullYear(), 6, 1);
  const standardTimezoneOffset = Math.max(january.getTimezoneOffset(), july.getTimezoneOffset());
  const isDST = now.getTimezoneOffset() < standardTimezoneOffset;
  
  return {
    etTime,
    etHour,
    isDST,
    utcOffset: isDST ? -4 : -5 // EDT = UTC-4, EST = UTC-5
  };
}

/**
 * Check if current time is in FCC business hours (8 AM - 6 PM ET)
 * Based on your requirement for cost optimization during quiet hours
 */
export function isFCCBusinessHours(): boolean {
  const etHour = getETTimeInfo().etHour;
  return etHour >= 8 && etHour < 18; // 8 AM to 6 PM ET
}

/**
 * Check if current time is evening processing hours (6 PM - 10 PM ET)
 * Reduced frequency but still monitor for urgent filings
 */
export function isEveningHours(): boolean {
  const etHour = getETTimeInfo().etHour;
  return etHour >= 18 && etHour < 22; // 6 PM to 10 PM ET
}

/**
 * Check if current time is quiet hours (10 PM - 8 AM ET)
 */
export function isQuietHours(): boolean {
  const etHour = getETTimeInfo().etHour;
  return etHour >= 22 || etHour < 8; // 10 PM through 7:59 AM
}

/**
 * Get processing strategy based on current ET time
 */
export function getProcessingStrategy(): {
  shouldProcess: boolean;
  processingType: 'business_hours' | 'evening' | 'quiet' | 'morning_catchup';
  lookbackHours: number;
  batchSize: number;
} {
  const etHour = getETTimeInfo().etHour;
  
  if (etHour === 8) {
    // 8 AM catch-up processing
    return {
      shouldProcess: true,
      processingType: 'morning_catchup',
      lookbackHours: 12, // Cover overnight period
      batchSize: 10 // Larger batch for catch-up
    };
  } else if (isFCCBusinessHours()) {
    // Business hours - full processing
    return {
      shouldProcess: true,
      processingType: 'business_hours',
      lookbackHours: 2,
      batchSize: 5 // Current production limit
    };
  } else if (isEveningHours()) {
    // Evening - reduced processing
    return {
      shouldProcess: true,
      processingType: 'evening',
      lookbackHours: 4, // Check more to catch evening filings
      batchSize: 3
    };
  } else {
    // Quiet hours - skip processing
    return {
      shouldProcess: false,
      processingType: 'quiet',
      lookbackHours: 0,
      batchSize: 0
    };
  }
}

/**
 * Get next scheduled processing time for logging
 */
export function getNextProcessingTime(): string {
  const etHour = getETTimeInfo().etHour;
  
  if (isQuietHours() && etHour < 8) {
    return '8:00 AM ET (morning catch-up)';
  } else if (isQuietHours() && etHour >= 22) {
    return '8:00 AM ET (next day)';
  } else {
    const nextHour = ((etHour + 2) % 24); // Every 2 hours
    const period = nextHour < 12 ? 'AM' : 'PM';
    const displayHour = nextHour === 0 ? 12 : nextHour > 12 ? nextHour - 12 : nextHour;
    return `${displayHour}:00 ${period} ET`;
  }
} 