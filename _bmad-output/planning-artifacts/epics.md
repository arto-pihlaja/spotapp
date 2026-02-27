---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments: ['prd.md', 'architecture.md', 'ux-design-specification.md', 'ux-design-component-strategy.md']
---

# SpotApp - Epic & Story Breakdown

## Overview

Implementation guide for SpotApp MVP. Each epic delivers standalone user value and includes enough context from PRD, Architecture, and UX specs to implement without cross-referencing. Read progressively — each epic builds on the previous.

**Key references:** PRD (30 FRs, 36 NFRs), Architecture (Expo + Express + Prisma + Socket.io + PostgreSQL), UX Design (map-first, 8 custom components, React Native Paper v5)

## FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR-MAP-01 | 1 | Interactive map display |
| FR-MAP-02 | 6 | Zoom-density clustering |
| FR-MAP-03 | 6 | Rich spot cards (conditions + sessions + recency) |
| FR-MAP-04 | 1 | Location-based centering |
| FR-SPOT-01 | 3 | Community spot creation |
| FR-SPOT-02 | 3 | Spot wiki pages |
| FR-SPOT-03 | 3 | Wiki content structure |
| FR-SPOT-04 | 7 | Spot deletion (superadmin) |
| FR-SESSION-01 | 5 | Two-state session model (Planned/Now) |
| FR-SESSION-02 | 5 | Session tuple {user, spot, time, sport} |
| FR-SESSION-03 | 5 | Sport selection |
| FR-SESSION-04 | 5 | Planned session creation |
| FR-SESSION-05 | 5 | Now session auto-expiry (90min) |
| FR-SESSION-06 | 5 | Session visibility (anon vs auth) |
| FR-SESSION-07 | 5 | Time slider for planning |
| FR-COND-01 | 4 | Structured condition input |
| FR-COND-02 | 4 | Condition report creation (<15s) |
| FR-COND-03 | 4 | One-tap confirm |
| FR-COND-04 | 4 | Condition report visibility |
| FR-COND-05 | 4 | Recency indicators |
| FR-COND-06 | 4 | Real-time propagation (<30s) |
| FR-USER-01 | 1+6 | Anonymous browse (basic in 1, complete in 6) |
| FR-USER-02 | 2 | Registration with invitation code |
| FR-USER-03 | 2 | Anti-bot measures |
| FR-USER-04 | 2 | Invitation code system |
| FR-USER-05 | 2 | Ghost profiles |
| FR-USER-06 | 7 | User blocking |
| FR-USER-07 | 7 | User unblocking |
| FR-MOD-01 | 7 | Wiki content removal |
| FR-MOD-02 | 7 | Moderation audit trail |

## Epic List

| Epic | Title | Stories | FRs |
|------|-------|---------|-----|
| 1 | Project Foundation & Anonymous Map Browsing | 4 | FR-MAP-01, FR-MAP-04, FR-USER-01 (partial) |
| 2 | User Authentication & Profiles | 5 | FR-USER-02, FR-USER-03, FR-USER-04, FR-USER-05 |
| 3 | Spots & Community Knowledge | 4 | FR-SPOT-01, FR-SPOT-02, FR-SPOT-03 |
| 4 | Condition Reporting & Real-Time | 4 | FR-COND-01 through FR-COND-06 |
| 5 | Session Planning & Coordination | 4 | FR-SESSION-01 through FR-SESSION-07 |
| 6 | Map Intelligence & Offline | 4 | FR-MAP-02, FR-MAP-03, FR-USER-01 (complete) |
| 7 | Admin & Moderation | 3 | FR-SPOT-04, FR-USER-06, FR-USER-07, FR-MOD-01, FR-MOD-02 |

---

## Epic 1: Project Foundation & Anonymous Map Browsing

Anyone can open SpotApp, see an interactive map centered on their location, and browse spot markers. This is the skeleton everything else builds on.

### Story 1.1: Initialize Monorepo Project Structure

As a developer,
I want a working monorepo with Expo frontend and Express backend connected to PostgreSQL,
So that the team has a consistent foundation to build all SpotApp features.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** I run `npx expo start` from the project root
**Then** the Expo app loads in web browser and Expo Go showing a placeholder map screen

**Given** the backend is configured
**When** I run `npx tsx src/server.ts` from `server/`
**Then** the Express server starts and GET `/api/v1/health` returns `{ "data": { "status": "ok" } }`

**Given** Prisma is initialized
**When** I run `npx prisma migrate dev` from `server/`
**Then** all database tables are created matching the complete Prisma schema

**Given** TypeScript is configured
**When** I run `tsc --noEmit` in both root and `server/`
**Then** zero type errors

**Implementation context:**
- Frontend: `npx create-expo-app@latest --template default` (Expo SDK 54, Expo Router, TypeScript)
- Backend: Express 5 + Prisma 6.x + Socket.io 4.8 + Zod 4.x + jsonwebtoken + bcryptjs + cors + helmet + pino
- DB: PostgreSQL 16+ (Docker for local dev, Railway for prod)
- Complete Prisma schema — all models: User, Spot, Session, ConditionReport, ConditionConfirmation, WikiContent, InvitationCode, AuditLog. Types flow from schema to API to frontend.
- IDs: cuid2 via `@default(cuid())`
- Monorepo: frontend at root, backend in `server/`, independently deployable
- Directory structure per Architecture: `app/`, `features/`, `components/`, `stores/`, `lib/`, `types/`, `server/src/{routes,middleware,services,socket,schemas,utils,jobs,config}`
- Seed script: `server/prisma/seed.ts` with 5-10 sample spots around a test region

### Story 1.2: Spots API with Viewport Filtering

As a frontend client,
I want an API endpoint that returns spots within a map viewport,
So that only visible spots are loaded efficiently.

**Acceptance Criteria:**

**Given** the API is running
**When** GET `/api/v1/spots?viewport=lat1,lng1,lat2,lng2`
**Then** response is `{ "data": [...spots], "meta": { "count": N } }` with only spots inside the bounding box

**Given** invalid viewport params (missing, non-numeric, lat > 90)
**When** the request is sent
**Then** response is 400 `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`

**Given** seeded spots exist
**When** viewport covers the seeded area
**Then** all seeded spots are returned with fields: id, name, lat, lng, createdAt

**Implementation context:**
- Route: `server/src/routes/spots.routes.ts` (thin — parse request, call service, send response)
- Service: `server/src/services/spots.service.ts` (all DB calls here, not in routes)
- Zod schema: `server/src/schemas/spots.schema.ts` for viewport query validation
- Geospatial: `WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?` (simple bounding box, no PostGIS)
- Response envelope: `{ data, meta, error }` — standard across all endpoints
- No auth required (anonymous access per FR-USER-01)

### Story 1.3: Interactive Map with Location Centering

As an anonymous user,
I want to see an interactive map centered on my location when I open SpotApp,
So that I can immediately see nearby water sports spots without any setup.

**Acceptance Criteria:**

**Given** I open SpotApp for the first time and grant location permission
**When** the map loads
**Then** it centers on my GPS location and becomes interactive within 3 seconds (FR-MAP-01)

**Given** I've used SpotApp before
**When** I reopen the app
**Then** it centers on my last viewed region (persisted state)

**Given** I deny location permission
**When** the map loads
**Then** it shows a default region with a "Find Me" FAB to re-request permission

**Given** I'm on any device
**When** the map renders
**Then** it uses the correct platform-specific renderer (react-map-gl on web, React Native Maps on native)

**Implementation context:**
- Map abstraction: `components/MapView.tsx` (native) + `components/MapView.web.tsx` (web) with common prop interface: `onRegionChange`, `markers`, `onMarkerPress`
- `Platform.select()` routes to correct implementation internally
- Zustand: `stores/useMapStore.ts` — viewport, zoom, selectedSpotId, mapReady. Persist last region to AsyncStorage.
- Map fills 100% viewport minus safe areas (no tabs, no headers — map IS the app)
- "Find Me" FAB: bottom right, 56x56px, uses `expo-location`
- Performance target: map interactive <3s on 4G (NFR-PERF-01)

### Story 1.4: Spot Markers on Map

As an anonymous user,
I want to see markers on the map for each spot,
So that I can identify where water sports spots are located.

**Acceptance Criteria:**

**Given** spots exist in the visible viewport
**When** the map finishes loading
**Then** markers appear at correct lat/lng positions showing spot name

**Given** I tap a spot marker
**When** the tap registers
**Then** basic spot info appears (name, coordinates — bottom sheet placeholder for now)

**Given** I pan/zoom to a new area
**When** the viewport settles (debounced 300ms)
**Then** the app fetches spots for the new viewport and updates markers

**Given** no spots exist in the visible area
**When** the map loads
**Then** no markers are shown (valid empty state)

**Implementation context:**
- `features/spots/components/SpotMarker.tsx` — basic version (colored pin + name label). Recency coloring and sport icons added in later epics.
- Touch target: 48x48px minimum (invisible padding around 32px visual marker)
- TanStack Query: `features/spots/hooks/useSpots.ts` with key `['spots', { viewport }]`
- API client: `lib/apiClient.ts` — fetch wrapper with base URL config
- Query client: `lib/queryClient.ts` — TanStack Query config with staleTime, retry settings
- Debounce viewport changes 300ms to avoid excessive API calls during pan/zoom
- `React.memo` on SpotMarker to prevent re-renders during map gestures
- Bottom sheet: basic placeholder in this story; full implementation in Epic 3

---

## Epic 2: User Authentication & Profiles

Users can register with invitation codes, log in, stay authenticated, and view profiles. Authentication unlocks identity-level data (see WHO is going, not just counts).

### Story 2.1: User Registration with Invitation Code

As a visitor with an invitation code,
I want to register with a username, password, and invitation code,
So that I can unlock contribution features and see who's at each spot.

**Acceptance Criteria:**

**Given** I have a valid invitation code
**When** I submit registration with unique username + password (min 8 chars) + code
**Then** my account is created and I receive access + refresh tokens

**Given** the invitation code is invalid, expired, or exhausted
**When** I submit registration
**Then** I get 403 with generic error (no code enumeration)

**Given** a bot fills the honeypot field
**When** the form is submitted
**Then** the request is silently rejected with 403

**Given** the form is submitted in under 5 seconds
**When** the time check runs
**Then** the request is rejected (too fast for a human)

**Given** 10 registration attempts from the same IP in 1 minute
**When** the 11th attempt arrives
**Then** it is rate-limited with 429

**Implementation context:**
- Route: POST `/api/v1/auth/register`
- Anti-bot middleware chain: `rateLimit(10/min/IP) → honeypotCheck → timeCheck(>5s) → jsChallengeValidation → register`
- Password: bcrypt work factor >= 12 (NFR-SEC-01)
- JWT dual-token: access (15min, response body) + refresh (30-day, httpOnly cookie web / SecureStore native)
- Token payload: `{ userId, role }` where role is 'user' by default
- Invitation code: decrement `currentUses`, validate `expiresAt` and `maxUses`
- Seed 3-5 test invitation codes in `seed.ts`
- Frontend: `features/auth/components/RegisterForm.tsx` with honeypot hidden field, JS challenge token
- Zustand: `stores/useAuthStore.ts` — user, tokens, isAuthenticated, role

### Story 2.2: User Login and Session Persistence

As a registered user,
I want to log in and stay authenticated across app restarts,
So that I don't need to re-enter credentials every session.

**Acceptance Criteria:**

**Given** valid username and password
**When** I submit login
**Then** I receive access + refresh tokens and am redirected to the map

**Given** invalid credentials
**When** I submit login
**Then** I get 401 with "Invalid username or password" (no field-specific hints)

**Given** my access token expires (15 minutes)
**When** the next API request is made
**Then** the token is silently refreshed using the refresh token (transparent to user)

**Given** I close and reopen the app
**When** a valid refresh token exists in storage
**Then** I'm automatically authenticated without re-login

**Given** my refresh token expires (30 days inactivity)
**When** I try to access protected content
**Then** I'm redirected to the login screen

**Implementation context:**
- Routes: POST `/api/v1/auth/login`, POST `/api/v1/auth/refresh`
- `lib/apiClient.ts`: fetch wrapper with auth interceptor — auto-attaches Authorization header, auto-refreshes on 401
- Refresh token storage: httpOnly cookie (web) / `expo-secure-store` (native)
- Access token: in memory (Zustand) — never persisted to disk
- Frontend: `features/auth/components/LoginForm.tsx`, `app/(auth)/login.tsx` screen

### Story 2.3: Auth Middleware and Progressive Data Disclosure

As an anonymous user, I want to see aggregated data without logging in so I get value before committing.
As a registered user, I want to see WHO is going and WHO reported so I make better decisions.

**Acceptance Criteria:**

**Given** no auth token is provided
**When** GET `/api/v1/spots` is called
**Then** spot data includes aggregated session counts and conditions but NO usernames

**Given** a valid auth token is provided
**When** GET `/api/v1/spots` is called
**Then** spot data includes usernames on sessions and condition reports

**Given** an expired or invalid token
**When** any read-only API request is made
**Then** the request is treated as anonymous (no 401 for public endpoints)

**Implementation context:**
- Middleware chain: `extractToken → verifyJWT → attachUser → handler` (no `checkRole` on public endpoints — just attach user if present)
- Three tiers: anonymous (aggregated), user (full data), admin (moderation access)
- `req.user` is `null` for anonymous, populated for authenticated
- Services shape response based on `req.user` presence
- This pattern applies to ALL future endpoints (conditions, sessions, wiki)

### Story 2.4: Ghost Profiles with Activity Stats

As a registered user,
I want to view any user's ghost profile with activity stats,
So that I can gauge community members' experience level.

**Acceptance Criteria:**

**Given** I'm viewing a user's profile
**When** the profile loads
**Then** I see: username, optional photo, optional link, session count, spots visited count

**Given** a user has 9 sessions across 4 spots
**When** their profile is displayed
**Then** stats show "9 sessions, 4 spots" (computed from data, not manually set)

**Given** I'm anonymous
**When** I try to view a profile
**Then** I'm prompted to log in

**Implementation context:**
- Route: GET `/api/v1/users/:userId` (auth required)
- Stats computed from Session and ConditionReport tables (never stored separately)
- User model: id, username, passwordHash, photoUrl?, externalLink?, role, createdAt, isBlocked
- Frontend: `features/auth/components/GhostProfile.tsx`
- No social feed, no likes, no follows — pure activity stats (FR-USER-05)

### Story 2.5: Superadmin Invitation Code Management

As a superadmin,
I want to create and manage invitation codes,
So that I can control who joins the community.

**Acceptance Criteria:**

**Given** I'm authenticated as superadmin
**When** I POST `/api/v1/admin/invitation-codes` with maxUses and optional expiresAt
**Then** a new invitation code is generated and returned

**Given** I'm authenticated as superadmin
**When** I GET `/api/v1/admin/invitation-codes`
**Then** I see all codes with: code, maxUses, currentUses, expiresAt, createdBy

**Given** I'm a regular user
**When** I access `/api/v1/admin/*`
**Then** I get 403 Forbidden

**Implementation context:**
- Admin middleware: `checkRole('admin')` on admin route group
- Route: `server/src/routes/admin.routes.ts`
- Code generation: `crypto.randomBytes` for URL-safe codes
- Frontend: `features/admin/components/InvitationCodes.tsx`
- Screen: `app/(admin)/moderation.tsx` — redirect if not admin

---

## Epic 3: Spots & Community Knowledge

Authenticated users can create spots by dropping pins and collaboratively edit wiki pages. Anonymous users can read wikis. The bottom sheet becomes the central spot detail UI.

### Story 3.1: Create Spot by Dropping Pin

As an authenticated user,
I want to create a new spot by long-pressing the map and naming it,
So that I can add spots the community doesn't know about yet.

**Acceptance Criteria:**

**Given** I'm authenticated and viewing the map
**When** I long-press an empty area on the map
**Then** a pin-drop UI appears with a name input field and "Create Spot" button

**Given** I enter a spot name (2-100 chars) and confirm
**When** the spot is submitted
**Then** the spot is created at the pressed coordinates and a marker appears immediately

**Given** I try to create a spot without a name or with <2 characters
**When** I tap "Create Spot"
**Then** I see inline validation error

**Given** I'm anonymous
**When** I long-press the map
**Then** nothing happens (spot creation requires auth)

**Implementation context:**
- Route: POST `/api/v1/spots` (auth required) — body: `{ name, lat, lng }`
- Zod validates name length, lat/lng range
- Long-press gesture on MapView → creation bottom sheet with name input
- `useCreateSpot` mutation → invalidates `['spots', { viewport }]` on success
- Spot creation under 3 taps: long-press → type name → tap Create (FR-SPOT-01)
- New spot gets empty wiki content automatically (same transaction)

### Story 3.2: Spot Detail Bottom Sheet

As a user (anonymous or authenticated),
I want to tap a spot marker and see full details in a bottom sheet,
So that I can read about the spot without leaving the map.

**Acceptance Criteria:**

**Given** I tap a spot marker
**When** the bottom sheet opens
**Then** it slides up to 50% snap point showing: spot name, wiki preview, action buttons

**Given** the bottom sheet is at 50%
**When** I swipe up
**Then** it expands to 90% showing full wiki, conditions section (placeholder), sessions section (placeholder)

**Given** the bottom sheet is open
**When** I swipe down or tap the map
**Then** it dismisses and returns to map view

**Given** I'm on mobile
**When** action buttons are visible
**Then** they're in the bottom 2/3 of screen (one-handed reachability)

**Implementation context:**
- `components/BottomSheet.tsx` — snap points at 30%/50%/90%, drag handle (32x4px, 12px from top)
- Content padding: 24px sides, 16px vertical
- `useMapStore.selectSpot(spotId)` triggers open; `useSpot(spotId)` fetches data with key `['spot', spotId]`
- Lazy load content on open, not on mount
- Slide animation: 300ms ease-out
- Condition/session sections are placeholder containers — populated in Epics 4 and 5

### Story 3.3: Wiki Page Viewing

As an anonymous or authenticated user,
I want to read a spot's wiki page with local knowledge,
So that I can learn about parking, hazards, best conditions, and etiquette.

**Acceptance Criteria:**

**Given** I open a spot's detail bottom sheet
**When** the wiki section loads
**Then** I see rendered markdown with sections for parking, hazards, conditions, etiquette, notes

**Given** the wiki has no content yet
**When** the wiki section loads
**Then** I see "No wiki content yet" with an edit button (if authenticated)

**Given** I'm anonymous
**When** I view wiki content
**Then** I can read everything but see no edit button

**Implementation context:**
- Route: GET `/api/v1/spots/:spotId/wiki` (no auth required)
- WikiContent model: id, spotId, content (markdown), updatedAt, updatedBy
- `features/wiki/components/WikiView.tsx` — renders markdown to native components
- Wiki structured with suggested headings but free-form (FR-SPOT-03)

### Story 3.4: Wiki Page Editing

As an authenticated user,
I want to edit a spot's wiki page,
So that I can share local knowledge with the community.

**Acceptance Criteria:**

**Given** I'm authenticated and viewing a spot's wiki
**When** I tap "Edit Wiki"
**Then** a markdown editor opens with current content pre-filled

**Given** I edit and tap "Save"
**When** the save completes
**Then** wiki updates immediately and I return to view mode

**Given** another user views the wiki after my edit
**When** their page loads
**Then** they see my updated content

**Given** I'm anonymous
**When** I try to edit
**Then** I'm prompted to log in

**Implementation context:**
- Route: PUT `/api/v1/spots/:spotId/wiki` (auth required) — body: `{ content }`
- Overwrites current content (no version control in MVP per NFR-DATA-03)
- Stores `updatedBy` for audit
- `features/wiki/components/WikiEditor.tsx` — multiline TextInput with markdown preview toggle
- `useUpdateWiki` mutation → invalidates `['spot', spotId]`

---

## Epic 4: Condition Reporting & Real-Time

Users can report conditions (swell + directional wind), one-tap confirm existing reports, and see live recency-coded updates across all clients within 30 seconds. This is the core "what's it like?" experience.

### Story 4.1: Real-Time Infrastructure (Socket.io)

As a user with SpotApp open,
I want to see live updates from other users without refreshing,
So that I always have the freshest condition and session data.

**Acceptance Criteria:**

**Given** I open SpotApp
**When** the app connects to the server
**Then** a Socket.io connection is established and I join viewport-based rooms

**Given** I tap into a spot detail
**When** the bottom sheet opens
**Then** I join the `spot:{spotId}` room and receive spot-specific events

**Given** I dismiss the bottom sheet
**When** the sheet closes
**Then** I leave the `spot:{spotId}` room

**Given** another user submits a condition report for a spot in my viewport
**When** the server broadcasts `condition:new`
**Then** my TanStack Query cache for that spot is invalidated and UI updates within 30 seconds

**Implementation context:**
- Server: `server/src/socket/index.ts` — Socket.io attached to HTTP server, handles connection/disconnection
- Room strategy: `spot:{spotId}` (detail views), `viewport:{geohash}` (map-level updates)
- Events are server-to-client only; writes go through REST → DB → Socket.io broadcast
- Client: `lib/socket.ts` — singleton Socket.io client, auto-reconnect
- Socket events invalidate TanStack Query caches: `queryClient.invalidateQueries(['spot', spotId, 'conditions'])`
- No auth required for Socket.io connection (anonymous users get real-time too)

### Story 4.2: Submit Condition Report

As an authenticated user,
I want to report current conditions using sliders for wave height and directional wind,
So that other users can see what it's like right now.

**Acceptance Criteria:**

**Given** I'm authenticated and viewing a spot detail
**When** I tap "Report Conditions"
**Then** the QuickReportSlider form appears with wave height slider and directional wind input

**Given** I set wave height (0-6m, 0.5m increments) and drag the wind arrow (speed 0-20 m/s in 2 m/s increments, 8 cardinal directions)
**When** I tap "Submit"
**Then** the report is saved and broadcast to all clients viewing this spot within 30 seconds (FR-COND-06)

**Given** I complete the full flow
**When** timed from opening the spot to confirmation
**Then** the total time is under 15 seconds (FR-COND-02)

**Given** I'm anonymous
**When** I tap "Report Conditions"
**Then** I'm prompted to log in

**Implementation context:**
- Route: POST `/api/v1/spots/:spotId/conditions` (auth required) — body: `{ waveHeight, windSpeed, windDirection }`
- Service: create report → broadcast `condition:new` to `spot:{spotId}` room
- `features/conditions/components/QuickReportSlider.tsx`:
  - Wave height: standard slider (0-6m, 0.5m increments)
  - Wind: directional drag-arrow control — distance from center = speed, angle = direction (meteorological convention)
  - Concentric circles at 5/10/15/20 m/s as guides, compass labels around perimeter
  - Snaps to 8 cardinal directions and 2 m/s increments with haptic feedback
  - Pre-filled with last report values if available
- Accessibility: alternative text inputs for wind speed + dropdown for direction (screen readers)
- Success animation: checkmark + "Thanks!" toast (2s auto-dismiss)

### Story 4.3: One-Tap Condition Confirm

As an authenticated user,
I want to confirm an existing condition report with a single tap,
So that I can validate accuracy without re-entering data.

**Acceptance Criteria:**

**Given** I'm viewing a spot with an existing condition report
**When** I tap the "Confirm" button
**Then** the confirmation count increments and I see a checkmark animation

**Given** the confirm action
**When** timed from tap to feedback
**Then** it completes in under 3 seconds (FR-COND-03)

**Given** I've already confirmed this report
**When** I view the spot again
**Then** the confirm button is disabled or shows "Confirmed"

**Given** confirmation is submitted
**When** other users view this spot
**Then** they see the updated confirmation count via Socket.io broadcast

**Implementation context:**
- Route: POST `/api/v1/spots/:spotId/conditions/:conditionId/confirm` (auth required)
- ConditionConfirmation model: id, conditionReportId, userId, createdAt (unique constraint on report+user)
- Service: create confirmation → broadcast `condition:confirmed` to `spot:{spotId}` room
- Frontend: large "Confirm" button (48px height, full width) in spot detail
- Optimistic update: increment count immediately via TanStack Query `onMutate`, rollback on error
- Haptic: success vibration on confirm

### Story 4.4: Condition Display with Recency Indicators

As any user (anonymous or authenticated),
I want to see conditions displayed with color-coded freshness,
So that I can instantly assess data trustworthiness without reading timestamps.

**Acceptance Criteria:**

**Given** a condition report exists for a spot
**When** I view the spot
**Then** I see a ConditionBadge showing: wave height, wind speed + direction arrow, time since report, and reporter name (if authenticated)

**Given** a report is <30 minutes old
**When** displayed
**Then** the recency indicator is green (#10B981)

**Given** a report is 30-90 minutes old
**When** displayed
**Then** the recency indicator is yellow (#FBBF24)

**Given** a report is 90min-3h old
**When** displayed
**Then** the recency indicator is orange (#F97316)

**Given** a report is >3h old or no data exists
**When** displayed
**Then** the recency indicator is grey (#9CA3AF)

**Given** I'm anonymous
**When** I view conditions
**Then** I see wave/wind data and recency but NOT the reporter name

**Implementation context:**
- `features/conditions/components/ConditionBadge.tsx`:
  - Inline format: `🌊 1.5m  💨 8 m/s ↗ NE  🕐 15m ago  👤 Mika`
  - Stacked format for bottom sheet
  - Anonymous variant: reporter name hidden
- `features/conditions/components/RecencyIndicator.tsx`:
  - Recency calculated client-side from `createdAt` timestamp (no server-side recency field)
  - Color transitions: 5s linear fade between states (no sudden jumps)
  - Color is never the ONLY indicator — includes clock icon + relative time text
- Recency thresholds: green(0-30min), yellow(30-90min), orange(90min-3h), grey(3h+)
- Accessibility: "Conditions: 1.5 meter waves, 8 meters per second wind from northeast, reported 15 minutes ago"

---

## Epic 5: Session Planning & Coordination

Users can plan sessions (Planned/Now), select sport, see who's going, use the time slider for forward planning. Sessions auto-expire after 90 minutes. This is the core "who's going?" experience.

### Story 5.1: Create and Join Sessions

As an authenticated user,
I want to create a session at a spot with a time and sport type,
So that other users can see I'm planning to go.

**Acceptance Criteria:**

**Given** I'm authenticated and viewing a spot detail
**When** I tap "I'm Going"
**Then** I see time presets (Now, +1h, +2h, +3h, Custom) and sport selector (wing foil, kite, windsurf, other)

**Given** I select "Now" and "Surf"
**When** I confirm
**Then** a "Now" session is created with 90-minute auto-expiry and I'm added as participant

**Given** I select "+2h" and "Wing Foil"
**When** I confirm
**Then** a "Planned" session is created at the calculated time

**Given** session creation
**When** timed from tap to completion
**Then** it takes under 15 seconds including sport selection (FR-SESSION-04)

**Given** a session is created
**When** other users view this spot
**Then** they see the updated session via Socket.io broadcast (`session:joined`)

**Implementation context:**
- Route: POST `/api/v1/spots/:spotId/sessions` (auth required) — body: `{ type: 'now'|'planned', scheduledAt, sportType }`
- Session model: id, userId, spotId, type, sportType (enum: SURF, WING_FOIL, KITE, SUP, WINDSURF, OTHER), scheduledAt, expiresAt (auto-set for "now": scheduledAt + 90min), createdAt
- Service: create session → broadcast `session:joined` to `spot:{spotId}` room
- `features/sessions/components/TimeSlider.tsx`: chip presets (Now/+1h/+2h/+3h/Custom), shows relative + absolute time
- Sport selector: Chip group with sport icons
- FR-SESSION-01 (two states), FR-SESSION-02 (tuple), FR-SESSION-03 (sport), FR-SESSION-04 (creation time)

### Story 5.2: Session Participant List and Leave

As a user viewing a spot,
I want to see who's planning sessions and leave my own session,
So that I can coordinate with the community.

**Acceptance Criteria:**

**Given** I'm authenticated and viewing a spot with active sessions
**When** the session section loads
**Then** I see each session with: participant username, sport icon, time, and session type (Now/Planned)

**Given** I'm anonymous and viewing the same spot
**When** the session section loads
**Then** I see "5 planned sessions" (count only, no usernames) (FR-SESSION-06)

**Given** I'm in a session at this spot
**When** I tap "Leave Session"
**Then** I'm removed from the participant list and others see the update via Socket.io (`session:left`)

**Given** I'm the last participant and I leave
**When** the session has zero participants
**Then** the session is deleted

**Implementation context:**
- Route: DELETE `/api/v1/spots/:spotId/sessions/:sessionId` (auth required, own session only)
- `features/sessions/components/SessionCard.tsx`: participant avatars + names, sport icons, time, leave button
- Optimistic update for join/leave: TanStack Query `onMutate` → instant UI → rollback on error
- Anonymous response shape: `{ sessionCount: 5 }` vs authenticated: `{ sessions: [...] }`

### Story 5.3: Session Auto-Expiry

As a user,
I want "Now" sessions to automatically disappear after 90 minutes,
So that the app always shows current activity without manual cleanup.

**Acceptance Criteria:**

**Given** a "Now" session was created 90 minutes ago
**When** the background job runs
**Then** the session is deleted and `session:expired` is broadcast to the `spot:{spotId}` room

**Given** the expiry job runs
**When** checking timing accuracy
**Then** sessions expire within 5-minute accuracy of the 90-minute mark (NFR-AVAIL-04)

**Given** a "Planned" session exists
**When** the expiry job runs
**Then** it is NOT affected (planned sessions don't auto-expire)

**Implementation context:**
- `server/src/jobs/sessionExpiry.ts`: node-cron job running every 5 minutes
- Query: `DELETE FROM Session WHERE type = 'now' AND expiresAt < NOW()`
- After deletion: emit `session:expired` to affected spot rooms
- Hard delete (not soft delete) for expired sessions — they served their purpose
- Planned sessions retained per NFR-DATA-01 (30 days after scheduled time)

### Story 5.4: Time Slider for Forward Planning

As a user,
I want to slide a time selector to see who's planning sessions at future times,
So that I can decide when to go based on community plans.

**Acceptance Criteria:**

**Given** I'm viewing the map
**When** I interact with the time slider
**Then** I see presets: Now, +1h, +2h, +3h, and a custom time picker

**Given** I select "+2h"
**When** the time filter applies
**Then** spot markers update to show session counts for the selected time window (FR-SESSION-07)

**Given** I select "Now" (default)
**When** the map loads
**Then** spot cards show current active sessions

**Given** no sessions exist at the selected time
**When** the slider is set
**Then** spot session counts show 0 (valid state)

**Implementation context:**
- `features/sessions/components/TimeSlider.tsx`: chip row at top of map (below safe area)
- Default range: now to sunset (computed from geolocation + date)
- Query: GET `/api/v1/spots?viewport=...&timeFrom=...&timeTo=...`
- TanStack Query key: `['spots', { viewport, time }]` — time changes invalidate and refetch
- Spot markers update session counts based on selected time window
- Users can edit own session time (postpone +1h → +2h) via TimeSlider in session detail

---

## Epic 6: Map Intelligence & Offline

Map scales with zoom-density clustering, shows rich at-a-glance spot cards combining conditions + sessions + recency, works offline with cached data, and is installable as a PWA.

### Story 6.1: Zoom-Density Clustering

As a user viewing a large area with many spots,
I want spots to cluster at low zoom and separate at high zoom,
So that the map stays readable at any zoom level.

**Acceptance Criteria:**

**Given** 20+ spots are in the visible viewport at low zoom (zoom <12)
**When** the map renders
**Then** nearby spots are grouped into ClusterMarkers showing the count

**Given** I zoom into a cluster
**When** zoom reaches 12-15
**Then** individual SpotMarkers appear replacing the cluster

**Given** I zoom in further (>15)
**When** full detail zoom
**Then** SpotMarkers show full detail (conditions, session count, recency color)

**Implementation context:**
- `features/spots/components/ClusterMarker.tsx`: 40-64px circle, count badge, aggregated recency color (freshest report color)
- Clustering algorithm: client-side using `supercluster` library (works with both map renderers)
- Cluster → individual transition: animated expand on zoom
- React.memo on both ClusterMarker and SpotMarker to prevent re-renders during gestures
- Zoom thresholds: <12 clusters, 12-15 individual, >15 full detail (per UX spec)

### Story 6.2: Rich Spot Cards on Map

As a user scanning the map,
I want spot markers to show conditions, session count, and recency at a glance,
So that I can make a go/no-go decision in under 10 seconds without tapping.

**Acceptance Criteria:**

**Given** a spot has recent conditions and active sessions
**When** the marker is visible at zoom >12
**Then** I see: recency-colored background, wave/wind summary, session count badge, sport icons

**Given** a spot has no recent data
**When** the marker is visible
**Then** it appears grey with no condition data (just spot name)

**Given** I scan 3-5 nearby spots
**When** I assess the markers visually
**Then** I can make a confident go/no-go decision without tapping any marker (NFR-USE-02: <10s)

**Implementation context:**
- Enhanced `SpotMarker.tsx`: recency-colored background (green/yellow/orange/grey), mini ConditionBadge overlay, session count badge, sport icon(s)
- SpotMarker sizes: 32px at far zoom, 56px at close zoom
- API: GET `/api/v1/spots?viewport=...` now returns enriched data: latest condition, session count, freshest report timestamp
- Server-side: `node-cache` caches hot spot data (active sessions, latest conditions), invalidated on writes
- This is the "one-glance decision" — the core SpotApp experience (FR-MAP-03)

### Story 6.3: Offline Data Persistence & Sync

As a user in an area with poor connectivity,
I want to see cached map data and have my actions queued for sync,
So that the app remains useful offline.

**Acceptance Criteria:**

**Given** I've previously loaded spot data while online
**When** I lose network connectivity
**Then** I see cached spots, conditions, and wiki content with a "Using cached data" banner

**Given** I'm offline and submit a condition report or join a session
**When** the request fails
**Then** the action is queued with a "Pending" indicator

**Given** I come back online
**When** connectivity is restored
**Then** queued actions are replayed in order, successful ones clear, 4xx errors show toast

**Given** I'm offline
**When** I view the map
**Then** cached map tiles load normally (no broken images)

**Implementation context:**
- TanStack Query persistence: `persistQueryClient` to expo-sqlite via `@tanstack/query-persist-client-core`
- Write queue: `lib/offlineQueue.ts` — expo-sqlite table `{ id, type, payload, timestamp, retryCount }`
- NetInfo listener: on reconnect → replay queue → success removes entry, invalidates queries → 4xx removes entry + error toast
- `components/OfflineBanner.tsx`: top banner "Using cached data", dismissible
- `stores/useUIStore.ts`: offlineBanner state, queued action indicators
- Map tile caching: handled natively by map libraries (react-native-maps tile cache, browser cache for web)

### Story 6.4: PWA Installation & Service Worker

As a mobile web user,
I want to install SpotApp to my home screen and have it work like a native app,
So that I get instant access without app store friction.

**Acceptance Criteria:**

**Given** I visit SpotApp in a mobile browser
**When** the browser detects PWA capabilities
**Then** I see an "Add to Home Screen" prompt

**Given** I've installed the PWA
**When** I launch from home screen
**Then** it opens fullscreen (no browser chrome) with splash screen

**Given** the service worker is active
**When** I load the app
**Then** returning users see content within 2 seconds (NFR-PERF-02)

**Given** Lighthouse PWA audit is run
**When** the audit completes
**Then** the score is >= 90 (NFR-USE-04)

**Implementation context:**
- Expo web build: static export to Vercel with PWA manifest
- `app.json` / `web` config: name, icons (192px, 512px), theme_color (#0284C7), background_color (#F8FAFC)
- Service worker: Workbox via Expo web config for asset caching + API caching (stale-while-revalidate for spots, network-first for mutations)
- Splash screen: ocean blue background + SpotApp logo
- Browser compatibility: Chrome/Edge (latest 2), Safari iOS (latest 2), Firefox (latest 2) (NFR-USE-05)

---

## Epic 7: Admin & Moderation

Superadmin can block/unblock users, delete spots, remove wiki spam, and all actions are audit-logged. Keeps the community clean with fast, accountable moderation.

### Story 7.1: Block and Unblock Users

As a superadmin,
I want to block abusive users and unblock them if needed,
So that I can maintain community health.

**Acceptance Criteria:**

**Given** I'm superadmin viewing a user's profile or moderation panel
**When** I tap "Block User" and confirm
**Then** the user is blocked: cannot log in, existing sessions removed, condition reports removed

**Given** a user is blocked
**When** they attempt to log in or use a refresh token
**Then** they get 403 "Account blocked"

**Given** I'm superadmin viewing a blocked user
**When** I tap "Unblock User"
**Then** the user regains full access immediately (FR-USER-07)

**Given** any block/unblock action
**When** the action completes
**Then** an audit log entry is created with timestamp and admin username

**Implementation context:**
- Routes: POST `/api/v1/admin/users/:userId/block`, POST `/api/v1/admin/users/:userId/unblock` (admin only)
- Block cascade: soft-delete user sessions + condition reports (or hard-delete per your preference)
- Auth middleware checks `isBlocked` flag on every authenticated request
- Socket.io: broadcast `moderation:action` to admin room
- Frontend: `features/admin/components/UserManagement.tsx` — user list with block/unblock buttons

### Story 7.2: Delete Spots and Moderate Wiki Content

As a superadmin,
I want to delete spam spots and remove wiki vandalism,
So that community content stays clean and trustworthy.

**Acceptance Criteria:**

**Given** I'm superadmin viewing a spot
**When** I tap "Delete Spot" and confirm
**Then** the spot and all associated data (sessions, conditions, wiki) are permanently deleted (FR-SPOT-04)

**Given** I'm superadmin viewing a spot wiki
**When** I tap "Revert Wiki" or "Clear Wiki"
**Then** the wiki content is removed/reverted and the change is immediate (FR-MOD-01)

**Given** deletion or wiki revert
**When** the action completes
**Then** spot markers update for all connected clients via Socket.io

**Given** any moderation action
**When** performed
**Then** an audit log entry records the action, target, and admin

**Implementation context:**
- Routes: DELETE `/api/v1/admin/spots/:spotId` (admin only), PUT `/api/v1/admin/spots/:spotId/wiki/revert` (admin only)
- Spot deletion: cascade delete all related records (Prisma `onDelete: Cascade` or service-level)
- Wiki revert: overwrite content with empty string or previous version (MVP: clear content)
- Socket.io: broadcast `spot:updated` or `spot:deleted` to viewport rooms
- Confirmation dialog required for destructive actions

### Story 7.3: Moderation Audit Trail

As a superadmin,
I want to see a log of all moderation actions,
So that there's accountability and I can review past decisions.

**Acceptance Criteria:**

**Given** I'm superadmin on the moderation panel
**When** I view the audit log
**Then** I see all moderation actions: type, target (user/spot/wiki), admin username, timestamp

**Given** multiple moderation actions have occurred
**When** I view the log
**Then** entries are sorted newest-first with filtering by action type

**Given** any admin performs a moderation action
**When** the action is recorded
**Then** the audit entry is immutable (cannot be edited or deleted) (FR-MOD-02)

**Implementation context:**
- AuditLog model: id, action (enum: USER_BLOCKED, USER_UNBLOCKED, SPOT_DELETED, WIKI_REVERTED), targetType, targetId, adminId, metadata (JSON), createdAt
- Route: GET `/api/v1/admin/audit-log` (admin only) with pagination and optional `?action=` filter
- Audit entries created in same transaction as the moderation action (consistency)
- Frontend: `features/admin/components/AuditLog.tsx` — table/list view with action icons and timestamps
- Immutable: no UPDATE or DELETE routes for audit entries

---

## NFR Implementation Notes

NFRs are addressed across stories rather than in dedicated epics. Key mappings:

| NFR Category | Where Addressed |
|-------------|-----------------|
| Performance (PERF-01 to 05) | Story 1.3 (map <3s), Story 1.2 (API <200ms), Story 6.2 (server cache) |
| Scalability (SCALE-01 to 04) | Story 1.2 (viewport queries), Story 4.1 (Socket.io rooms), Story 6.1 (clustering) |
| Availability (AVAIL-01 to 04) | Story 5.3 (auto-expiry), Story 6.3 (offline), Story 6.4 (PWA) |
| Security (SEC-01 to 07) | Story 2.1 (bcrypt, anti-bot), Story 2.2 (JWT), Story 2.5 (invitation codes) |
| Usability (USE-01 to 05) | Story 3.2 (bottom sheet), Story 4.2 (report <15s), Story 6.4 (PWA) |
| Maintainability (MAINT-01 to 04) | Story 1.1 (project structure), Story 1.2 (API-first, OpenAPI) |
| Data Retention (DATA-01 to 04) | Story 5.3 (session cleanup), Story 3.4 (wiki no versioning) |
| Testing (TEST-01 to 03) | All stories include testable ACs; CI/CD in deployment setup |
