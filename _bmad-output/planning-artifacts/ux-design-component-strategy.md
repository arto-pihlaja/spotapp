# Component Strategy - Spotsapp (Updated with User Feedback)

## Changes Applied:
1. **Metric system:** Wind speed in m/s (2 m/s increments), wave height in meters (0.5m increments)
2. **ConditionBadge:** No star quality, show wind speed + direction, time since update, reporter name (if logged in)
3. **QuickReportSlider:** Directional wind input (stretch arrow for strength + direction, meteorological convention)
4. **TimeSlider:** Presets Now/+1h/+2h/+3h/Custom, users can adjust their own session times

---

## Design System Components (React Native Paper)

**Foundation Components Used:**

From React Native Paper v5, we'll use these standard components:

1. **Button** - Primary/secondary actions
2. **Text Input** - Form fields, search
3. **Card** - Content containers
4. **Chip** - Tags and filters
5. **Icon Button** - Compact actions
6. **Surface** - Elevated panels
7. **Portal** - Overlays and modals

---

## Custom Components

### 3. ConditionBadge (Condition Summary) - UPDATED

**Purpose:** Display current conditions in compact, scannable format with wind direction

**Usage:** Shown in spot marker detail, bottom sheet header, session cards

**Anatomy:**
```
┌────────────────────────────────────────┐
│ 🌊 1.5m  💨 8 m/s ↗️ NE  🕐 15m ago   │  ← Inline format
│ 👤 Mika (if logged in)                │
└────────────────────────────────────────┘

OR

┌──────────────┐
│ 🌊 1.5m      │  ← Vertical format (stacked)
│ 💨 8 m/s ↗️ NE│
│ 🕐 15m ago   │
│ 👤 Mika      │
└──────────────┘
```

**States:**
- **Fresh:** Green tint (`#10B981` at 10% opacity)
- **Stale:** Grey tint (`#9CA3AF` at 10% opacity)
- **No data:** Dashed outline, "No reports yet"

**Variants:**
- **Inline:** Horizontal layout (map marker tooltip, compact spaces)
- **Stacked:** Vertical layout (bottom sheet, more room)
- **Anonymous:** Reporter name hidden for non-logged-in users

**Accessibility:**
- **Label:** "Conditions: 1.5 meter waves, 8 meters per second wind from northeast, reported 15 minutes ago by Mika"
- **Icon alternatives:** Text labels if icons disabled
- **High contrast mode:** Replace emojis with text

**Content Guidelines:**
- **Wave height:** 0-6m (0.5m increments) - "1.5m", "2.0m"
- **Wind speed:** 0-20 m/s (2 m/s increments) - "6 m/s", "8 m/s", "10 m/s"
- **Wind direction:** Meteorological convention (from where wind comes) with arrow
  - NE (↗️), E (→), SE (↘️), S (↓), SW (↙️), W (←), NW (↖️), N (↑)
- **Time:** Relative ("15m ago", "2h ago")
- **Reporter:** First name only ("Mika"), visible to logged-in users only

**Interaction Behavior:**
- **Non-interactive** in compact view (display only)
- **Tap in bottom sheet:** Opens full report history with all details

---

### 8. QuickReportSlider (Condition Input) - UPDATED with Directional Wind Input

**Purpose:** Fast condition reporting with intuitive directional wind input, <15 seconds

**Usage:** Bottom sheet "Report Conditions" form

**Anatomy:**
```
┌────────────────────────────────┐
│  Wave Height: 1.5 m            │
│  ├─────●──────────────┤        │  ← Slider (0-6m, 0.5m increments)
│  ─────────────────────────────│
│  Wind Speed & Direction:       │
│                                │
│         ↑ N                    │  ← Directional wind input
│      ┌─────┐                   │
│  W ← │  ●  │ → E               │  User drags center point
│      └─────┘                   │  to set speed + direction
│         ↓ S                    │
│                                │
│  Current: 8 m/s from NE ↗️     │  ← Live feedback
│  ─────────────────────────────│
│  [Submit Report] (48px button) │
└────────────────────────────────┘
```

**States:**
- **Default:** Pre-filled with last report values, wind arrow at previous direction/strength
- **Editing:** User dragging wind indicator, live preview shows m/s and direction
- **Submitting:** Loading spinner on button
- **Success:** Checkmark animation, "Thanks!" message

**Directional Wind Input Behavior:**

**How it works:**
1. Center point represents "no wind" (0 m/s)
2. User touches center, drags outward in any direction
3. **Distance from center** = wind speed (0-20 m/s)
4. **Direction of drag** = wind origin (where wind comes from)
   - Drag up (N) = north wind (blowing south)
   - Drag right (E) = east wind (blowing west)
   - Drag down-left (SW) = southwest wind (blowing northeast)

**Visual Feedback:**
- Concentric circles at 5, 10, 15, 20 m/s (guides for speed)
- Arrow extends from center to drag point
- Live text: "8 m/s from NE" updates as user drags
- Compass labels (N, NE, E, SE, S, SW, W, NW) around perimeter

**Snap Behavior:**
- Direction snaps to 8 cardinal/intercardinal directions (N, NE, E, SE, S, SW, W, NW)
- Speed snaps to 2 m/s increments (0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20)
- Haptic feedback on snap

**Variants:**
- **Sport-specific fields:**
  - Surf: Wave height only (wind less critical)
  - Kite/Wing: Wind + waves (both critical)
  - Windsurf: Wind + waves (both critical)

**Accessibility:**
- **Alternative input:** Text fields "Wind speed: 8 m/s" + dropdown "Direction: NE" for screen readers
- **Keyboard:** Arrow keys move indicator (Up=N, Right=E, +/- for speed)
- **Voice input:** "Wind 8 meters per second from northeast" → sets automatically

**Content Guidelines:**
- **Wave height:** 0-6m (0.5m increments) - visual: 0m, 0.5m, 1.0m, 1.5m, 2.0m...
- **Wind speed:** 0-20 m/s (2 m/s increments) - visual: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20
- **Wind direction:** 8 directions (N, NE, E, SE, S, SW, W, NW)
- **Optional text:** 280 char max ("Offshore, glassy, perfect!")

**Interaction Behavior:**
- **Touch center:** Activates directional input, highlights control
- **Drag outward:** Arrow extends, speed increases, direction follows finger
- **Release:** Values snap to nearest increments, haptic feedback
- **Tap "Reset":** Returns to pre-filled defaults
- **Submit:** Network request → Success animation → Close form

**Why This Design Works:**
- **Intuitive:** Physical gesture matches mental model (pull from direction wind comes from)
- **Fast:** One gesture captures two variables (speed + direction) vs two separate inputs
- **Visual:** Directional arrow provides immediate feedback
- **Accurate:** Snapping to cardinal directions and 2 m/s increments prevents imprecise data
- **Water sports native:** Wind direction is critical for kiting/winging, this makes it first-class

---

### 5. TimeSlider (Session Time Selector) - UPDATED

**Purpose:** Select when user is going (now, future time, custom) with ability to adjust own plans

**Usage:** Session creation AND session editing (user can postpone their own attendance)

**Anatomy:**
```
┌─────────────────────────────────────┐
│  Now   +1h   +2h   +3h   Custom     │  ← Quick presets (chips)
├─────────────────────────────────────┤
│  Your session: +1h (3:47 PM)        │  ← Current selection
│  [Update Time] (if user is in session) │
└─────────────────────────────────────┘
```

**States:**
- **Default:** "Now" selected (for new sessions)
- **Preset selected:** Chip highlighted, shows time
- **Custom:** User selected custom time picker
- **Editing own session:** Shows current time, allows change

**Variants:**
- **Session creation:** All presets available
- **Session editing (own):** Can change own time, e.g. +1h → +2h
- **Session viewing (others'):** Time shown but not editable

**Accessibility:**
- **Label:** "Select session time, currently set to plus 1 hour, 3:47 PM"
- **Keyboard:** Tab to presets, Enter to select, Escape to cancel
- **Screen reader:** Announces time in both relative (+1h) and absolute (3:47 PM)

**Content Guidelines:**
- **Presets:** "Now", "+1h", "+2h", "+3h", "Custom"
- **Relative + Absolute:** Show both "+1h (3:47 PM)" for clarity
- **Editing message:** "Postpone your session from +1h to +2h?"

**Interaction Behavior:**
- **Tap preset (creating):** Sets session time, shows in participant list
- **Tap preset (editing own):** Updates user's time in session, notifies other participants
- **Tap "Custom":** Opens full time picker modal (date + time)
- **Confirm change:** "Update" button → Participant list updates → Notification to others: "Mika postponed to +2h"

**Use Cases:**
1. **Create session:** "I'm going +1h" (3:47 PM)
2. **Postpone own plan:** "Actually, make it +2h" (4:47 PM) - user edits their own entry
3. **Custom time:** "Tomorrow dawn" - opens picker, select date + time

**Why This Design Works:**
- **Flexible coordination:** Users can adjust plans without leaving/rejoining session
- **Social transparency:** Others see when participants change plans
- **Realistic:** Plans change (wind shifts, work meeting runs late) - app should support this
- **No spam:** Only user can edit their own time (not others' plans)

---

## Component Implementation Strategy

**Design Tokens Integration:**

All custom components use design tokens from Step 8 (Visual Foundation):
- **Colors:** `theme.colors.primary`, `theme.colors.success`, etc.
- **Spacing:** `theme.spacing.md` (16px), `theme.spacing.lg` (24px)
- **Typography:** `theme.fonts.body` (16px), `theme.fonts.h1` (32px)
- **Roundness:** `theme.roundness` (12px border radius)

**Metric System:**
- **Wave height:** 0-6m (0.5m increments)
- **Wind speed:** 0-20 m/s (2 m/s increments)
- **Distance:** kilometers (for spot distance from user)
- **Temperature:** Celsius (for water/air temp if added later)

**Accessibility Standards:**

Every custom component must meet:
- **Touch targets:** 48×48px minimum
- **Color contrast:** WCAG 2.1 AA (4.5:1 text, 3:1 UI)
- **Screen reader labels:** Descriptive, contextual
- **Keyboard navigation:** Tab order, Enter/Space activation
- **Focus indicators:** 2px blue ring, 2px offset

**Performance Optimization:**

- **Memoization:** React.memo for SpotMarker, ClusterMarker (prevent re-renders on map pan)
- **Lazy loading:** BottomSheet content renders on open, not on mount
- **Debounced input:** Directional wind input (100ms debounce during drag, snap on release)
- **Canvas rendering:** Directional wind control uses canvas for smooth 60fps dragging

---

## Implementation Roadmap

**Phase 1: Core Map UI (Week 1-2) - MVP Critical**

1. **SpotMarker** (3 days) - Includes recency colors, sport icons
2. **ClusterMarker** (2 days) - Aggregated markers for far zoom
3. **BottomSheet** (3 days) - Detail views with snap points

**Phase 2: Core Interactions (Week 2-3) - MVP Critical**

4. **ConditionBadge** (2 days) - Updated with wind direction arrow, reporter name
5. **RecencyIndicator** (1 day) - Freshness communication
6. **SessionCard** (2 days) - Participant lists, join/leave

**Phase 3: Advanced Features (Week 3-4) - MVP Enhancement**

7. **QuickReportSlider** (4 days) - Includes directional wind input (complex interaction)
8. **TimeSlider** (2 days) - Session time selection with editing capability

**Total Development Time: 19 days (3.8 weeks)**

**MVP Delivery (Phase 1-2): 13 days (2.6 weeks)**
**Full Feature (Phase 1-3): 19 days (3.8 weeks)**

**Note on Directional Wind Input:**
- Most complex custom component (4 days vs 2 days for simple sliders)
- High value for water sports users (wind direction is critical)
- Can start with simple sliders if needed, upgrade to directional later
- Canvas-based implementation for smooth interaction

---

**UX Design Specification Complete**

All 11 steps completed:
1. ✅ Project Understanding & Design Constraints
2. ✅ Core User Experience Definition
3. ✅ Experience Principles & Critical Success Moments
4. ✅ Desired Emotional Response
5. ✅ UX Pattern Analysis & Inspiration
6. ✅ Design System Foundation
7. ✅ Core Interaction Mechanics
8. ✅ Visual Design Foundation
9. ✅ Design Direction Decision
10. ✅ User Journey Flows (5 detailed journeys with Mermaid diagrams)
11. ✅ Component Strategy (8 custom components specified)

**Ready for implementation!**
