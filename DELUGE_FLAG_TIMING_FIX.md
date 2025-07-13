# Deluge Flag Timing Fix Implementation

## Problem Identified

The deluge protection system was not working as intended due to improper timing:

- **Issue**: Deluge flags were being reset **every hour** during cron job runs
- **Impact**: Dockets marked as "deluged" would only stay protected for 1 hour instead of 24 hours
- **Root Cause**: `liftDelugeFlags()` was called at the start of every `scheduled()` function execution

## Solution Implemented

### 1. **Configurable Business Hours Constants**

Added centralized configuration in `cron-worker/src/lib/utils/timezone.ts`:

```typescript
// Configuration constants
const BUSINESS_HOURS_START = 8; // 8 AM ET
const BUSINESS_HOURS_END = 18;  // 6 PM ET
const EVENING_HOURS_END = 22;   // 10 PM ET
```

**Benefits**:
- Single source of truth for business hours
- Easy to modify if business requirements change
- More maintainable than hardcoded values

### 2. **New Helper Function**

Added `isBusinessHoursStart()` function:

```typescript
/**
 * Check if current time is the start of business hours (8 AM ET)
 * Used for daily reset operations like lifting deluge flags
 */
export function isBusinessHoursStart(): boolean {
  const etHour = getETTimeInfo().etHour;
  return etHour === BUSINESS_HOURS_START;
}
```

**Purpose**: Precise detection of when daily reset operations should occur.

### 3. **Updated Cron Job Logic**

Modified `cron-worker/src/index.ts` scheduled function:

**Before** (Every Hour):
```typescript
// Morning reset: Lift all deluge flags
console.log("(INFO) 🌅 Lifting deluge flags...");
await liftDelugeFlags(env);
```

**After** (Only at 8 AM ET):
```typescript
// Daily reset: Lift deluge flags only at start of business hours (8 AM ET)
if (isBusinessHoursStart()) {
  console.log("(INFO) 🌅 Lifting deluge flags at start of business hours...");
  await liftDelugeFlags(env);
}
```

## Impact Analysis

### ✅ **Positive Changes**
- **Deluge protection works correctly**: Flags persist for 24 hours as intended
- **Reduced database operations**: `liftDelugeFlags()` runs 1x/day instead of 24x/day
- **Better user experience**: Deluge notifications are meaningful (not reset hourly)
- **Maintainable code**: Business hours centrally configured

### ✅ **No Breaking Changes**
- All existing cron job functionality preserved
- Same processing strategy logic
- Same quiet hours/business hours behavior
- Same notification queue processing

### ✅ **Improved Logging**
- More descriptive log message: "at start of business hours"
- Clearer understanding of when reset occurs

## Testing Recommendations

### 1. **Verify Timing**
```bash
# Check logs at 8 AM ET to confirm deluge flags are lifted
# Check logs at other hours to confirm they are NOT lifted
```

### 2. **Test Deluge Protection**
```bash
# Manually mark a docket as deluged
wrangler d1 execute DB --remote --command "UPDATE active_dockets SET deluge_mode = 1, deluge_date = '2024-01-15' WHERE docket_number = 'test-docket'"

# Verify it stays deluged until next 8 AM ET
```

### 3. **Monitor Production Logs**
- Look for "Lifting deluge flags at start of business hours" message only at 8 AM ET
- Confirm no "Lifting deluge flags" messages at other hours

## Configuration Changes

If business hours need to change in the future, modify only the constants in `timezone.ts`:

```typescript
const BUSINESS_HOURS_START = 9; // Change to 9 AM ET
const BUSINESS_HOURS_END = 17;  // Change to 5 PM ET
```

All dependent functions will automatically use the new times.

## Files Modified

1. **`cron-worker/src/lib/utils/timezone.ts`**
   - Added business hours constants
   - Added `isBusinessHoursStart()` function
   - Updated existing functions to use constants

2. **`cron-worker/src/index.ts`**
   - Added `isBusinessHoursStart` to imports
   - Updated `scheduled()` function logic
   - Added conditional check for deluge flag reset

## Deployment Notes

- ✅ **Build tested**: No compilation errors
- ✅ **Backward compatible**: No breaking changes
- ✅ **Low risk**: Isolated change with clear purpose
- ✅ **Immediate benefit**: Deluge protection will work correctly after deployment 