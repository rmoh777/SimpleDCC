# Lucia Google Auth SvelteKit Reference

**Repository:** lucia-auth/example-sveltekit-google-oauth  
**Files analyzed:** 27  
**Estimated tokens:** 26.4k

## Directory Structure

```
└── lucia-auth-example-sveltekit-google-oauth/
    ├── README.md
    ├── LICENSE
    ├── package.json
    ├── pnpm-lock.yaml
    ├── setup.sql
    ├── svelte.config.js
    ├── tsconfig.json
    ├── vite.config.ts
    ├── .env.example
    ├── .npmrc
    ├── .prettierignore
    ├── .prettierrc
    └── src/
        ├── app.d.ts
        ├── app.html
        ├── hooks.server.ts
        ├── lib/
        │   └── server/
        │       ├── db.ts
        │       ├── oauth.ts
        │       ├── rate-limit.ts
        │       ├── session.ts
        │       └── user.ts
        └── routes/
            ├── +layout.svelte
            ├── +page.server.ts
            ├── +page.svelte
            └── login/
                ├── +page.server.ts
                ├── +page.svelte
                └── google/
                    ├── +server.ts
                    └── callback/
                        └── +server.ts
```

## Files Content

### README.md

```markdown
# Google OAuth example in SvelteKit

Uses SQLite. Rate limiting is implemented using JavaScript `Map`.

## Initialize project

Register an OAuth client on the Google API Console. Paste the client ID and secret to a `.env` file.

```bash
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Create `sqlite.db` and run `setup.sql`.

```
sqlite3 sqlite.db
```

Run the application:

```
pnpm dev
```
```

### LICENSE

```
Copyright (c) 2024 pilcrowOnPaper and contributors

Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE
FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY
DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN
AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT
OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### package.json

```json
{
	"name": "example-sveltekit-google-oauth",
	"version": "0.0.1",
	"private": true,
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
		"lint": "prettier --check .",
		"format": "prettier --write ."
	},
	"devDependencies": {
		"@sveltejs/adapter-auto": "^3.0.0",
		"@sveltejs/kit": "^2.0.0",
		"@sveltejs/vite-plugin-svelte": "^3.0.0",
		"@types/better-sqlite3": "^7.6.11",
		"prettier": "^3.1.1",
		"prettier-plugin-svelte": "^3.1.2",
		"svelte": "^4.2.7",
		"svelte-check": "^4.0.0",
		"typescript": "^5.0.0",
		"vite": "^5.0.3"
	},
	"type": "module",
	"dependencies": {
		"@oslojs/binary": "^1.0.0",
		"@oslojs/crypto": "^1.0.1",
		"@oslojs/encoding": "^1.1.0",
		"@pilcrowjs/db-query": "^0.0.2",
		"@pilcrowjs/object-parser": "^0.0.4",
		"arctic": "2.0.0-next.9",
		"better-sqlite3": "^11.3.0"
	}
}
```

### setup.sql

```sql
CREATE TABLE user (
    id INTEGER NOT NULL PRIMARY KEY,
    google_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    picture TEXT NOT NULL
);

CREATE INDEX google_id_index ON user(google_id);

CREATE TABLE session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    expires_at INTEGER NOT NULL
);
```

### svelte.config.js

```javascript
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter()
	}
};

export default config;
```

### tsconfig.json

```json
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "bundler"
	}
	// Path aliases are handled by https://kit.svelte.dev/docs/configuration#alias
	// except $lib which is handled by https://kit.svelte.dev/docs/configuration#files
	//
	// If you want to overwrite includes/excludes, make sure to copy over the relevant includes/excludes
	// from the referenced tsconfig.json - TypeScript does not merge them in
}
```

### vite.config.ts

```typescript
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [sveltekit()]
});
```

### .env.example

```
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### .npmrc

```
engine-strict=true
```

### .prettierignore

```
# Package Managers
package-lock.json
pnpm-lock.yaml
yarn.lock
```

### .prettierrc

```json
{
	"useTabs": true,
	"trailingComma": "none",
	"printWidth": 120,
	"plugins": ["prettier-plugin-svelte"],
	"overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
}
```

### src/app.d.ts

```typescript
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { User } from "$lib/server/user";
import type { Session } from "$lib/server/session";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			session: Session | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
```

### src/app.html

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

### src/hooks.server.ts

```typescript
import { TokenBucket } from "$lib/server/rate-limit";
import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie } from "$lib/server/session";
import { sequence } from "@sveltejs/kit/hooks";

import type { Handle } from "@sveltejs/kit";

const bucket = new TokenBucket<string>(100, 1);

const rateLimitHandle: Handle = async ({ event, resolve }) => {
	// Note: Assumes X-Forwarded-For will always be defined.
	const clientIP = event.request.headers.get("X-Forwarded-For");
	if (clientIP === null) {
		return resolve(event);
	}
	let cost: number;
	if (event.request.method === "GET" || event.request.method === "OPTIONS") {
		cost = 1;
	} else {
		cost = 3;
	}
	if (!bucket.consume(clientIP, cost)) {
		return new Response("Too many requests", {
			status: 429
		});
	}
	return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get("session") ?? null;
	if (token === null) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = validateSessionToken(token);
	if (session !== null) {
		setSessionTokenCookie(event, token, session.expiresAt);
	} else {
		deleteSessionTokenCookie(event);
	}

	event.locals.session = session;
	event.locals.user = user;
	return resolve(event);
};

export const handle = sequence(rateLimitHandle, authHandle);
```

### src/lib/server/db.ts

```typescript
import sqlite3 from "better-sqlite3";
import { SyncDatabase } from "@pilcrowjs/db-query";

import type { SyncAdapter } from "@pilcrowjs/db-query";

const sqlite = sqlite3("sqlite.db");

const adapter: SyncAdapter<sqlite3.RunResult> = {
	query: (statement: string, params: unknown[]): unknown[][] => {
		const result = sqlite
			.prepare(statement)
			.raw()
			.all(...params);
		return result as unknown[][];
	},
	execute: (statement: string, params: unknown[]): sqlite3.RunResult => {
		const result = sqlite.prepare(statement).run(...params);
		return result;
	}
};

class Database extends SyncDatabase<sqlite3.RunResult> {
	public inTransaction(): boolean {
		return sqlite.inTransaction;
	}
}

export const db = new Database(adapter);
```

### src/lib/server/oauth.ts

```typescript
import { Google } from "arctic";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";

export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, "http://localhost:5173/login/google/callback");
```

### src/lib/server/rate-limit.ts

```typescript
export class TokenBucket<_Key> {
	public max: number;
	public refillIntervalSeconds: number;

	constructor(max: number, refillIntervalSeconds: number) {
		this.max = max;
		this.refillIntervalSeconds = refillIntervalSeconds;
	}

	private storage = new Map<_Key, Bucket>();

	public check(key: _Key, cost: number): boolean {
		const bucket = this.storage.get(key) ?? null;
		if (bucket === null) {
			return true;
		}
		const now = Date.now();
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
		if (refill > 0) {
			return Math.min(bucket.count + refill, this.max) >= cost;
		}
		return bucket.count >= cost;
	}

	public consume(key: _Key, cost: number): boolean {
		let bucket = this.storage.get(key) ?? null;
		const now = Date.now();
		if (bucket === null) {
			bucket = {
				count: this.max - cost,
				refilledAt: now
			};
			this.storage.set(key, bucket);
			return true;
		}
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
		if (refill > 0) {
			bucket.count = Math.min(bucket.count + refill, this.max);
			bucket.refilledAt = now;
		}
		if (bucket.count < cost) {
			this.storage.set(key, bucket);
			return false;
		}
		bucket.count -= cost;
		this.storage.set(key, bucket);
		return true;
	}
}

interface Bucket {
	count: number;
	refilledAt: number;
}
```

### src/lib/server/session.ts

```typescript
import { db } from "./db";
import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

import type { User } from "./user";
import type { RequestEvent } from "@sveltejs/kit";

export function validateSessionToken(token: string): SessionValidationResult {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const row = db.queryOne(
		`
SELECT session.id, session.user_id, session.expires_at, user.id, user.google_id, user.email, user.name, user.picture FROM session
INNER JOIN user ON session.user_id = user.id
WHERE session.id = ?
`,
		[sessionId]
	);

	if (row === null) {
		return { session: null, user: null };
	}
	const session: Session = {
		id: row.string(0),
		userId: row.number(1),
		expiresAt: new Date(row.number(2) * 1000)
	};
	const user: User = {
		id: row.number(3),
		googleId: row.string(4),
		email: row.string(5),
		name: row.string(6),
		picture: row.string(7)
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		db.execute("DELETE FROM session WHERE id = ?", [session.id]);
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		db.execute("UPDATE session SET expires_at = ? WHERE session.id = ?", [
			Math.floor(session.expiresAt.getTime() / 1000),
			session.id
		]);
	}
	return { session, user };
}

export function invalidateSession(sessionId: string): void {
	db.execute("DELETE FROM session WHERE id = ?", [sessionId]);
}

export function invalidateUserSessions(userId: number): void {
	db.execute("DELETE FROM session WHERE user_id = ?", [userId]);
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set("session", token, {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		expires: expiresAt
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set("session", "", {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		maxAge: 0
	});
}

export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32(tokenBytes).toLowerCase();
	return token;
}

export function createSession(token: string, userId: number): Session {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	db.execute("INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)", [
		session.id,
		session.userId,
		Math.floor(session.expiresAt.getTime() / 1000)
	]);
	return session;
}

export interface Session {
	id: string;
	expiresAt: Date;
	userId: number;
}

type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
```

### src/lib/server/user.ts

```typescript
import { db } from "./db";

export function createUser(googleId: string, email: string, name: string, picture: string): User {
	const row = db.queryOne("INSERT INTO user (google_id, email, name, picture) VALUES (?, ?, ?, ?) RETURNING user.id", [
		googleId,
		email,
		name,
		picture
	]);
	if (row === null) {
		throw new Error("Unexpected error");
	}
	const user: User = {
		id: row.number(0),
		googleId,
		email,
		name,
		picture
	};
	return user;
}

export function getUserFromGoogleId(googleId: string): User | null {
	const row = db.queryOne("SELECT id, google_id, email, name, picture FROM user WHERE google_id = ?", [googleId]);
	if (row === null) {
		return null;
	}
	const user: User = {
		id: row.number(0),
		googleId: row.string(1),
		email: row.string(2),
		name: row.string(3),
		picture: row.string(4)
	};
	return user;
}

export interface User {
	id: number;
	email: string;
	googleId: string;
	name: string;
	picture: string;
}
```

### src/routes/+layout.svelte

```svelte
<svelte:head>
	<title>Google OAuth example in SvelteKit</title>
</svelte:head>

<slot />
```

### src/routes/+page.server.ts

```typescript
import { fail, redirect } from "@sveltejs/kit";
import { deleteSessionTokenCookie, invalidateSession } from "$lib/server/session";

import type { Actions, RequestEvent } from "./$types";

export async function load(event: RequestEvent) {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, "/login");
	}
	return {
		user: event.locals.user
	};
}

export const actions: Actions = {
	default: action
};

async function action(event: RequestEvent) {
	if (event.locals.session === null) {
		return fail(401);
	}
	invalidateSession(event.locals.session.id);
	deleteSessionTokenCookie(event);
	return redirect(302, "/login");
}
```

### src/routes/+page.svelte

```svelte
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { PageData } from "./$types";

	export let data: PageData;
</script>

<h1>Hi, {data.user.name}!</h1>
<img src={data.user.picture} height="100px" width="100px" alt="profile" />
<p>Email: {data.user.email}</p>
<form method="post" use:enhance>
	<button>Sign out</button>
</form>
```

### src/routes/login/+page.server.ts

```typescript
import { redirect } from "@sveltejs/kit";

import type { RequestEvent } from "./$types";

export async function load(event: RequestEvent) {
	if (event.locals.session !== null && event.locals.user !== null) {
		return redirect(302, "/");
	}
	return {};
}
```

### src/routes/login/+page.svelte

```svelte
<h1>Sign in</h1>
<a href="/login/google">Sign in with Google</a>
```

### src/routes/login/google/+server.ts

```typescript
import { google } from "$lib/server/oauth";
import { generateCodeVerifier, generateState } from "arctic";

import type { RequestEvent } from "./$types";

export function GET(event: RequestEvent): Response {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);

	event.cookies.set("google_oauth_state", state, {
		httpOnly: true,
		maxAge: 60 * 10,
		secure: import.meta.env.PROD,
		path: "/",
		sameSite: "lax"
	});
	event.cookies.set("google_code_verifier", codeVerifier, {
		httpOnly: true,
		maxAge: 60 * 10,
		secure: import.meta.env.PROD,
		path: "/",
		sameSite: "lax"
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
}
```

### src/routes/login/google/callback/+server.ts

```typescript
import { google } from "$lib/server/oauth";
import { ObjectParser } from "@pilcrowjs/object-parser";
import { createUser, getUserFromGoogleId } from "$lib/server/user";
import { createSession, generateSessionToken, setSessionTokenCookie } from "$lib/server/session";
import { decodeIdToken } from "arctic";

import type { RequestEvent } from "./$types";
import type { OAuth2Tokens } from "arctic";

export async function GET(event: RequestEvent): Promise<Response> {
	const storedState = event.cookies.get("google_oauth_state") ?? null;
	const codeVerifier = event.cookies.get("google_code_verifier") ?? null;
	const code = event.url.searchParams.get("code");
	const state = event.url.searchParams.get("state");

	if (storedState === null || codeVerifier === null || code === null || state === null) {
		return new Response("Please restart the process.", {
			status: 400
		});
	}
	if (storedState !== state) {
		return new Response("Please restart the process.", {
			status: 400
		});
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await google.validateAuthorizationCode(code, codeVerifier);
	} catch (e) {
		return new Response("Please restart the process.", {
			status: 400
		});
	}

	const claims = decodeIdToken(tokens.idToken());
	const claimsParser = new ObjectParser(claims);

	const googleId = claimsParser.getString("sub");
	const name = claimsParser.getString("name");
	const picture = claimsParser.getString("picture");
	const email = claimsParser.getString("email");

	const existingUser = getUserFromGoogleId(googleId);
	if (existingUser !== null) {
		const sessionToken = generateSessionToken();
		const session = createSession(sessionToken, existingUser.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	}

	const user = createUser(googleId, email, name, picture);
	const sessionToken = generateSessionToken();
	const session = createSession(sessionToken, user.id);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);
	return new Response(null, {
		status: 302,
		headers: {
			Location: "/"
		}
	});
}
```

## Key Features

This reference implementation provides:

1. **Google OAuth Integration** using the Arctic library
2. **Session Management** with secure token-based authentication
3. **Rate Limiting** to prevent abuse
4. **Database Integration** with SQLite using better-sqlite3
5. **Type Safety** with full TypeScript support
6. **Security Best Practices** including:
   - HTTP-only cookies
   - CSRF protection via state parameter
   - Secure session management
   - Proper token validation

## Dependencies

- `arctic`: OAuth provider library
- `@oslojs/crypto`: Cryptographic utilities
- `@oslojs/encoding`: Encoding utilities
- `@pilcrowjs/db-query`: Database query builder
- `better-sqlite3`: SQLite database driver

This serves as an excellent reference for implementing Google OAuth authentication in a SvelteKit application with proper security measures and TypeScript support. 