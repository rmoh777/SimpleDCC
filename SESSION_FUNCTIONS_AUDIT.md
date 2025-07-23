# Session Functions Audit - Critical Reference Document

**Created to prevent the 500 error from incorrect function signatures**

## 🎯 Purpose
This document contains the EXACT signatures of ALL session-related functions in the SimpleDCC codebase. **ALWAYS verify against this document before calling any session function.**

## 📋 Core Session Functions

### 1. `createUserSession` (CRITICAL - This caused the 500 error)

**Location:** `src/lib/users/user-operations.ts:434`

**Exact Signature:**
```typescript
export async function createUserSession(
  userId: number,
  extendedSession: boolean = false,  // ⚠️ REQUIRED PARAMETER (defaults to false)
  db: any
): Promise<{ sessionToken: string; sessionExpires: number } | null>
```

**✅ CORRECT Usage Examples:**
```typescript
// Standard 1-hour session
const sessionResult = await createUserSession(user.id, false, platform.env.DB);

// Extended 24-hour session  
const sessionResult = await createUserSession(user.id, true, platform.env.DB);

// Using default (false) for extendedSession
const sessionResult = await createUserSession(user.id, false, db);
```

**❌ INCORRECT Usage (caused 500 error):**
```typescript
// Missing extendedSession parameter - DO NOT DO THIS
const sessionResult = await createUserSession(user.id, platform.env.DB);
```

**Returns:**
- Success: `{ sessionToken: string; sessionExpires: number }`
- Failure: `null`

**What it does:**
- Generates a random UUID session token
- Sets session duration (1 hour or 24 hours based on `extendedSession`)
- Updates user record with `session_token` and `session_expires`
- Returns token and expiration timestamp

---

## 📋 User Lookup Functions

### 2. `getUserByEmail`

**Location:** `src/lib/users/user-operations.ts:31`

**Exact Signature:**
```typescript
export async function getUserByEmail(email: string, db: any): Promise<User | null>
```

**Usage:**
```typescript
const user = await getUserByEmail('user@example.com', platform.env.DB);
```

### 3. `getUserById`

**Location:** `src/lib/users/user-operations.ts:48`

**Exact Signature:**
```typescript
export async function getUserById(userId: number, db: any): Promise<User | null>
```

**Usage:**
```typescript
const user = await getUserById(123, platform.env.DB);
```

### 4. `getUserByGoogleId`

**Location:** `src/lib/users/user-operations.ts:397`

**Exact Signature:**
```typescript
export async function getUserByGoogleId(googleId: string, db: any): Promise<User | null>
```

**Usage:**
```typescript
const user = await getUserByGoogleId('google_oauth_id_123', platform.env.DB);
```

### 5. `createOrGetUser`

**Location:** `src/lib/users/user-operations.ts:7`

**Exact Signature:**
```typescript
export async function createOrGetUser(email: string, db: any): Promise<User>
```

**Usage:**
```typescript
const user = await createOrGetUser('user@example.com', platform.env.DB);
```

---

## 📋 Google OAuth Functions

### 6. `linkGoogleAccount`

**Location:** `src/lib/users/user-operations.ts:369`

**Exact Signature:**
```typescript
export async function linkGoogleAccount(
  userId: number,
  googleId: string,
  googleEmail: string,
  db: any
): Promise<boolean>
```

**Usage:**
```typescript
const success = await linkGoogleAccount(123, 'google_id', 'user@gmail.com', db);
```

### 7. `unlinkGoogleAccount`

**Location:** `src/lib/users/user-operations.ts:413`

**Exact Signature:**
```typescript
export async function unlinkGoogleAccount(userId: number, db: any): Promise<boolean>
```

**Usage:**
```typescript
const success = await unlinkGoogleAccount(123, platform.env.DB);
```

---

## 📋 Session Validation Patterns

### Current Session Validation (Used in multiple places)

**Pattern used in `manage/+page.server.ts` and `upgrade/+page.server.ts`:**

```typescript
// Get session token from cookie
const sessionToken = cookies.get('user_session'); // Note: cookie name varies

if (sessionToken) {
  const user = await db.prepare(`
    SELECT * FROM users 
    WHERE session_token = ? 
    AND session_expires > ?
  `).bind(sessionToken, Date.now()).first();
  
  if (user) {
    // Valid session
    isLoggedIn = true;
  } else {
    // Clear invalid session
    cookies.delete('user_session', { path: '/' });
  }
}
```

**Cookie Name Inconsistencies Found:**
- `user_session` - Used in `/manage`, `/auth/verify`, Google OAuth callback
- `session_token` - Used in `/upgrade`, `/api/subscribe`

**⚠️ WARNING:** The codebase has INCONSISTENT cookie names. Choose one standard and stick to it.

---

## 📋 Session Cookie Setting Patterns

### Standard Pattern:
```typescript
if (sessionResult) {
  cookies.set('user_session', sessionResult.sessionToken, {
    path: '/',
    maxAge: 60 * 60, // 1 hour (or longer for extended)
    httpOnly: true,
    secure: true,    // Only in production
    sameSite: 'lax'
  });
}
```

### Used in various files:
- `/auth/verify/+page.server.ts` - Uses `user_session` cookie
- `/auth/google/callback/+server.ts` - Uses `user_session` cookie  
- `/api/subscribe/+server.ts` - Uses `session_token` cookie (⚠️ different name)

---

## 📋 Import Statements

### For session creation:
```typescript
import { createUserSession } from '$lib/users/user-operations';
```

### For user lookups:
```typescript
import { getUserByEmail, getUserById, createOrGetUser } from '$lib/users/user-operations';
```

### For Google OAuth:
```typescript
import { getUserByGoogleId, linkGoogleAccount } from '$lib/users/user-operations';
```

---

## 🚨 CRITICAL REMINDERS

1. **ALWAYS** include the `extendedSession` parameter when calling `createUserSession`
2. **NEVER** assume parameter order - verify against this document
3. **CHECK** return values - functions can return `null` on failure
4. **USE** consistent cookie names across the application
5. **VALIDATE** session expiration when checking sessions
6. **HANDLE** database errors appropriately

---

## ✅ Verification Checklist

Before using any session function:

- [ ] Have I checked the exact signature in this document?
- [ ] Am I passing ALL required parameters in the correct order?
- [ ] Am I handling the possibility of `null` return values?
- [ ] Am I using the correct cookie name consistently?
- [ ] Am I checking session expiration properly?

---

**Last Updated:** Based on codebase audit performed before implementing new signup flow
**Critical Note:** This document was created to prevent repeating the 500 error caused by incorrect `createUserSession` parameters 