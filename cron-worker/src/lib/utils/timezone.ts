/**
 * Eastern Time utilities for intelligent cron scheduling
 * Integrates with existing cron system to add timezone awareness
 */

// Configuration constants
const BUSINESS_HOURS_START = 8; // 8 AM ET
const BUSINESS_HOURS_END = 18;  // 6 PM ET
const EVENING_HOURS_END = 22;   // 10 PM ET

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
  return etHour >= BUSINESS_HOURS_START && etHour < BUSINESS_HOURS_END;
}

/**
 * Check if current time is the start of business hours (8 AM ET)
 * Used for daily reset operations like lifting deluge flags
 */
export function isBusinessHoursStart(): boolean {
  const etHour = getETTimeInfo().etHour;
  return etHour === BUSINESS_HOURS_START;
}

/**
 * Check if current time is evening processing hours (6 PM - 10 PM ET)
 * Reduced frequency but still monitor for urgent filings
 */
export function isEveningHours(): boolean {
  const etHour = getETTimeInfo().etHour;
  return etHour >= BUSINESS_HOURS_END && etHour < EVENING_HOURS_END;
}

/**
 * Check if current time is quiet hours (10 PM - 8 AM ET)
 */
export function isQuietHours(): boolean {
  const etHour = getETTimeInfo().etHour;
  return etHour >= EVENING_HOURS_END || etHour < BUSINESS_HOURS_START;
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
  
  if (etHour === BUSINESS_HOURS_START) {
    // Business hours start - morning catch-up processing
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
  
  if (isQuietHours() && etHour < BUSINESS_HOURS_START) {
    return `${BUSINESS_HOURS_START}:00 AM ET (morning catch-up)`;
  } else if (isQuietHours() && etHour >= EVENING_HOURS_END) {
    return `${BUSINESS_HOURS_START}:00 AM ET (next day)`;
  } else {
    const nextHour = ((etHour + 2) % 24); // Every 2 hours
    const period = nextHour < 12 ? 'AM' : 'PM';
    const displayHour = nextHour === 0 ? 12 : nextHour > 12 ? nextHour - 12 : nextHour;
    return `${displayHour}:00 ${period} ET`;
  }
} 