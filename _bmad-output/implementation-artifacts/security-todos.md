# Security Audit: Authentication System

**Date:** 2026-02-22
**Scope:** Login, registration, JWT, token refresh, middleware, frontend token storage, Socket.IO auth
**Stack:** Express 5 / jsonwebtoken 9.0.3 / bcryptjs 3.0.3 / Prisma 6 / React Native (Expo)
**Dependencies:** 0 known CVEs (`npm audit` clean)

---

## Critical

### 1. No rate limiting on login endpoint

- **Location:** `server/src/routes/auth.routes.ts:36-44`
- **Risk:** `/auth/login` has zero rate limiting, making it trivially vulnerable to brute-force and credential-stuffing attacks. Registration has `rateLimit(10, 60_000)` but login does not.
- **Fix:**
  ```ts
  router.post('/auth/login',
    rateLimit(5, 60_000), // 5 attempts per minute per IP
    async (req: Request, res: Response) => { ... }
  );
  ```
  Consider also adding account-level lockout (e.g., lock after 10 failed attempts for 15 minutes).
- **Ref:** OWASP A07 — Identification and Authentication Failures

### 2. No rate limiting on token refresh endpoint

- **Location:** `server/src/routes/auth.routes.ts:46-55`
- **Risk:** `/auth/refresh` has no rate limiting. A leaked refresh token can generate unlimited access tokens at machine speed without throttling.
- **Fix:**
  ```ts
  router.post('/auth/refresh',
    rateLimit(20, 60_000), // 20 per minute per IP
    async (req: Request, res: Response) => { ... }
  );
  ```
- **Ref:** OWASP A07

### 3. Refresh tokens are stateless and irrevocable

- **Location:** `server/src/utils/jwt.ts:10-12`, `server/src/services/auth.service.ts`
- **Risk:** Refresh tokens are purely JWT-based with a 30-day lifetime and never stored server-side. If a refresh token is stolen there is no way to revoke it — the attacker has persistent access for 30 days. Blocking a user only partially mitigates this (the `refresh()` service checks `isBlocked`, but there is no revocation for non-blocked accounts).
- **Fix:** Store refresh tokens in a database table (or Redis). On refresh, validate the token exists in storage. Provide a "revoke all sessions" capability. On logout, delete the stored refresh token.
- **Ref:** OWASP A07, CWE-613

---

## High

### 4. Socket.IO has no authentication

- **Location:** `server/src/socket/index.ts`
- **Risk:** Socket.IO connections require zero authentication. Any client can connect and join any spot room (`spot:join`), receiving real-time updates including moderation actions (`moderation:action` events). This exposes internal admin activity to unauthenticated users.
- **Fix:**
  ```ts
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.data.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });
  ```
- **Ref:** OWASP A01 — Broken Access Control

### 5. JWT algorithm not explicitly restricted on verify

- **Location:** `server/src/utils/jwt.ts:14-20`
- **Risk:** `jwt.verify(token, secret)` does not pass `{ algorithms: ['HS256'] }`. While jsonwebtoken v9+ has protections against the `none` algorithm attack, explicitly specifying the allowed algorithm is a defense-in-depth best practice that prevents algorithm confusion attacks.
- **Fix:**
  ```ts
  export function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    }) as TokenPayload;
  }
  // Same for verifyRefreshToken
  ```
- **Ref:** CWE-327

### 6. No failed login attempt tracking or account lockout

- **Location:** `server/src/services/auth.service.ts:40-57`
- **Risk:** Even with IP-based rate limiting, an attacker using distributed IPs (botnets, proxies) can brute-force accounts. There is no per-account failed attempt counter or temporary lockout mechanism.
- **Fix:** Add `failedLoginAttempts` and `lockedUntil` fields to the User model. After N failed attempts, temporarily lock the account.
- **Ref:** OWASP A07, CWE-307

---

## Medium

### 7. Refresh token not rotated on use

- **Location:** `server/src/services/auth.service.ts:59-75`
- **Risk:** The `refresh()` function issues a new refresh token but the old one remains valid for its full 30-day lifetime. If an old refresh token is intercepted, both the attacker and the legitimate user can keep refreshing independently, and the server cannot detect the theft.
- **Fix:** Implement refresh token rotation with reuse detection. Store tokens server-side; when a token is used, invalidate it and issue a new one. If a previously-used token is presented again, revoke the entire token family (indicates theft).
- **Ref:** OWASP A07

### 8. No CSRF protection on auth endpoints

- **Location:** `server/src/routes/auth.routes.ts`
- **Risk:** While Bearer token auth naturally mitigates CSRF for authenticated requests, login and registration endpoints accept `POST` with JSON bodies from any origin. CORS is currently locked to `CORS_ORIGIN`, but this is fragile if that value is misconfigured. Currently low practical risk.
- **Fix:** Consider adding a CSRF token for state-changing unauthenticated endpoints, or ensure `SameSite` cookie attributes if cookies are ever introduced.
- **Ref:** OWASP A01

### 9. In-memory rate limiter doesn't survive restarts and isn't distributed

- **Location:** `server/src/middleware/rateLimiter.ts`
- **Risk:** Rate limiter uses an in-memory `Map`. It resets on every server restart and doesn't work across multiple server instances. In production with multiple processes/containers, rate limiting is trivially bypassed.
- **Fix:** Use Redis-backed rate limiting (e.g., `rate-limiter-flexible` with Redis store) for production.
- **Ref:** CWE-799

### 10. Frontend persists tokens in AsyncStorage without encryption

- **Location:** `stores/useAuthStore.ts:27-33`
- **Risk:** Tokens (including 30-day refresh tokens) are stored in plaintext via `AsyncStorage` under the key `spotapp-auth`. On Android this is an unencrypted SQLite database accessible on rooted devices. On web this falls back to `localStorage` — accessible to any XSS.
- **Fix:** Use `expo-secure-store` (Keychain on iOS, EncryptedSharedPreferences on Android) for token storage. On web, consider `httpOnly` cookies instead of localStorage.
- **Ref:** OWASP A02 — Cryptographic Failures, CWE-312

---

## Low

### 11. Weak password policy — only 8 character minimum

- **Location:** `server/src/schemas/auth.schema.ts:5`
- **Risk:** `z.string().min(8).max(128)` allows very weak passwords like `12345678` or `password`. No complexity requirements.
- **Fix:**
  ```ts
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
  ```
  Or better: check against a common password list.
- **Ref:** OWASP A07, CWE-521

### 12. `.env.example` contains realistic-looking secrets

- **Location:** `server/.env.example`
- **Risk:** Example secrets (`dev-access-secret-change-in-production-32chars`) could be accidentally used in production if `.env.example` is copied without modification.
- **Fix:** Use obviously placeholder values: `CHANGE_ME_GENERATE_WITH_openssl_rand_hex_32`.

### 13. `optionalAuth` silently swallows invalid tokens

- **Location:** `server/src/middleware/authMiddleware.ts:28-33`
- **Risk:** When a Bearer token is present but invalid/expired, `optionalAuth` silently sets `req.user = null`. A client with an expired token hitting an optional-auth endpoint silently loses identity rather than being prompted to refresh.
- **Fix:** Consider returning a header like `X-Auth-Status: token_expired` to help clients detect this state.

---

## Info (Best Practices)

### 14. No security logging on auth events

- **Location:** `server/src/services/auth.service.ts`
- Auth service doesn't log failed login attempts, successful logins, token refreshes, or registration events. This makes it impossible to detect attacks or investigate incidents. Add structured logging for all auth events.
- **Ref:** OWASP A09 — Security Logging and Monitoring Failures

### 15. No logout endpoint

- There is no `/auth/logout` endpoint. Users can only "logout" client-side by clearing stored tokens. With stateless JWTs, the access token remains valid until expiry even after "logout". A server-side logout endpoint (combined with stored refresh tokens) would allow true session termination.

### 16. `requireAuth` queries the database on every request

- **Location:** `server/src/middleware/authMiddleware.ts:42-65`
- The DB check for `isBlocked` on every authenticated request is good for security (immediate block enforcement) but adds latency. Consider caching blocked status briefly (e.g., 30-second TTL) if this becomes a bottleneck.

---

## Prioritized Fix Order

| # | Finding | Severity | Effort |
|---|---------|----------|--------|
| 1 | Rate limit login endpoint (#1) | Critical | Low — one line |
| 2 | Rate limit refresh endpoint (#2) | Critical | Low — one line |
| 3 | Restrict JWT algorithms (#5) | High | Low — two lines |
| 4 | Authenticate Socket.IO (#4) | High | Medium |
| 5 | Add auth event logging (#14) | Info | Medium |
| 6 | Store refresh tokens server-side (#3) | Critical | High |
| 7 | Implement token rotation (#7) | Medium | High (depends on #6) |
| 8 | Add failed login tracking (#6) | High | Medium |
| 9 | Use secure token storage on mobile (#10) | Medium | Medium |
| 10 | Implement logout endpoint (#15) | Info | Low (depends on #6) |

Items 1-3 are quick wins that can ship immediately. Items 4-5 are medium effort. Items 6-7 require a database migration and are the most impactful architectural change.
