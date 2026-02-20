---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-e-01-discovery', 'step-e-02-review', 'step-e-03-edit']
inputDocuments: ['brainstorming-session-2026-02-07.md']
workflowType: 'prd'
workflow: 'edit'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: 'PWA (Progressive Web App), mobile-first'
  domain: 'Social / Location-based community coordination'
  complexity: 'Low-Medium'
  projectContext: 'greenfield'
  backend: 'API-first (frontend-agnostic, supports future React Native migration)'
lastEdited: '2026-02-20'
editHistory:
  - date: '2026-02-20'
    changes: 'Added 3 critical BMAD core sections: Executive Summary, Functional Requirements (28 FRs across 6 areas), Non-Functional Requirements (31 NFRs across 7 quality attributes). Completed BMAD standard structure for MVP readiness.'
---

# Product Requirements Document - SpotApp

**Author:** Hemmu
**Date:** 2026-02-08

## Executive Summary

**Product Vision:**
SpotApp replaces chaotic WhatsApp coordination with structured, map-first session planning for water sports communities. Users see who's going, what conditions are like, and make go/no-go decisions in under 10 seconds.

**Core Problem:**
Water sports communities rely on WhatsApp for session coordination, requiring users to scroll through chat histories to find "who's going" and "what's it like." This creates friction for planning, excludes newcomers, and buries valuable local knowledge in ephemeral messages.

**Solution:**
A Progressive Web App (PWA) that provides real-time, location-based coordination through:
- Map-first interface showing all spots at a glance
- Structured condition reporting (swell, wind) with recency indicators
- Session planning (Planned/Now states) visible to the community
- Collaborative spot wiki pages capturing local knowledge
- Ghost profiles (name + activity stats) with no social engagement mechanics

**Target Users:**
- **Primary:** Surf, wing foil, kite, SUP, and windsurf communities coordinating sessions locally (~200 people initial market)
- **Secondary:** Newcomers to coastal areas seeking spots and community
- **Tertiary:** Any coastal water sports community (national/international expansion potential)

**Key Differentiator:**
Zero social feed, zero engagement mechanics. Pure coordination utility. Users check SpotApp to make decisions, not to scroll feeds. Map-first design shows everything at once—no tapping through lists or feeds.

**Business Context:**
This is a greenfield project serving dual purposes: (1) solve real coordination problems for a local community, and (2) demonstrate modern software architecture and AI-assisted development workflows. Architecture prioritizes API-first design to support future React Native migration.

## Success Criteria

### User Success

- **WhatsApp displacement:** Within the core local community (~200 people), surf coordination activity migrates from WhatsApp channels to SpotApp. Users check SpotApp first for "who's going" and "what's it like" rather than scrolling chat histories.
- **One-glance decision:** A user can open SpotApp, see the map, and make a go/no-go decision for their nearest spots within 10 seconds -- without tapping into individual spots or scrolling feeds.
- **Zero-friction contribution:** Reporting conditions or marking a session takes under 15 seconds. One-tap confirm takes under 3 seconds.
- **Newcomer self-service:** A newcomer to the area can find suitable spots, read wiki content, see planned sessions, and decide where to go -- without knowing anyone locally.
- **"Aha" moment:** The first time a user sees friends planning a dawn session at their favorite spot and decides to join without sending a single message.

### Business Success

- **Seed adoption:** 5-10 community influencers actively using SpotApp within the first month of launch, creating the tipping point for broader adoption.
- **Community migration:** 50+ active users within 3 months (25% of the ~200 coordination community).
- **Organic growth:** New users arriving through word-of-mouth via existing channels (WhatsApp, Facebook, Telegram) without paid marketing.
- **Spot coverage:** All commonly used local spots created and with basic wiki content within 2 months.
- **National potential:** Architecture and UX that works for any coastal community, not just the initial local group. No hard-coded local assumptions.

### Technical Success

- **Architecture showcase:** Clean separation of concerns -- API backend, PWA frontend, real-time data layer -- demonstrating modern software architecture patterns.
- **Agentic coding exercise:** The project itself is built using AI-assisted development workflows, demonstrating the ability to architect and direct agentic coding tools effectively.
- **Framework-agnostic learning:** Understanding of architectural layers (API design, data modeling, real-time updates, map integration, auth) matters more than mastery of specific languages.
- **Frontend-agnostic backend:** API design that could serve a future React Native client without changes.
- **Performance:** Map loads and becomes interactive in under 3 seconds on mobile. Condition reports appear to other users within 30 seconds.

### Measurable Outcomes

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Active influencer users | 5-10 | Month 1 |
| Total active users | 50+ | Month 3 |
| Spots created with wiki content | All major local spots | Month 2 |
| Session planning actions per week | 30+ | Month 3 |
| Condition reports per active day | 5+ across all spots | Month 3 |
| App-to-decision time | < 10 seconds | At launch |
| Condition report input time | < 15 seconds | At launch |

## Product Scope

### MVP - Minimum Viable Product

The MVP must be sufficient to convince 5-10 influencers to try it and find it valuable enough to keep using.

**Core features:**

1. Map-first interface with zoom-density scaling
2. Community-born spots (users drop pins to create)
3. Spot wiki pages (collaborative editing, no version control)
4. Session planning: two states -- **Planned** (future) and **Now** (auto-expires 90 min)
5. Session tuple: {user, spot, time, sport}
6. Structured condition reporting (swell slider, wind vector)
7. One-tap confirm of existing condition reports with confirmation count
8. Anonymous browse, register to contribute
9. Ghost profiles (name, optional photo, optional link, activity stats)
10. At-a-glance spot cards on map (conditions, recency, session count)
11. Recency indicators on condition data
12. Time-slider for forward planning (now to sunset default)
13. Sport-per-session dropdown (surf, wing foil, kite, SUP, windsurf, other)

**Deliberately excluded from MVP:**

- No social feed, no likes, no engagement mechanics
- No photos (reduces storage complexity)
- No external forecast integration
- No algorithmic curation (geography + recency only)
- No notifications
- No wiki version control

### Growth Features (Post-MVP)

- Wiki version control (edit history, attribution, rollback)
- Watching/tentative/confirmed session states
- Notifications (opt-in per-spot)
- Cascade confirmation notifications
- Quick-vote transient conditions (seaweed, jellyfish, debris)
- Activity-backed authorship (session count next to usernames)
- Auto-generated session diary (personal history)
- Ephemeral photos (24h condition snapshots)
- Social media bridging (link Instagram/YouTube to spots)
- Sport-aware condition display ("good for you" indicator)
- Environmental data API integration (water temp, UV, etc.)

### Vision (Future)

- React Native migration for native mobile experience
- Historical activity patterns ("popular times" per spot)
- Condition-triggered notifications (threshold alerts on structured data)
- Season Wrapped (annual auto-generated summary)
- Wiki edit proposals (moderation for scaled communities)
- Open spot data API (public good)
- National/international expansion with self-seeding community model

## User Journeys

### Journey 1: Mika -- The Dawn Patrol Decision

**Opening Scene:** It's 5:15 AM, Tuesday. Mika's alarm goes off. He surfs most mornings before work, but the swell has been inconsistent. Yesterday was flat. He reaches for his phone, still half asleep. Old habit says: open Windy, check forecast, then scroll through WhatsApp to see if anyone's mentioned conditions or plans. That's usually 3-5 minutes of squinting at chat history.

**Rising Action:** Instead, he opens SpotApp. The map loads centered on his location. He sees two spots within 15km. Spot A has a fresh condition report -- "0.7m, W 8 m/s" posted 20 minutes ago by Kalle, confirmed by one other. Recency indicator is green. The spot card shows "3 planned sessions, next 2 hours." He taps the spot card and sees Kalle and two others marked for 6:00 AM. Spot B is grey -- no reports today, one planned session at 7:30.

**Climax:** Decision made in under 10 seconds. Spot A, 6:00 AM. He taps "Planned" -- selects 6:00 AM, surfing, done. His name now appears on Spot A's timeline. He puts his phone down and gets dressed.

**Resolution:** At the beach, he sees Kalle and the crew. After checking conditions himself, he opens SpotApp and taps the one-tap confirm -- conditions still accurate. Takes 3 seconds. Two more people arrive who saw the session plans on SpotApp. Nobody sent a WhatsApp message this morning.

**Edge case -- bad conditions:** Mika opens the app, Spot A has a report from 40 minutes ago: "0.3m, choppy, N 12 m/s." Recency yellow. No planned sessions. He rolls over and goes back to sleep. The app saved him a 20-minute drive to a flat beach.

### Journey 2: Sofia -- The Stranger Finds Her Crew

**Opening Scene:** Sofia arrives in the area for two weeks of wing foiling. She's got gear but knows nobody and nothing about the local spots. A friend back home mentioned SpotApp. She opens it on her phone browser. No account yet.

**Rising Action:** The map shows the coastline with several spot pins. She sees them without registering -- anonymous browse. One spot glows with activity: "23 check-ins today, 0.5m swell, SW 9 m/s." She taps into it and reads the wiki -- parking instructions, best wind directions, "works well for wing foiling in SW wind," hazard notes about rocks on the north side. Another spot nearby is quieter -- 4 check-ins, lighter wind. She slides the time forward to tomorrow 10:00 AM and sees 4 people already have planned sessions at the active spot.

**Climax:** She decides to go tomorrow at 10. She taps "Plan session" -- the app prompts her to register. Username, password, invitation code (she got it from her friend who recommended the app). A honeypot field and JS challenge run silently in the background. 20 seconds, done. She selects her session: tomorrow 10:00, wing foiling. Her name now appears in the timeline -- the 5th person planning to be there.

**Resolution:** Next morning, she arrives and finds a friendly group. One of them says "oh, you're the wing foiler we saw on SpotApp!" She taps "Now" -- checked in, wing foiling, auto-expires in 90 minutes. After her session, she adjusts the condition sliders -- wind picked up to 11 m/s. Over the next two weeks, she uses SpotApp daily, discovers three more spots, and contributes wiki details. When she leaves, her ghost profile shows: "Sofia -- 9 sessions across 4 spots."

**Edge case -- empty area:** Sofia opens the app in a region with no spots yet. The map is empty. She drops a pin, names it, and writes the first wiki entry. She's the founding contributor.

### Journey 3: The Anonymous-to-Registered Conversion

**Opening Scene:** Someone hears about SpotApp from a WhatsApp group -- "check this new app for session planning" with a link and an invitation code. They tap the link on their phone. The PWA loads in their browser.

**Rising Action:** They see a map with spots. They can explore everything -- spot locations, wiki content, aggregated condition data ("3 reports today: 0.7m, W 8 m/s"), session counts ("5 planned sessions"). But usernames are hidden -- they see "5 planned sessions" not "Mika, Kalle, and 3 others." They tap around, read a wiki, check the time slider. They're getting value without any commitment.

**Climax:** They see their favorite spot has 4 planned sessions for tomorrow morning. They want to see *who* is going, or mark their own session. They tap "Plan session" and hit the registration prompt: username + password + invitation code. No email, no personal data beyond a chosen display name. Anti-bot measures run silently (honeypot, JS challenge, time-based check, rate limiting). Registration takes 20 seconds.

**Resolution:** They immediately see the names behind the session counts -- "oh, it's Mika and Kalle." They mark their session. The transition from consumer to contributor felt natural, not forced. The invitation code they received via WhatsApp tied the real-world community trust to the digital onboarding.

**Alternative path:** They explore without registering, find it useful for checking conditions, and come back later. No pressure, no nag screens. The invitation code sits in their WhatsApp chat whenever they're ready.

### Journey 4: Superadmin -- Content Moderation

**Opening Scene:** Hemmu is the superadmin. A community member messages him: "someone created a duplicate spot for Mellsten with a weird name, and there's spam in the wiki for Spot X."

**Rising Action:** Hemmu opens SpotApp with superadmin privileges. He navigates to the duplicate spot: "Mellsten Beach LOL" with no sessions and a troll wiki entry. He checks Spot X's wiki and finds an ad for unrelated services inserted by a user.

**Climax:** For the duplicate spot: Hemmu deletes the spot entirely. For the wiki spam: he reverts the wiki content to remove the ad. He blocks the offending user account. The blocked user can no longer log in or contribute. Their existing condition reports and session plans are removed.

**Resolution:** The community stays clean. The moderation took 2 minutes. In a small community this is rare -- social pressure handles most issues. But when it happens, the tools exist and are fast.

**Edge case -- accidental block:** Hemmu can unblock a user. The block is reversible. Unblocked users regain full access.

### Journey Requirements Summary

| Capability Area | Journeys | MVP Priority |
|----------------|----------|-------------|
| Map rendering with spot pins + zoom density | Mika, Sofia, Anon | Must-have |
| Spot cards (conditions, recency, session count) | Mika, Anon | Must-have |
| Anonymous browse (aggregated data, no usernames) | Sofia, Anon | Must-have |
| Registration (username + password + invitation code, no email) | Sofia, Anon | Must-have |
| Anti-bot measures (honeypot, JS challenge, time check, rate limit) | Sofia, Anon | Must-have |
| Invitation code system (admin-generated codes) | Sofia, Anon, Superadmin | Must-have |
| Session planning (Planned + Now with 90min auto-expiry) | Mika, Sofia | Must-have |
| Structured condition reporting (sliders) | Mika, Sofia | Must-have |
| One-tap condition confirm | Mika | Must-have |
| Spot creation (drop pin + name) | Sofia | Must-have |
| Wiki reading and editing | Sofia, Mika | Must-have |
| Time-slider (forward planning) | Mika, Sofia, Anon | Must-have |
| Ghost profile (auto-generated from activity) | Sofia | Must-have |
| Recency indicators | Mika | Must-have |
| Superadmin: block/unblock users | Superadmin | Must-have |
| Superadmin: delete spots | Superadmin | Must-have |
| Superadmin: remove/revert content | Superadmin | Must-have |

## Functional Requirements

### Map and Visualization

**FR-MAP-01: Interactive Map Display**
Users can view an interactive map centered on their current location showing all spots within visible bounds. Map renders and becomes interactive within 3 seconds on mobile devices.

**FR-MAP-02: Zoom-Density Scaling**
Map adjusts spot marker density based on zoom level to prevent visual clutter. Overlapping spots cluster at low zoom and separate at high zoom.

**FR-MAP-03: Spot Cards on Map**
Users can view at-a-glance spot cards directly on the map showing: latest condition data, recency indicator (color-coded), and session count for current time window. Data updates without requiring tap-through.

**FR-MAP-04: Location-Based Centering**
Map automatically centers on user's current location on first load. Users can pan and zoom freely.

### Spot Management

**FR-SPOT-01: Community Spot Creation**
Authenticated users can create new spots by dropping a pin on the map and providing a name. Spot creation completes in under 3 taps.

**FR-SPOT-02: Spot Wiki Pages**
Each spot has a collaborative wiki page supporting markdown formatting. Users can read wiki content anonymously. Authenticated users can edit wiki content with changes visible immediately.

**FR-SPOT-03: Wiki Content Structure**
Spot wikis support: parking instructions, hazard warnings, best conditions, local etiquette, and free-form notes. No version control in MVP.

**FR-SPOT-04: Spot Deletion (Superadmin)**
Superadmin users can permanently delete spots including all associated data (sessions, conditions, wiki content). Deletion requires confirmation.

### Session Planning

**FR-SESSION-01: Two-State Session Model**
Users can mark sessions in two states: **Planned** (future time, user-specified) and **Now** (current activity, auto-expires after 90 minutes).

**FR-SESSION-02: Session Tuple**
Each session captures: user, spot, timestamp, and sport type. All fields are required.

**FR-SESSION-03: Sport Selection**
Users select sport type from dropdown: surf, wing foil, kite, SUP, windsurf, other. One sport per session.

**FR-SESSION-04: Planned Session Creation**
Users can create planned sessions for future times. Session creation takes under 15 seconds including sport selection.

**FR-SESSION-05: Now Session Auto-Expiry**
"Now" sessions automatically expire 90 minutes after creation. Expired sessions no longer appear in active session counts or spot cards.

**FR-SESSION-06: Session Visibility**
Anonymous users see aggregated session counts ("5 planned sessions"). Authenticated users see individual usernames and sport types for all sessions.

**FR-SESSION-07: Time-Slider for Planning**
Users can slide a time selector to view planned sessions at future times. Default range: now to sunset. Spot cards update to show session counts for selected time.

### Condition Reporting

**FR-COND-01: Structured Condition Input**
Users can report conditions using: swell height slider (0-3m in 0.1m increments), wind speed slider (0-20 m/s in 1 m/s increments), and wind direction selector (8 cardinal directions).

**FR-COND-02: Condition Report Creation Time**
Users can submit a condition report in under 15 seconds from opening the spot to confirmation.

**FR-COND-03: One-Tap Confirm**
Users can confirm existing condition reports with a single tap. Each report tracks confirmation count. One-tap confirm completes in under 3 seconds.

**FR-COND-04: Condition Report Visibility**
Latest condition report appears on spot card with recency indicator. Anonymous users see aggregated condition data. Authenticated users see reporting username and confirmation count.

**FR-COND-05: Recency Indicators**
Condition data displays color-coded recency: green (< 30 min), yellow (30-60 min), orange (60-120 min), grey (> 120 min or no data).

**FR-COND-06: Condition Report Propagation**
Condition reports appear to other users within 30 seconds of submission across all active clients.

### User Management

**FR-USER-01: Anonymous Browse Mode**
Unauthenticated users can view: map, spot locations, spot wikis, aggregated condition data (no usernames), and aggregated session counts (no usernames). No registration required.

**FR-USER-02: Registration with Invitation Code**
Users register with: username (unique), password, and valid invitation code. No email required. Registration completes in under 30 seconds.

**FR-USER-03: Anti-Bot Measures**
Registration form implements: honeypot field, JavaScript challenge, time-based submission check, and rate limiting. All measures run silently without user friction.

**FR-USER-04: Invitation Code System**
Superadmin can generate invitation codes with optional expiration and usage limits. Codes are single-use or multi-use (admin configurable).

**FR-USER-05: Ghost Profiles**
User profiles display: username, optional profile photo, optional external link, and auto-generated activity stats (session count, spots visited). No social feed or engagement features.

**FR-USER-06: User Blocking (Superadmin)**
Superadmin can block user accounts. Blocked users cannot log in. Existing sessions and condition reports from blocked users are removed.

**FR-USER-07: User Unblocking (Superadmin)**
Superadmin can unblock previously blocked users. Unblocked users regain full access immediately.

### Content Moderation

**FR-MOD-01: Wiki Content Removal**
Superadmin can remove or revert wiki content edits. Changes apply immediately.

**FR-MOD-02: Moderation Audit Trail**
System tracks all superadmin moderation actions: user blocks/unblocks, spot deletions, content removals. Audit log includes timestamp and admin username.

### Traceability Matrix

| Functional Requirement | User Journey | Success Criteria |
|------------------------|--------------|------------------|
| FR-MAP-01, FR-MAP-03, FR-MAP-04 | Mika (J1), Sofia (J2) | One-glance decision < 10s |
| FR-SESSION-01, FR-SESSION-04, FR-SESSION-05 | Mika (J1), Sofia (J2) | Zero-friction contribution < 15s |
| FR-COND-01, FR-COND-02, FR-COND-03, FR-COND-05 | Mika (J1) | Condition report < 15s, confirm < 3s |
| FR-SPOT-01, FR-SPOT-02 | Sofia (J2) | Newcomer self-service |
| FR-USER-01, FR-USER-02, FR-USER-03 | Anonymous-to-Registered (J3) | Natural conversion flow |
| FR-USER-06, FR-SPOT-04, FR-MOD-01 | Superadmin (J4) | Content moderation < 2 min |
| FR-SESSION-06, FR-COND-04 | Mika (J1), Sofia (J2) | "Aha" moment (seeing who's going) |
| FR-SESSION-07 | Mika (J1), Sofia (J2) | Forward planning capability |

## Non-Functional Requirements

### Performance

**NFR-PERF-01: Map Load Time**
The map shall load and become interactive within 3 seconds on mobile devices over 4G connection as measured by Lighthouse performance metrics. 95th percentile load time shall not exceed 4 seconds.

**NFR-PERF-02: Initial Page Load**
The PWA initial page load shall complete within 2 seconds for returning users with service worker cache as measured by browser performance API.

**NFR-PERF-03: Condition Report Propagation**
Condition reports and session updates shall propagate to all active clients within 30 seconds of submission as measured by server-side timestamp logs.

**NFR-PERF-04: API Response Time**
API endpoints shall respond within 200ms for 95th percentile of requests under normal load (up to 100 concurrent users) as measured by application performance monitoring.

**NFR-PERF-05: Database Query Performance**
Database queries for map viewport data (spots, conditions, sessions) shall complete within 100ms for areas containing up to 500 spots as measured by database query logs.

### Scalability

**NFR-SCALE-01: Concurrent Users**
The system shall support 100 concurrent active users without performance degradation as measured by load testing tools.

**NFR-SCALE-02: Data Growth**
The system shall handle up to 1,000 spots, 10,000 sessions, and 50,000 condition reports without query performance degradation below NFR-PERF-05 targets.

**NFR-SCALE-03: Real-Time Connections**
The system shall maintain stable real-time connections for up to 100 simultaneous clients without connection drops as measured by WebSocket monitoring.

**NFR-SCALE-04: Geographic Expansion**
The architecture shall support deployment across multiple geographic regions without code changes, supporting region-specific instances via configuration.

### Availability and Reliability

**NFR-AVAIL-01: Uptime**
The system shall maintain 99% uptime during peak hours (6 AM - 8 PM local time) as measured by uptime monitoring services over 30-day rolling windows.

**NFR-AVAIL-02: Data Persistence**
All user-generated content (spots, sessions, conditions, wiki edits) shall persist reliably with zero data loss under normal operating conditions as verified by database backup and recovery testing.

**NFR-AVAIL-03: Graceful Degradation**
The PWA shall display cached map data and spots when offline. Users shall see "offline mode" indicator and read-only access to previously loaded content.

**NFR-AVAIL-04: Session Auto-Expiry**
The system shall automatically expire "Now" sessions exactly 90 minutes after creation within 5-minute accuracy as measured by server-side cleanup job logs.

### Security

**NFR-SEC-01: Authentication**
User authentication shall use industry-standard password hashing (bcrypt with work factor >= 12) as verified by security audit.

**NFR-SEC-02: Session Management**
User sessions shall expire after 30 days of inactivity. Session tokens shall be cryptographically secure random values with minimum 128-bit entropy.

**NFR-SEC-03: Invitation Code Validation**
The system shall validate invitation codes server-side before account creation. Invalid codes shall be rejected with no account creation.

**NFR-SEC-04: Rate Limiting**
API endpoints shall enforce rate limiting: 10 requests per minute per IP for registration, 100 requests per minute per authenticated user for general API access, as measured by rate limiting middleware logs.

**NFR-SEC-05: Anti-Bot Protection**
Registration shall implement multi-layered bot protection: honeypot field detection (reject if filled), JavaScript challenge validation, minimum form submission time of 5 seconds. Bot detection shall block registration with HTTP 403 response.

**NFR-SEC-06: Data Privacy**
User profiles shall store only username, password hash, optional photo URL, and optional link. No email, phone, or personal identifiable information required. Users can delete their accounts with all associated data removed.

**NFR-SEC-07: Superadmin Access Control**
Superadmin privileges shall be limited to designated accounts only. All superadmin actions shall require authenticated session with admin role verification.

### Usability

**NFR-USE-01: Mobile-First Design**
The interface shall be optimized for mobile devices with touch targets minimum 44x44 pixels and responsive layouts supporting viewport widths from 320px to 2560px as verified by responsive design testing.

**NFR-USE-02: Decision Time**
Users shall complete go/no-go decisions for sessions within 10 seconds from app load as measured by user journey testing (FR-MAP-03, FR-COND-05).

**NFR-USE-03: Contribution Friction**
Condition reporting shall complete in under 15 seconds, one-tap confirm in under 3 seconds, as measured by user journey testing (NFR-PERF-02, NFR-PERF-03).

**NFR-USE-04: Progressive Web App**
The application shall function as a PWA with: installable to home screen, app-like fullscreen experience, service worker caching for offline map viewing, as verified by Lighthouse PWA audit score >= 90.

**NFR-USE-05: Browser Compatibility**
The PWA shall function correctly on: Chrome/Edge (latest 2 versions), Safari iOS (latest 2 versions), Firefox (latest 2 versions) as verified by cross-browser testing.

### Maintainability

**NFR-MAINT-01: API-First Architecture**
The backend shall expose a RESTful API independent of frontend implementation. API shall be versioned (v1) and documented with OpenAPI specification to support future React Native client without backend changes.

**NFR-MAINT-02: Code Modularity**
The system shall maintain clear separation of concerns: API layer, business logic layer, data access layer, frontend presentation layer. Each layer shall have defined interfaces.

**NFR-MAINT-03: Frontend-Backend Independence**
The PWA frontend and API backend shall be deployable independently. API changes shall maintain backward compatibility for one major version.

**NFR-MAINT-04: Development Workflow**
The project shall demonstrate AI-assisted development workflows with clear architecture documentation enabling agentic coding tools to contribute effectively.

### Data Retention

**NFR-DATA-01: Session History**
"Planned" sessions shall be retained for 30 days after scheduled time. "Now" sessions shall be retained for 7 days after expiration. Historical session data shall be available for activity stats.

**NFR-DATA-02: Condition Report History**
Condition reports shall be retained indefinitely for historical analysis and spot pattern detection (future feature support).

**NFR-DATA-03: Wiki Edit History**
MVP shall store only current wiki content. Edit history and version control are deferred to Growth phase (no version control required for MVP).

**NFR-DATA-04: User Account Deletion**
When users delete accounts, all personal data (username, password hash, profile info) shall be removed. Associated content (sessions, condition reports) may be anonymized or removed per user preference.

### Testing and Quality

**NFR-TEST-01: Automated Testing**
Critical user journeys (Mika's dawn patrol, Sofia's newcomer flow, anonymous-to-registered) shall have automated end-to-end tests with 100% pass rate before production deployment.

**NFR-TEST-02: Load Testing**
The system shall undergo load testing simulating 100 concurrent users performing typical actions (map loads, session creation, condition reporting) before MVP launch.

**NFR-TEST-03: Mobile Device Testing**
The PWA shall be tested on physical devices: iPhone (iOS Safari), Android (Chrome), mid-range hardware to verify performance targets.

### Traceability to Success Criteria

| Non-Functional Requirement | Success Criteria Alignment |
|---------------------------|---------------------------|
| NFR-PERF-01, NFR-PERF-02 | Map loads and becomes interactive in under 3 seconds |
| NFR-PERF-03 | Condition reports appear to other users within 30 seconds |
| NFR-USE-02 | One-glance decision < 10 seconds |
| NFR-USE-03 | Zero-friction contribution < 15 seconds, confirm < 3 seconds |
| NFR-SCALE-01, NFR-SCALE-02 | 50+ active users within 3 months (scalability foundation) |
| NFR-MAINT-01, NFR-MAINT-03 | Frontend-agnostic backend (React Native migration ready) |
| NFR-MAINT-04 | Agentic coding exercise (architecture showcase) |
| NFR-USE-04, NFR-USE-05 | PWA mobile-first (business success: organic growth via mobile) |
| NFR-SEC-01 through NFR-SEC-07 | Invitation code system, anti-bot measures (community quality) |
