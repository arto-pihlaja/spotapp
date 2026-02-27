---
title: 'Fix Authentication UX and Token Lifecycle'
slug: 'fix-auth-ux-token-lifecycle'
created: '2026-02-22'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React Native', 'Expo Router', 'Zustand', 'React Query', 'JWT', 'AsyncStorage']
files_to_modify: ['app/index.tsx', 'lib/apiClient.ts', 'features/auth/api/auth.ts', 'features/auth/types.ts', 'components/AccountMenu.tsx']
code_patterns: ['Zustand persist middleware with AsyncStorage', 'React Query useMutation for auth actions', 'RN Modal for overlays (CreateSpotModal pattern)', 'Alert.alert() for confirmation dialogs (admin pattern)', 'Feature modules: api/hooks/components/types structure', 'apiClient envelope: { data, meta?, error? }', 'Colors: #0284C7 primary, #f3f4f6 light gray, #374151 dark text']
test_patterns: ['No frontend tests currently', 'Backend test-utils exist but no auth-specific tests']
---

# Tech-Spec: Fix Authentication UX and Token Lifecycle

**Created:** 2026-02-22

## Overview

### Problem Statement

Tapping the username instantly logs the user out with no feedback or confirmation, creating a confusing login/logout loop. Additionally, access tokens expire silently after 15 minutes with no auto-refresh, causing API calls to fail without recovery.

### Solution

Replace the username button with a dropdown menu (Profile / Log out + confirmation dialog), and implement silent token auto-refresh using the existing `/auth/refresh` endpoint so users stay logged in until they explicitly log out.

### Scope

**In Scope:**
- Account button → dropdown menu with "Profile" and "Log out"
- Logout confirmation dialog
- Silent token auto-refresh (client calls existing `/auth/refresh` before/after expiry)
- 401 error recovery in API client (intercept, refresh, retry)
- Persistent sessions (users stay logged in across app restarts)

**Out of Scope:**
- Registration, invitation codes, anti-bot, ghost profiles (rest of Epic 2)
- Socket.IO authentication (public data, no auth needed)
- Profile screen content (just the menu entry placeholder for now)

## Context for Development

### Codebase Patterns

- **State management:** Zustand with `persist` middleware and `AsyncStorage`. Auth store at `stores/useAuthStore.ts` holds `accessToken`, `refreshToken`, `user` and auto-rehydrates on app start.
- **API client:** `lib/apiClient.ts` — simple `fetch` wrapper, reads token from Zustand store per-request, returns `{ data, meta?, error? }` envelope. Throws `ApiError` on non-2xx.
- **Auth feature module:** `features/auth/` follows `api/hooks/components/types` structure. Currently has `loginUser` API function, `useLogin` hook, and `LoginResponse` type.
- **Modal pattern:** `CreateSpotModal` uses RN `Modal` with transparent overlay + bottom sheet. Standard styling with `#0284C7` buttons.
- **Confirmation dialogs:** Admin components use `Alert.alert(title, message, buttons)` for destructive confirmations.
- **Routing:** Expo Router with `router.push()` / `router.replace()`.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `app/index.tsx` | Map screen — contains account button (lines 114-130) that will become dropdown trigger |
| `stores/useAuthStore.ts` | Zustand auth store — `setTokens`, `clearAuth`, persisted to AsyncStorage |
| `lib/apiClient.ts` | API client — needs 401 intercept + refresh retry logic |
| `features/auth/api/auth.ts` | Auth API functions — needs `refreshTokens()` added |
| `features/auth/hooks/useLogin.ts` | Login mutation — reference for hook pattern |
| `features/auth/types.ts` | `LoginResponse` type — same shape as refresh response |
| `features/spots/components/CreateSpotModal.tsx` | Reference for Modal/overlay styling pattern |
| `server/src/routes/auth.routes.ts` | Backend refresh endpoint: `POST /auth/refresh` with `{ refreshToken }` body |
| `server/src/services/auth.service.ts` | Backend `refresh()` — verifies refresh token, checks blocked status, returns new tokens |
| `server/src/utils/jwt.ts` | JWT config — access 15m, refresh 30d |

### Technical Decisions

- **Dropdown menu:** Use an absolutely-positioned `View` overlay (not a `Modal`) anchored below the account button. Dismissed by tapping outside (via a full-screen transparent `Pressable` backdrop). This avoids modal stacking issues and keeps the map interactive.
- **Logout confirmation:** Use `Alert.alert()` — matches existing admin component pattern, native look on both platforms.
- **Token refresh strategy:** 401-interceptor pattern in `apiClient.ts`. On 401 response, attempt refresh using stored refresh token, update store, retry original request. Use a promise-based mutex to prevent concurrent refresh attempts when multiple requests fail simultaneously.
- **No proactive refresh:** Keep it simple — only refresh on 401 failure, not on a timer. The 15m access token + 30d refresh token provides a good window.
- **Profile menu item:** Navigate to a placeholder route for now (or show a toast). Profile screen is out of scope.

## Implementation Plan

### Tasks

- [x] Task 1: Add `refreshTokens` API function
  - File: `features/auth/api/auth.ts`
  - Action: Add a `refreshTokens()` function that calls `POST /auth/refresh` with the refresh token. This function must call `fetch` directly (not use `api.post`) to avoid circular 401 handling. It should hit `${BASE_URL}/auth/refresh` with `{ refreshToken }` body and return the `LoginResponse` shape.
  - Notes: Import `BASE_URL` logic (or duplicate the Platform.select) since this function bypasses the api client. The `LoginResponse` type already matches the refresh response shape (`{ accessToken, refreshToken, user }`), so no type changes needed.

- [x] Task 2: Add 401 intercept and token refresh to API client
  - File: `lib/apiClient.ts`
  - Action: Modify the `request()` function to handle 401 responses:
    1. Add a module-level `refreshPromise: Promise | null = null` variable for mutex.
    2. When a 401 response is received and a refresh token exists in the store:
       a. If `refreshPromise` is null, start a new refresh by calling `refreshTokens()` from `features/auth/api/auth.ts`, store the promise in `refreshPromise`.
       b. If `refreshPromise` is not null, await the existing promise (concurrent request case).
       c. On refresh success: call `useAuthStore.getState().setTokens()` with new tokens, clear `refreshPromise`, retry the original request with the new access token.
       d. On refresh failure: call `useAuthStore.getState().clearAuth()`, clear `refreshPromise`, throw the original 401 `ApiError`.
    3. If no refresh token exists, throw the 401 `ApiError` immediately.
  - Notes: The retry must build a new `Authorization` header from the freshly stored token. Only retry once — if the retried request also returns 401, throw without attempting another refresh to avoid loops.

- [x] Task 3: Create `AccountMenu` component
  - File: `components/AccountMenu.tsx` (new file)
  - Action: Create a self-contained component that renders:
    1. **Trigger button:** The existing pill-shaped account button showing username (logged in) or "Log In" (anonymous). Same styling as current `accountButton` in `app/index.tsx`.
    2. **Anonymous state:** Tapping "Log In" calls `router.push('/login')` — no dropdown.
    3. **Logged-in state:** Tapping the username toggles a dropdown menu below the button.
    4. **Dropdown menu:** Absolutely-positioned `View` appearing directly below the trigger. Contains two items:
       - "Profile" — placeholder action (navigate to `/profile` or show a toast "Coming soon"). Use a person icon or just text.
       - "Log out" — triggers logout confirmation via `Alert.alert()`.
    5. **Backdrop:** When dropdown is open, render a full-screen transparent `Pressable` behind the dropdown that closes it on tap.
    6. **Logout confirmation:** `Alert.alert('Log out', 'Are you sure you want to log out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: () => clearAuth() }])`.
  - Notes: Component receives no props — reads `user` and `clearAuth` from `useAuthStore`, uses `useRouter` for navigation. Styling should match existing `accountButton` style (white pill, shadow, `#0284C7` text). Dropdown items should have clear tap targets (min 44pt height per RN accessibility guidelines). The dropdown uses a `zIndex` higher than the trigger to appear above the map.

- [x] Task 4: Replace account button in MapScreen with `AccountMenu`
  - File: `app/index.tsx`
  - Action:
    1. Remove the inline `<Pressable>` account button (lines 114-130).
    2. Remove `useAuthStore` imports for `user` and `clearAuth` (lines 7, 22-23) since `AccountMenu` handles its own state.
    3. Import and render `<AccountMenu />` in the same position (absolute, top-left of map).
    4. Remove `accountButton` and `accountText` from the `StyleSheet` — these are now in the `AccountMenu` component.
  - Notes: The `useAuthStore` import on line 7 is still needed if other code in this file references it (check `handleLongPress` on line 91 which reads `accessToken`). If so, keep the import but remove the `user` and `clearAuth` selectors.

### Acceptance Criteria

- [ ] AC 1: Given a logged-in user on the map screen, when they tap their username, then a dropdown menu appears with "Profile" and "Log out" options (the user is NOT logged out).
- [ ] AC 2: Given the dropdown menu is open, when the user taps outside the menu, then the menu closes and no action is taken.
- [ ] AC 3: Given the dropdown menu is open, when the user taps "Log out", then a native confirmation dialog appears asking "Are you sure you want to log out?".
- [ ] AC 4: Given the logout confirmation dialog is shown, when the user taps "Log out" (destructive), then auth state is cleared and the button shows "Log In".
- [ ] AC 5: Given the logout confirmation dialog is shown, when the user taps "Cancel", then the dialog and dropdown close and the user remains logged in.
- [ ] AC 6: Given an anonymous user on the map screen, when they tap "Log In", then they are navigated to the login screen (no dropdown shown).
- [ ] AC 7: Given a logged-in user whose access token has expired, when they make an API request, then the client automatically refreshes the token using the refresh token and retries the request transparently.
- [ ] AC 8: Given a logged-in user whose refresh token has also expired (or is invalid), when they make an API request that triggers a refresh, then auth state is cleared and the user sees the "Log In" button.
- [ ] AC 9: Given multiple API requests fail with 401 simultaneously, when token refresh is triggered, then only one refresh request is made to the server (mutex prevents duplicates).
- [ ] AC 10: Given a user who logs in and closes/reopens the app, when the app restarts, then they remain logged in (tokens persisted in AsyncStorage, refresh on 401 extends the session).

## Additional Context

### Dependencies

- No new libraries required. All functionality uses existing dependencies:
  - `react-native` (`Alert`, `View`, `Pressable`, `Modal`, `StyleSheet`)
  - `zustand` + `@react-native-async-storage/async-storage` (already configured)
  - `expo-router` (already configured)
- Backend: No changes required. The `POST /auth/refresh` endpoint already exists and returns the correct response shape.

### Testing Strategy

- **Manual testing steps:**
  1. Log in as testuser → verify username shows in pill button
  2. Tap username → verify dropdown appears (NOT instant logout)
  3. Tap outside dropdown → verify it closes
  4. Tap username → tap "Log out" → verify confirmation dialog
  5. Tap "Cancel" in dialog → verify still logged in
  6. Tap "Log out" in dialog → verify logged out, shows "Log In"
  7. Tap "Log In" → verify navigates to login screen
  8. Log in → wait 16+ minutes → perform an action requiring auth → verify it succeeds (silent refresh)
  9. Close and reopen app → verify still logged in
  10. Manually invalidate refresh token in DB → make request → verify user is logged out cleanly

### Notes

- **Security consideration:** The 30-day refresh token is long-lived. For a future iteration, consider implementing refresh token rotation (backend already issues new refresh tokens on each refresh call, so the old one could be invalidated).
- **Profile route:** Task 3 references `/profile` navigation. If this route doesn't exist yet, use a simple toast/alert "Coming soon" instead to avoid Expo Router errors.
- **Web platform:** `Alert.alert()` has limited support on web. If web support matters, consider a custom modal for the logout confirmation. For now, web is secondary — the `Alert.alert` polyfill in Expo provides basic functionality.

## Review Notes
- Adversarial review completed
- Findings: 14 total, 5 real bugs fixed, 9 skipped (pre-existing patterns / out-of-scope / noise)
- Resolution approach: auto-fix
- **F1 (Critical):** Fixed mutex race — removed duplicate `refreshPromise = null` from catch block
- **F2+F3 (High):** Fixed backdrop — replaced `position: 'fixed'` with Fragment + `StyleSheet.absoluteFill` sibling
- **F6 (Medium):** Fixed BASE_URL duplication — exported from apiClient, imported in auth.ts
- **F7 (Medium):** Fixed JSON parse safety — single `res.json()` call with `.catch()`, validated `data` field
- Also addressed F10 (menu stays open on external logout) with `useEffect` closing menu when `user` becomes null
