---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['prd.md', 'ux-design-specification.md', 'ux-design-component-strategy.md', 'platform-decision-pwa-vs-reactnative.md']
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-21'
project_name: 'spotapp'
user_name: 'Hemmu'
date: '2026-02-20'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
28 FRs across 6 domains. The core architectural challenge is that Map/Visualization, Session Planning, and Condition Reporting are deeply intertwined — a single map view must compose real-time session data, time-decaying condition reports, and zoom-responsive marker clustering into one coherent experience. User Management introduces a progressive disclosure model where the same API endpoints return different data shapes based on authentication state (anonymous gets counts, registered gets identities). Content Moderation requires an audit trail, making all destructive operations (block user, delete spot, revert wiki) traceable.

**Non-Functional Requirements:**
~36 NFRs that most heavily shape architecture:
- **Performance:** Map interactive <3s, API p95 <200ms, DB queries <100ms for 500 spots, real-time propagation <30s
- **Scalability:** 100 concurrent users, 1,000 spots, 10,000 sessions, 50,000 condition reports
- **Security:** bcrypt (factor >=12), 128-bit session tokens, server-side invitation code validation, multi-layer anti-bot, rate limiting (10/min registration, 100/min general)
- **Availability:** 99% uptime during peak (6AM-8PM), graceful offline degradation, zero data loss
- **Maintainability:** API-first (OpenAPI), versioned (v1), frontend-backend independently deployable

**Scale & Complexity:**

- Primary domain: Full-stack (Expo React Native + API backend + real-time layer + geospatial)
- Complexity level: Medium
- Estimated architectural components: ~8-10 major (API server, real-time server, database, auth service, map rendering layer, offline cache layer, background job scheduler, CDN/static hosting, monitoring)

### Technical Constraints & Dependencies

- **Platform locked:** Expo (React Native) with web + Expo Go deployment (per platform decision document)
- **Map libraries:** React Native Maps (native) + react-map-gl (web) — two different map renderers requiring abstraction
- **Design system:** React Native Paper v5 + 8 custom map components
- **No push notifications in MVP** — Expo Go sandbox limitation. Architecture should not depend on push.
- **Invitation code gating** — no open registration, community-controlled onboarding
- **No email required** — username + password + invitation code only. Impacts password recovery (none in MVP).
- **No photos in MVP** — eliminates blob storage and CDN complexity for now
- **Metric system only** — wind in m/s, waves in meters (no unit conversion needed)

### Cross-Cutting Concerns Identified

1. **Authentication & Authorization** — Three-tier model (anonymous/registered/superadmin) affects every API endpoint's response shape and access control
2. **Real-Time Data Layer** — WebSocket infrastructure for session updates, condition report propagation, and moderation actions. Must handle 100 concurrent connections.
3. **Temporal Data Lifecycle** — Server-side: auto-expire "Now" sessions (90min), cleanup jobs. Client-side: recency color transitions (green→yellow→orange→grey), live fading.
4. **Offline Strategy** — Map tile caching, spot/condition data caching (expo-sqlite), write queue for condition reports and session actions, sync-on-reconnect.
5. **Cross-Platform Rendering** — Expo web and Expo Go use different map renderers. Abstraction layer needed to unify marker rendering, clustering, and gesture handling.
6. **Rate Limiting & Anti-Bot** — Registration endpoint: multi-layer (honeypot + JS challenge + time check + rate limit). General API: per-user rate limiting. Must be middleware-level, not per-endpoint.
7. **Audit Trail** — All superadmin actions logged with timestamp + admin username. Separate from application logging.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack TypeScript: Expo (React Native) frontend + Express.js API backend + PostgreSQL + Socket.io real-time layer

### Technical Preferences

- **Language:** TypeScript across the entire stack (frontend + backend)
- **Frontend framework:** Expo (React Native) — locked by platform decision
- **Backend framework:** Node.js with Express — preferred over Django/Python
- **Database:** PostgreSQL — fits geospatial needs, strong ecosystem
- **Deployment:** Railway (API + DB) + Vercel (Expo web frontend)
- **Auth:** Custom JWT implementation — invitation code flow too custom for BaaS auth
- **Developer profile:** Intermediate, stronger with backend/data modeling, AI-agent-assisted development

### Starter Options Considered

**Frontend starters evaluated:**
1. `create-expo-app --template default` (Expo SDK 54, Expo Router, TypeScript) — **Selected**
2. `create-expo-app --template tabs` (tab-based navigation) — Rejected: SpotApp is map-only, no tabs
3. `create-expo-stack` (community CLI with NativeWind/Supabase options) — Rejected: adds opinions we don't need
4. SDK 55 beta template (`--template default@next`) — Rejected: beta, breaking changes to `src/app/` structure

**Backend starters evaluated:**
1. Custom Express 5 + Prisma + Socket.io + Zod composition — **Selected**
2. NestJS boilerplate — Rejected: enterprise-grade, overkill for solo project
3. Fastify 5 + Drizzle — Rejected: Socket.io/Fastify 5 compatibility concerns, less documentation density
4. Supabase as backend — Rejected: conflicts with API-first requirement, less "architecture showcase"

### Selected Starter: Expo Default + Custom Express Backend

**Rationale for Selection:**
- Expo default template provides the exact foundation needed: Expo Router + TypeScript + SDK 54 stable
- No single backend starter covers the full requirement set (REST + WebSocket + auth + validation), so composing from well-tested individual libraries is the standard approach
- Express 5 chosen over Fastify for documentation density and AI-agent code generation reliability
- Prisma chosen over Drizzle for migration tooling and schema-first workflow (leverages data modeling strength)

**Initialization Commands:**

```bash
# Frontend
npx create-expo-app@latest spotapp --template default

# Backend (manual composition)
mkdir server && cd server
npm init -y
npm install express@5 socket.io prisma @prisma/client zod jsonwebtoken bcryptjs cors helmet
npm install -D typescript @types/express @types/node @types/jsonwebtoken @types/bcryptjs @types/cors tsx
npx tsc --init
npx prisma init
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript 5.x across full stack. Expo handles frontend compilation via Metro bundler. Backend uses `tsx` for development, `tsc` for production builds. Node.js 20+ required.

**Styling Solution:**
React Native Paper v5 (per UX specification). No CSS framework — React Native uses StyleSheet API. Design tokens defined in theme configuration.

**Build Tooling:**
Frontend: Metro bundler (Expo default). Backend: TypeScript compiler (`tsc`) for production, `tsx` for development with hot reload.

**Testing Framework:**
To be decided in architectural decisions step. Jest is Expo's default. Vitest is the modern alternative for backend.

**Code Organization:**
Frontend: Expo Router file-based routing in `app/` directory. Backend: layered architecture (routes → middleware → services → data access).

**Development Experience:**
Frontend: Expo CLI with hot reload, web + Expo Go simultaneous development. Backend: `tsx --watch` for auto-restart on changes. Prisma Studio for database inspection.

**Deployment Architecture:**
- Vercel: Expo web build (static export, free tier, global CDN)
- Railway: Express API + Socket.io server (persistent process, $5/month)
- Railway: PostgreSQL (managed, ~$0.55/month)

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data modeling: Prisma schema-first, simple bounding box geospatial (no PostGIS for MVP)
- Auth: JWT dual-token (15min access + 30-day refresh) with custom invitation code flow
- API: RESTful `/api/v1/` with consistent JSON envelope, Zod validation
- Real-time: Socket.io with per-spot rooms and viewport geohash rooms
- State management: TanStack Query (server state) + Zustand (client state)

**Important Decisions (Shape Architecture):**
- Map abstraction layer wrapping React Native Maps (native) + react-map-gl (web)
- Offline strategy: TanStack Query persistence to expo-sqlite + write queue
- Logging: Pino (structured JSON) + Sentry error tracking
- CI/CD: GitHub Actions → Vercel (frontend) + Railway (backend)

**Deferred Decisions (Post-MVP):**
- PostGIS migration (when spots exceed 10,000)
- Redis caching layer (when scaling beyond single process)
- CDN for user-uploaded photos (no photos in MVP)
- Push notification infrastructure (blocked by Expo Go sandbox)
- Wiki version control system

### Data Architecture

**Database:** PostgreSQL 16+ on Railway managed instance

**ORM:** Prisma 6.19.x
- Schema-first modeling with declarative migrations
- Auto-generated TypeScript types flow from schema to API to frontend
- Prisma Studio for database inspection during development

**Geospatial approach:** Simple lat/lng columns with composite index
- Viewport queries: `WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?`
- Sufficient for 1,000 spots at <100ms query time (NFR-PERF-05)
- PostGIS upgrade path available without schema changes

**Server-side caching:** `node-cache` (in-process TTL cache)
- Hot data: active sessions per spot, latest condition reports
- Cache invalidated on writes via Socket.io event pipeline
- No Redis needed at 100 concurrent users

**Client-side data:** TanStack Query 5.x + expo-sqlite
- TanStack Query: API data fetching, caching, stale-while-revalidate, optimistic updates
- expo-sqlite: Offline persistence via `persistQueryClient`, write queue for pending submissions
- Sync-on-reconnect via NetInfo listener

**Data lifecycle patterns:**
- Soft deletes for user-facing data (spots, wiki content) — enables undo and audit
- Hard deletes for expired sessions (cleanup job)
- UTC timestamps everywhere, client converts to local display
- Recency calculated client-side from `createdAt` timestamp (no server-side recency field)

### Authentication & Security

**JWT dual-token strategy:**
- Access token: 15-minute expiry, Authorization header, payload `{ userId, role }`
- Refresh token: 30-day expiry (NFR-SEC-02), httpOnly cookie (web) / SecureStore (native)
- Token refresh: Silent, transparent to user via TanStack Query auth interceptor

**Three-tier authorization:**
- `anonymous`: No token. API returns aggregated data (counts, no identities)
- `user`: Valid access token. API returns full data (identities, can contribute)
- `admin`: Valid token + admin flag in DB. Access to moderation endpoints + audit trail
- Middleware chain: `extractToken → verifyJWT → attachUser → checkRole → handler`

**Invitation code system:**
- DB table: `invitation_codes { id, code, maxUses, currentUses, expiresAt, createdBy }`
- Server-side validation during registration
- Admin creates codes via `/api/v1/admin/invitation-codes`

**Anti-bot middleware (registration endpoint only):**
- Chain: `rateLimit(10/min/IP) → honeypotCheck → timeCheck(>5s) → jsChallengeValidation → register`
- All checks silent — user sees nothing on success, generic 403 on failure

**HTTP security:**
- Helmet.js with secure defaults (CSP, HSTS, X-Frame-Options, etc.)
- CORS whitelist: production Vercel domain + localhost for development
- bcrypt password hashing with work factor >=12 (NFR-SEC-01)

### API & Communication Patterns

**REST API design:**
- Base URL: `/api/v1/`
- Resource URLs: `/spots`, `/spots/:id/sessions`, `/spots/:id/conditions`, `/users/:id`
- Plural nouns, standard HTTP methods (GET/POST/PATCH/DELETE)
- Viewport filtering: `?viewport=lat1,lng1,lat2,lng2`
- Sport filtering: `?sport=surf,kite`

**Response envelope:**
```json
{ "data": { ... } }                              // Single resource
{ "data": [...], "meta": { "count": 42 } }       // Collection
{ "error": { "code": "INVALID_TOKEN", "message": "..." } }  // Error
```
Anonymous vs. registered responses differ in data shape (counts vs. identities), not envelope structure.

**Validation:** Zod 4.x schemas at API boundary
- Request body, query params, and path params validated via Zod
- Validation errors return 400 with field-level details
- Schemas shared between backend validation and frontend form validation where possible

**Error handling:**
- Express async error handler middleware (global)
- All errors normalized to `{ error: { code, message } }` envelope
- Zod errors → 400 with field details
- Auth errors → 401/403 with code
- Not found → 404
- Uncaught → logged to Sentry + generic 500 to client

**Socket.io room strategy:**
- `spot:{spotId}` — Per-spot room. Client joins on spot detail view, leaves on dismiss. Events: `condition:new`, `condition:confirmed`, `session:joined`, `session:left`, `session:expired`
- `viewport:{geohash}` — Viewport room. Client joins based on map center geohash. Events: `spot:created`, `spot:updated`, `session:countChanged`
- `admin` — Superadmin room. Events: `moderation:action`

**OpenAPI documentation:**
- `swagger-jsdoc` generates OpenAPI 3.0 spec from JSDoc comments in route files
- `swagger-ui-express` serves interactive docs at `/api/docs`
- Satisfies NFR-MAINT-01 (API documented with OpenAPI specification)

### Frontend Architecture

**State management:**
- TanStack Query 5.x: All server state (spots, sessions, conditions, user profile). Handles caching, background refresh, optimistic updates, retry.
- Zustand: Client-only state (map viewport, zoom level, selected spot, bottom sheet state, auth tokens). Lightweight, TypeScript-first, no boilerplate.

**Map abstraction layer:**
- Custom `<MapView>` component wrapping React Native Maps (native) and react-map-gl (web)
- Common prop interface: `onRegionChange`, `markers`, `clusters`, `onMarkerPress`
- `Platform.select()` internally routes to correct implementation
- Marker rendering logic shared; only map renderer differs

**Component architecture:**
- `app/` — Expo Router screens (map, auth, admin)
- `features/` — Domain modules (spots, sessions, conditions, auth, admin) each with components, hooks, API calls
- `components/` — Shared UI: BottomSheet, SpotMarker, ClusterMarker, ConditionBadge, RecencyIndicator, TimeSlider, SessionCard, QuickReportSlider

**Offline strategy:**
- Map tiles: Cached by map library natively (react-native-maps tile cache, browser cache for web)
- Spot + condition data: TanStack Query persisted to expo-sqlite via `persistQueryClient`
- Write queue: Failed submissions saved to expo-sqlite, retried on connectivity restore (NetInfo listener)
- UI: "Using cached data" banner when offline, queued actions shown as "pending"

### Infrastructure & Deployment

**Deployment topology:**
- Vercel (free tier): Expo web build as static export, global CDN
- Railway ($5/month): Express API + Socket.io (persistent process)
- Railway (~$0.55/month): PostgreSQL managed instance

**CI/CD:** GitHub Actions
- Pipeline: `lint → typecheck → test → build → deploy`
- Frontend: Auto-deploy to Vercel on push (Vercel GitHub integration)
- Backend: Auto-deploy to Railway on push (Railway GitHub integration)

**Environment configuration:**
- `.env` files for local development (gitignored)
- Railway + Vercel inject env vars via dashboards
- Zod schema validates all env vars at server startup (crash early if misconfigured)

**Monitoring & logging:**
- Pino: Structured JSON logging, log levels (error/warn/info/debug), Railway captures stdout
- Sentry (free tier): Uncaught exceptions, unhandled rejections, frontend crashes
- UptimeRobot (free tier): External uptime monitoring for 99% NFR

**Session expiry background job:**
- `node-cron` inside Express process, runs every 5 minutes
- Deletes expired "Now" sessions (createdAt > 90 minutes ago)
- Emits Socket.io events to affected spot rooms for client updates
- Satisfies NFR-AVAIL-04 (within 5-minute accuracy)

**Database backup:**
- Railway automated daily backups on paid PostgreSQL
- Sufficient for MVP; manual `pg_dump` available if needed

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffolding (Expo + Express + Prisma init)
2. Database schema + Prisma migrations
3. Auth system (JWT + invitation codes + anti-bot)
4. Core API (spots CRUD, conditions, sessions)
5. Socket.io real-time layer
6. Frontend map + markers + bottom sheet
7. Offline caching layer
8. Admin moderation endpoints
9. CI/CD + deployment
10. OpenAPI docs + monitoring

**Cross-Component Dependencies:**
- Auth middleware must exist before any authenticated endpoint
- Prisma schema must be complete before API routes (TypeScript types flow from schema)
- Socket.io room strategy requires spot IDs to exist (DB first)
- TanStack Query hooks depend on API endpoint contracts being stable
- Offline queue depends on both TanStack Query and expo-sqlite being configured
- Map abstraction must work on both platforms before marker rendering

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 24 areas where AI agents could make different choices, resolved below.

### Naming Patterns

**Database Naming (Prisma Schema):**

| Element | Convention | Example |
|---------|-----------|---------|
| Model names | PascalCase singular | `User`, `Spot`, `Session`, `ConditionReport` |
| Field names | camelCase | `userId`, `createdAt`, `windSpeed` |
| Relation fields | camelCase, descriptive | `spot` (belongsTo), `sessions` (hasMany) |
| Enum names | PascalCase | `SportType`, `UserRole` |
| Enum values | UPPER_SNAKE_CASE | `WING_FOIL`, `WINDSURF`, `SUP` |
| IDs | cuid2 via `@default(cuid())` | URL-safe, non-sequential, prevents enumeration |

**API Naming:**

| Element | Convention | Example |
|---------|-----------|---------|
| URL paths | lowercase plural nouns | `/api/v1/spots`, `/api/v1/sessions` |
| Nested resources | parent/id/child | `/api/v1/spots/:spotId/conditions` |
| Route params | camelCase with entity prefix | `:spotId`, `:userId`, `:sessionId` |
| Query params | camelCase | `?sportType=surf&viewport=...` |
| JSON fields | camelCase | `{ "windSpeed": 8, "createdAt": "..." }` |

**Code Naming:**

| Element | Convention | Example |
|---------|-----------|---------|
| React components | PascalCase | `SpotMarker`, `ConditionBadge` |
| Component files | PascalCase.tsx | `SpotMarker.tsx` |
| Hooks | camelCase with `use` prefix | `useMapStore`, `useSpotConditions` |
| Hook files | camelCase.ts | `useMapStore.ts` |
| Utility functions/files | camelCase | `formatRecency.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_WIND_SPEED`, `SESSION_EXPIRY_MINUTES` |
| Types/Interfaces | PascalCase | `SpotWithConditions`, `CreateSessionInput` |
| Zustand stores | `use{Name}Store` | `useMapStore`, `useAuthStore` |
| Express routes | camelCase.routes.ts | `spots.routes.ts` |
| Express middleware | camelCase.ts | `authMiddleware.ts` |
| Services | camelCase.service.ts | `spots.service.ts` |
| Test files | co-located `.test.ts(x)` | `SpotMarker.test.tsx`, `spots.service.test.ts` |

### Structure Patterns

**Frontend (Expo):**

```
app/                          # Expo Router screens (thin — compose features only)
  _layout.tsx
  index.tsx                   # Map screen (home)
  (auth)/login.tsx, register.tsx
  (admin)/moderation.tsx
  spot/[spotId].tsx

features/                     # Domain modules
  spots/components/, hooks/, api/, types.ts
  sessions/components/, hooks/, api/, types.ts
  conditions/components/, hooks/, api/, types.ts
  auth/components/, hooks/, api/, types.ts

components/                   # Shared UI (BottomSheet, RecencyIndicator, etc.)
stores/                       # Zustand (useMapStore, useAuthStore, useUIStore)
lib/                          # Utilities (api-client, socket, constants, theme)
types/                        # Global types (api.ts, navigation.ts)
```

**Backend (Express):**

```
server/src/
  routes/                     # Route definitions (thin)
  middleware/                  # Auth, validation, rate limiting, error handler
  services/                   # Business logic
  socket/                     # Socket.io setup + event handlers
  schemas/                    # Zod validation schemas
  utils/                      # JWT, password, recency helpers
  jobs/                       # Background jobs (session expiry)
  config/                     # Env validation, CORS config
  app.ts                      # Express setup
  server.ts                   # HTTP + Socket.io + listen

server/prisma/
  schema.prisma, migrations/, seed.ts
```

**Structural rules:**
- Screens are thin — compose feature components, no business logic
- Co-located tests — test files next to the code they test
- One export per file for components; utility files may export multiple related functions
- Index files only for re-exports, never implementation logic
- No circular imports — routes → middleware → services → prisma; features never import from other features

### Format Patterns

**API Response Formats:**

```typescript
// Single:     { "data": { ... } }
// Collection: { "data": [...], "meta": { "count": 42 } }
// Error:      { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {...} } }
// Empty:      { "data": null }
```

**Standardized error codes:** `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`

**Date/time:** ISO 8601 UTC strings everywhere in API (`"2026-02-21T05:47:00.000Z"`). Client converts to local for display. Never store or transmit local times.

**Null handling:** Omit null fields in responses unless client needs to distinguish "not set" from "not returned."

**Booleans:** `true`/`false` only. Never `1`/`0` or string booleans.

### Communication Patterns

**Socket.io Events:**

Format: `resource:action` (lowercase, colon-separated). All events server-to-client only. Client writes go through REST API → DB → Socket.io broadcast.

| Event | Direction | Payload |
|-------|-----------|---------|
| `condition:new` | Server → Client | `{ spotId, condition }` |
| `condition:confirmed` | Server → Client | `{ spotId, conditionId, confirmCount }` |
| `session:joined` | Server → Client | `{ spotId, session }` |
| `session:left` | Server → Client | `{ spotId, sessionId, userId }` |
| `session:expired` | Server → Client | `{ spotId, sessionId }` |
| `spot:created` | Server → Client | `{ spot }` |
| `spot:updated` | Server → Client | `{ spot }` |
| `moderation:action` | Server → Admin | `{ action, target, adminId, timestamp }` |

**TanStack Query Keys:**

```typescript
['spots', { viewport }]                    // List spots in viewport
['spot', spotId]                           // Single spot
['spot', spotId, 'conditions']             // Conditions for spot
['spot', spotId, 'sessions']               // Sessions for spot
['spot', spotId, 'sessions', { time }]     // Sessions at time
['user', 'me']                             // Current user
['admin', 'invitation-codes']              // Admin codes
```

**TanStack Query Hook Naming:**

```typescript
// Queries: use{Resource}(s)
useSpots(viewport), useSpot(spotId), useSpotConditions(spotId)

// Mutations: use{Action}{Resource}
useCreateCondition(), useConfirmCondition(), useJoinSession(), useLeaveSession()
```

**Zustand Store Conventions:**

```typescript
useMapStore       // viewport, zoom, selectedSpotId, mapReady
useAuthStore      // user, tokens, isAuthenticated, role
useUIStore        // bottomSheetState, offlineBanner, toasts
// Actions: store.setViewport(), store.selectSpot(), store.clearSelection()
// Never put server data in Zustand — server data belongs in TanStack Query
```

### Process Patterns

**Error Handling:**
- Backend: Async route handlers, custom `AppError` class with code + message, global error handler formats to standard envelope
- Frontend: TanStack Query `onError` for mutation-specific handling, global error boundary for React crashes, toast notifications for user-facing errors
- Never show raw error messages to users

**Loading States:**
- Use TanStack Query `isLoading`/`isFetching`/`isError` directly
- Map: Skeleton markers while loading, real markers when ready
- Bottom sheet: Spinner inside sheet for detail loading
- Actions: Spinner on button + disable during request
- Never block entire screen with loading overlay — keep map interactive

**Optimistic Updates:**
- Use for: session join/leave, condition confirm (instant feel)
- Don't use for: condition reports, spot creation (need server validation)
- Pattern: TanStack Query `onMutate` → optimistic update → `onError` → rollback

**Offline Queue:**
1. On network failure: save to expo-sqlite queue `{ type, payload, timestamp, retryCount }`
2. Show "Queued" indicator on the action
3. NetInfo listener: on reconnect, replay queue in order
4. Success: remove from queue, invalidate related queries
5. Permanent failure (4xx): remove from queue, show error toast

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow naming conventions above — no exceptions
2. Place files in specified directories
3. Use standard response envelope for all API endpoints
4. Use `AppError` with standardized error codes
5. Keep Expo Router screen files thin
6. Use TanStack Query for all server data, Zustand for client-only state
7. Co-locate test files
8. Use ISO 8601 UTC for all timestamps
9. Use cuid2 for all IDs
10. Socket.io events are server-to-client only

**Anti-Patterns (forbidden):**
- Business logic in route handlers (use services)
- Importing between feature directories (use shared `lib/` or `components/`)
- `index.ts` with implementation logic (re-exports only)
- Mixing camelCase and snake_case in JSON
- Using `any` type (use `unknown` and narrow)
- Inline SQL (all DB access through Prisma)
- Storing derived data that can be calculated (e.g., recency from timestamp)

## Project Structure & Boundaries

### Complete Project Directory Structure

Monorepo — single git repo, independently deployable. Vercel deploys from root (Expo web), Railway deploys from `server/`.

```
spotapp/
├── .github/workflows/
│   ├── frontend-ci.yml
│   └── backend-ci.yml
├── .env.example
├── .gitignore
├── package.json                     # Frontend (Expo)
├── tsconfig.json
├── app.json                         # Expo config
├── babel.config.js
│
├── app/                             # Expo Router — SCREENS ONLY (thin)
│   ├── _layout.tsx                  # Root layout: providers
│   ├── index.tsx                    # Map screen (home)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (admin)/
│   │   ├── _layout.tsx
│   │   └── moderation.tsx
│   └── spot/
│       └── [spotId].tsx             # Deep link to spot detail
│
├── features/                        # Domain modules
│   ├── spots/
│   │   ├── components/              # SpotMarker, ClusterMarker, SpotDetail + tests
│   │   ├── hooks/                   # useSpots, useSpot, useCreateSpot
│   │   ├── api/spots.api.ts
│   │   └── types.ts
│   ├── sessions/
│   │   ├── components/              # SessionCard, TimeSlider + tests
│   │   ├── hooks/                   # useSessions, useJoinSession, useLeaveSession
│   │   ├── api/sessions.api.ts
│   │   └── types.ts
│   ├── conditions/
│   │   ├── components/              # ConditionBadge, QuickReportSlider, RecencyIndicator + tests
│   │   ├── hooks/                   # useConditions, useCreateCondition, useConfirmCondition
│   │   ├── api/conditions.api.ts
│   │   └── types.ts
│   ├── auth/
│   │   ├── components/              # LoginForm, RegisterForm, AuthGuard + tests
│   │   ├── hooks/                   # useAuth, useLogin, useRegister
│   │   ├── api/auth.api.ts
│   │   └── types.ts
│   ├── wiki/
│   │   ├── components/              # WikiView, WikiEditor + tests
│   │   ├── hooks/                   # useWiki, useUpdateWiki
│   │   ├── api/wiki.api.ts
│   │   └── types.ts
│   └── admin/
│       ├── components/              # ModerationPanel, UserManagement, InvitationCodes
│       ├── hooks/useAdmin.ts
│       ├── api/admin.api.ts
│       └── types.ts
│
├── components/                      # Shared UI (cross-feature)
│   ├── BottomSheet.tsx
│   ├── MapView.tsx                  # Platform abstraction (native)
│   ├── MapView.web.tsx              # Web-specific map implementation
│   ├── OfflineBanner.tsx
│   └── Toast.tsx
│
├── stores/                          # Zustand (client-only state)
│   ├── useMapStore.ts
│   ├── useAuthStore.ts
│   └── useUIStore.ts
│
├── lib/                             # Shared utilities
│   ├── apiClient.ts                 # Fetch wrapper with auth interceptor
│   ├── socket.ts                    # Socket.io client singleton
│   ├── queryClient.ts              # TanStack Query config
│   ├── offlineQueue.ts             # expo-sqlite write queue
│   ├── constants.ts
│   └── theme.ts                     # React Native Paper theme
│
├── types/                           # Global shared types
│   ├── api.ts
│   └── navigation.ts
│
├── assets/
│   ├── fonts/
│   ├── images/                      # icon.png, splash.png, adaptive-icon.png
│   └── sport-icons/                 # Sport type SVG icons
│
└── server/                          # Backend — INDEPENDENTLY DEPLOYABLE
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── src/
    │   ├── app.ts                   # Express app setup
    │   ├── server.ts                # HTTP + Socket.io + listen
    │   ├── routes/                  # spots, sessions, conditions, auth, admin, wiki
    │   ├── middleware/              # authMiddleware, rateLimiter, validateRequest, errorHandler, antiBot
    │   ├── services/               # Business logic + tests (co-located)
    │   ├── socket/                 # index, spotHandlers, sessionHandlers, conditionHandlers
    │   ├── schemas/                # Zod schemas (spots, sessions, conditions, auth, admin, wiki, common)
    │   ├── utils/                  # jwt, password, appError, logger
    │   ├── jobs/sessionExpiry.ts   # node-cron: expire sessions every 5min
    │   └── config/                 # env (Zod-validated), cors
    └── prisma/
        ├── schema.prisma
        ├── migrations/
        └── seed.ts
```

### Architectural Boundaries

**API Boundaries:**
- All client-server communication via REST `/api/v1/*`
- Socket.io is server-to-client only (unidirectional)
- No direct database access from frontend
- All Prisma calls in services only — not routes, not middleware
- Admin endpoints `/api/v1/admin/*` require admin role middleware

**Component Boundaries (Frontend):**
- Screens (`app/`) compose features — zero business logic
- Features encapsulate own components, hooks, API calls, types
- Cross-feature communication via Zustand stores
- Socket.io events invalidate TanStack Query caches

**Service Boundaries (Backend):**
- Routes: thin — parse request → call service → send response
- Services: all business logic, DB calls, Socket.io broadcasts
- Middleware: cross-cutting (auth, validation, rate limiting, error formatting)
- Socket handlers called BY services after DB writes — never independently

**Data Boundaries:**
- Prisma is the only DB access layer — no raw SQL
- Server cache (node-cache) in services, transparent to routes
- Client cache (TanStack Query) in hooks, transparent to components

### Requirements to Structure Mapping

| FR Category | Frontend Location | Backend Location |
|-------------|-------------------|------------------|
| FR-MAP (4 FRs) | `components/MapView`, `features/spots/SpotMarker, ClusterMarker`, `stores/useMapStore` | `routes/spots` (viewport query) |
| FR-SPOT (4 FRs) | `features/spots/`, `features/wiki/` | `services/spots, wiki` |
| FR-SESSION (7 FRs) | `features/sessions/`, `TimeSlider` | `services/sessions`, `jobs/sessionExpiry`, `socket/sessionHandlers` |
| FR-COND (6 FRs) | `features/conditions/`, `QuickReportSlider, RecencyIndicator` | `services/conditions`, `socket/conditionHandlers` |
| FR-USER (7 FRs) | `features/auth/` | `middleware/authMiddleware, antiBot`, `services/auth` |
| FR-MOD (2 FRs) | `features/admin/` | `services/admin` (+ audit trail) |

**Cross-Cutting Mapping:**
- Auth: `middleware/authMiddleware` + `stores/useAuthStore` + `lib/apiClient` (interceptor)
- Real-time: `server/socket/` + `lib/socket.ts` + TanStack Query invalidation
- Offline: `lib/offlineQueue` + `components/OfflineBanner` + `stores/useUIStore`
- Validation: `server/schemas/` + `middleware/validateRequest`

### Data Flow

**Condition Report:**
```
QuickReportSlider → useCreateCondition → POST /api/v1/spots/:spotId/conditions
  → authMiddleware → validateRequest → conditions.service
    → Prisma write → Socket.io condition:new to spot:{spotId} room
      → All clients: TanStack Query invalidated → UI updates
```

**Session Join (optimistic):**
```
"I'm Going" tap → useJoinSession → onMutate: optimistic UI update
  → POST /api/v1/spots/:spotId/sessions → sessions.service
    → Prisma write → Socket.io session:joined
      → Success: cache synced | Failure: rollback + toast
```

**Session Auto-Expiry:**
```
node-cron (every 5min) → sessionExpiry.ts
  → Prisma delete expired → Socket.io session:expired to spot rooms
    → Clients invalidate → markers update
```

### Development Workflow

```bash
# Terminal 1: Frontend
npx expo start                              # Web + Expo Go

# Terminal 2: Backend
cd server && npx tsx watch src/server.ts     # Auto-restart

# Terminal 3: Database
docker compose up postgres                   # Or Railway dev DB
```

**Deploy:** Git push → Vercel auto-deploys frontend, Railway auto-deploys backend. Prisma migrations run in Railway deploy hook.

## Testing Strategy

### Testing Philosophy

Tests are first-class implementation artifacts, not afterthoughts. Every user story includes test cases derived from acceptance criteria. No story is considered complete until all tests pass.

### Test Stack

| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|-----------------|
| Unit (backend) | Vitest 3.x | Services, utilities, validators, Zod schemas | 80% line coverage |
| Unit (frontend) | Jest + React Testing Library | Components, hooks, Zustand stores | 70% line coverage |
| Integration (API) | Vitest + supertest | Route handlers, middleware chains, auth flows | 80% on route files |
| Integration (Socket) | Vitest + socket.io-client | Event handlers, room join/leave, broadcast logic | Key flows covered |
| E2E (web) | Playwright | 5 critical user journeys | Phase 2 |
| E2E (mobile) | Maestro | 5 critical mobile flows | Phase 2 |
| Load | k6 | API endpoints under concurrent load | p95 <200ms at 100 users |

### Test Infrastructure

**Backend (`server/src/test-utils/`):**
- `factories.ts` — One factory per Prisma model (createTestUser, createTestSpot, createTestCondition, createTestSession)
- `setup.ts` — Database reset between tests, mock Socket.io provider, fake timers setup
- `helpers.ts` — Auth token generation (generateTestAccessToken, generateTestRefreshToken)
- `db.ts` — SQLite in-memory database for unit tests (via Prisma provider override)

**Frontend (`src/test-utils/`):**
- `render.tsx` — Custom render wrapping Paper Provider, TanStack QueryClient, Zustand store providers
- `mocks/handlers.ts` — MSW request handlers mirroring API routes
- `mocks/server.ts` — MSW server setup for test environment
- `factories.ts` — Client-side model factories matching API response shapes

### Testability Architectural Requirements

1. **Dependency injection** — Services receive dependencies (db, cache, socket) as constructor parameters
2. **Environment isolation** — `NODE_ENV=test`: SQLite instead of PostgreSQL, rate limiting disabled, external calls mocked
3. **Mock boundaries** — Mock at service boundaries (database, Socket.io, external APIs). Never mock internal logic.
4. **Deterministic time** — All time-dependent logic (recency colors, session expiry) uses injectable clock via `vi.useFakeTimers()`
5. **No global state** — Each test suite gets fresh service instances and clean database state

### Agent-Driven Test Protocol

```yaml
trigger: "story implementation marked complete by Dev Agent"
executor: "QA Agent"

workflow:
  1. Run existing test suite (regression check)
     - FAIL → Stop. Existing tests broken. Dev Agent fixes before proceeding.

  2. Review test coverage against story acceptance criteria
     - Output: Gap report listing untested ACs

  3. Write missing tests to close coverage gaps
     - Constraint: Only add/modify test files. Never change feature code.

  4. Run full test suite with coverage
     - PASS → Step 5
     - FAIL → Analyze failure, attempt fix (test or code), retry
     - Max retries: 3

  5. On success: Mark story "Ready for Human Review"
     - Attach: coverage report, test count, test execution time

  6. On failure (after 3 retries): Mark story "Needs Attention"
     - Attach: failing test names, error messages, attempted fixes,
       suspected root cause, suggested human action

human_handoff: "Only when all tests pass OR after 3 failed auto-correction attempts"
```

### CI Pipeline Test Gates

```
PR opened / commit pushed
  ├── lint (ESLint + Prettier check) ─────── must pass
  ├── typecheck (tsc --noEmit) ────────────── must pass
  ├── test:backend (vitest run --coverage) ── must pass + coverage thresholds
  ├── test:frontend (jest --ci --coverage) ── must pass + coverage thresholds
  └── build (expo export + tsc) ──────────── must pass
       ↓
  All green → PR mergeable
  Any red → Block merge, no exceptions
```

### npm Scripts

```json
{
  "test": "npm run test:frontend && npm run test:backend",
  "test:frontend": "jest --ci",
  "test:frontend:watch": "jest --watch",
  "test:frontend:coverage": "jest --ci --coverage",
  "test:backend": "cd server && vitest run",
  "test:backend:watch": "cd server && vitest",
  "test:backend:coverage": "cd server && vitest run --coverage",
  "test:e2e:web": "playwright test",
  "test:e2e:mobile": "maestro test .maestro/",
  "test:load": "k6 run server/load-tests/scenario.js"
}
```

### Test Naming Conventions

| Pattern | Example |
|---------|---------|
| Describe block | `describe('ConditionReportsService')` |
| Test case | `it('should reject wave height above 6m')` |
| File name | `conditionReports.service.test.ts` |
| Factory | `createTestConditionReport({ waveHeight: 1.5 })` |
| Helper | `generateTestAccessToken({ userId, role: 'registered' })` |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are mutually compatible. Expo SDK 54 + React Native Paper v5 + Expo Router v4 are tested together. Express 5 + Prisma 6.x + Socket.io 4.8 + Zod 4.x are all TypeScript-native and production-stable. TanStack Query 5 + Zustand work together without conflicts (server state vs client state, no overlap). Railway PostgreSQL 16 + Prisma ORM is a standard pairing.

**Pattern Consistency:**
Naming conventions (snake_case DB → camelCase API → camelCase code) are consistent across all layers with documented transformation points. Response envelope format is uniform. Socket.io event naming (`resource:action`) follows the same domain vocabulary as REST routes. Error codes use the same `UPPER_SNAKE_CASE` format everywhere.

**Structure Alignment:**
Monorepo structure (frontend at root, `server/` for backend) supports independent deployment to Vercel + Railway. Feature-based frontend organization maps 1:1 to PRD requirement domains. Layer-based backend organization (routes → services → Prisma) enforces the architectural boundaries defined in decisions.

### Requirements Coverage Validation ✅

**Functional Requirements:** 28/28 covered

| FR Domain | Count | Architectural Support |
|-----------|-------|----------------------|
| FR-MAP | 4 | MapView abstraction, SpotMarker, ClusterMarker, useMapStore |
| FR-SPOT | 4 | spots service + routes, wiki service, Socket.io spot rooms |
| FR-SESSION | 7 | sessions service, node-cron expiry job, Socket.io session events, TimeSlider |
| FR-COND | 6 | conditions service, QuickReportSlider, RecencyIndicator, Socket.io broadcast |
| FR-USER | 7 | auth service, JWT dual-token, anti-bot middleware, invitation code flow |
| FR-MOD | 2 | admin service + routes, audit trail via Prisma, superadmin role middleware |

**Non-Functional Requirements:** 33/36 covered (3 resolved during validation)

- **NFR-DATA-01 (Data Retention):** Resolved — soft-delete expired sessions, weekly cleanup via node-cron
- **NFR-DATA-04 (Account Deletion):** Resolved — anonymize conditions/wiki edits, delete sessions/profile/settings
- **NFR-TEST-01/02/03 (Testing):** Resolved — comprehensive Testing Strategy section added via Expert Panel elicitation

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical decisions documented with specific package versions. Implementation patterns include code examples for response envelopes, error handling, auth middleware chains, optimistic updates, and offline queue. 24 potential conflict points explicitly resolved with naming tables.

**Structure Completeness:**
Complete file tree for both frontend and backend with every directory and key file specified. All 28 FRs mapped to specific frontend + backend locations. Cross-cutting concerns (auth, real-time, offline, validation) mapped to implementation files.

**Pattern Completeness:**
10 enforcement rules defined. Anti-patterns documented. Test infrastructure, factories, and agent-driven test protocol specified. CI pipeline with gates defined.

### Issues Found and Resolved

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 1 | Recency threshold discrepancy (PRD vs UX spec) | Important | Adopt UX spec thresholds: green(0-30m), yellow(30-90m), orange(90m-3h), grey(3h+) |
| 2 | Data retention rules undefined (NFR-DATA-01) | Important | Soft-delete expired sessions, weekly cleanup job, 90-day retention |
| 3 | Account deletion cascade undefined (NFR-DATA-04) | Important | Anonymize conditions/wiki, delete sessions/profile/settings |
| 4 | Testing strategy incomplete (NFR-TEST-01/02/03) | Critical | Full Testing Strategy section added via Expert Panel elicitation |
| 5 | UX spec mentions Google Sign-In, PRD does not | Minor | Follow PRD — OAuth is post-MVP, architecture supports adding it later |

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established (24 conflict points)
- [x] Structure patterns defined
- [x] Communication patterns specified (REST + Socket.io)
- [x] Process patterns documented (error handling, auth, offline)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

**✅ Testing Strategy**
- [x] Test stack defined (Vitest + Jest + RTL + supertest)
- [x] Coverage thresholds set (80/70/60)
- [x] Test infrastructure specified (factories, utilities, mocks)
- [x] Agent-driven test protocol with auto-correction loop
- [x] CI pipeline test gates defined

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
- Boring, battle-tested technology choices — no bleeding-edge risk
- Comprehensive naming/pattern rules eliminate AI agent ambiguity
- Two-deployment model (Vercel + Railway) is independently scalable and cost-effective ($5/mo)
- Testing strategy baked into implementation workflow, not bolted on

**Areas for Future Enhancement:**
- PostGIS for advanced geospatial queries (when simple bounding box outgrown)
- OAuth providers (Google Sign-In) for easier onboarding
- Push notifications when graduating from Expo Go to standalone builds
- Redis for cache/session store at higher scale
- CDN/blob storage when photos feature is added

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- Dev Agent writes code + tests together per story ACs
- QA Agent validates, fills gaps, auto-corrects (max 3 retries)
- Human review only after all tests pass

**First Implementation Priority:**
```bash
# 1. Initialize Expo project
npx create-expo-app@latest spotapp --template default

# 2. Initialize backend
mkdir server && cd server && npm init -y
npm install express@5 socket.io prisma @prisma/client zod jsonwebtoken bcryptjs cors helmet pino

# 3. Setup Prisma
npx prisma init --datasource-provider postgresql
```
