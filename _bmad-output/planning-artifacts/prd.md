---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys']
inputDocuments: ['brainstorming-session-2026-02-07.md']
workflowType: 'prd'
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
---

# Product Requirements Document - SpotApp

**Author:** Hemmu
**Date:** 2026-02-08

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
