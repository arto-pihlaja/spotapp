# Platform Decision: PWA vs React Native vs Expo

**Project:** Spotsapp
**Author:** Hemmu
**Date:** 2026-02-20
**Status:** Decision Analysis

---

## Executive Summary

**Decision Question:** Should Spotsapp launch as a PWA, React Native native app, or use Expo for unified deployment?

**Recommendation:** **Start with Expo (web + Expo Go)** - Best of both worlds with minimal complexity and zero app store dependencies for MVP.

**Rationale:** Expo enables web deployment (PWA-like) AND native app experience via Expo Go without Apple Developer license or app store approval, providing instant distribution while preserving upgrade path to full native apps.

---

## Options Analysis

### Option 1: PWA (Web-Only)

**Description:** Progressive Web App using web technologies, installable to home screen, runs in browser.

#### Advantages
- ✅ **Fastest to MVP**: Single platform, web technologies
- ✅ **Zero distribution friction**: Share link → users browse immediately
- ✅ **Instant updates**: Deploy changes, users get updates on refresh
- ✅ **No app store costs**: $0 for distribution
- ✅ **No approval delays**: Deploy whenever ready
- ✅ **Cross-platform automatic**: Same code works iOS, Android, desktop
- ✅ **Familiar development**: Standard web dev tools and debugging
- ✅ **Lower storage footprint**: Important for users with limited phone storage

#### Disadvantages
- ❌ **Performance limitations**: Not quite as smooth as native for map interactions
- ❌ **Limited offline capabilities**: Service workers have restrictions
- ❌ **Push notifications**: Unreliable on iOS, better on Android
- ❌ **Geolocation**: More battery drain than native
- ❌ **No app store presence**: Discoverability relies on word-of-mouth only
- ⚠️ **"Not a real app" perception**: Some users prefer "real" apps from stores

#### Cost Analysis
- **Development time to MVP**: 4-6 weeks (baseline)
- **Ongoing costs**: $0 (hosting only, ~$10-20/month for backend)
- **Learning curve**: Low (web technologies)

#### UX Quality for Spotsapp Use Cases
- **Quick check (Mika at 5 AM)**: ✅ Sufficient - map loads in <3 seconds (NFR-PERF-01)
- **Condition reporting**: ✅ Sufficient - forms work fine in web
- **Session planning**: ✅ Sufficient - simple interactions
- **Map interactions**: ⚠️ Good but not excellent - pinch-zoom works but not as smooth
- **Offline mode**: ⚠️ Limited - cached data only, no background sync

**Verdict:** Meets all MVP requirements but leaves UX headroom on table.

---

### Option 2: React Native (Native Apps)

**Description:** True native mobile apps for iOS and Android, distributed via App Store and Google Play.

#### Advantages
- ✅ **Best performance**: Native rendering, 60fps animations
- ✅ **Native feel**: Platform-specific UI patterns feel "right"
- ✅ **Better offline**: Full background sync capabilities
- ✅ **Push notifications**: Work reliably on both platforms
- ✅ **Geolocation**: More accurate, lower battery drain
- ✅ **App store presence**: Official distribution channels
- ✅ **"Real app" credibility**: Users trust app store apps

#### Disadvantages
- ❌ **2-3x development time**: iOS + Android platform concerns from day 1
- ❌ **Higher complexity**: Platform-specific bugs and quirks
- ❌ **App store requirements**:
  - **Apple Developer Program**: $99/year + approval process (1-2 weeks per release)
  - **Google Play**: $25 one-time + approval process (hours to days)
- ❌ **Deployment delays**: Changes require app store approval, users must update
- ❌ **Native module complexity**: Maps, geolocation may need native bridges
- ❌ **Build tooling**: Xcode (iOS), Android Studio (Android), separate build pipelines
- ❌ **Testing complexity**: Need physical iOS and Android devices
- ⚠️ **Update fragmentation**: Users on different versions if they don't update

#### Cost Analysis
- **Development time to MVP**: 8-12 weeks (2-3x PWA)
- **Ongoing costs**:
  - Apple Developer: $99/year
  - Google Play: $25 one-time
  - Hosting: Same as PWA
- **Learning curve**: High (React Native + iOS + Android ecosystems)

#### UX Quality for Spotsapp Use Cases
- **Quick check (Mika at 5 AM)**: ✅ Excellent - fast, smooth map interactions
- **Condition reporting**: ✅ Excellent - native form controls
- **Session planning**: ✅ Excellent - smooth interactions
- **Map interactions**: ✅ Excellent - native pinch-zoom, gestures
- **Offline mode**: ✅ Excellent - full background sync

**Verdict:** Best UX but highest cost and complexity. Overkill for MVP validation.

---

### Option 3: Expo (Unified Web + Native)

**Description:** Expo framework enables React Native development with web output AND mobile deployment via Expo Go or standalone builds.

#### What is Expo?
- **Expo SDK**: Enhanced React Native with batteries-included APIs (camera, location, maps, etc.)
- **Expo Go**: Sandbox app (free) users install once to run unlimited Expo apps via QR code
- **Web support**: Same codebase can compile to web (PWA-like)
- **EAS Build**: Cloud build service for standalone apps (optional, for app store deployment later)

#### Deployment Options with Expo

**Option 3A: Expo Web + Expo Go (Recommended for MVP)**

##### How It Works
1. **Web deployment**: `npx expo export:web` → deploy to hosting → users access via browser (like PWA)
2. **Expo Go deployment**: Users install Expo Go app (free, from app stores) → scan QR code or open deep link → your app runs inside Expo Go sandbox

##### Advantages
- ✅ **Best of both worlds**: Web access + native app experience
- ✅ **No app store approval needed**: Users install Expo Go once, then scan QR to load your app
- ✅ **No Apple Developer license**: Free during MVP validation
- ✅ **Instant updates**: Update web and Expo Go versions immediately
- ✅ **Single codebase**: Write once, deploy to web + iOS + Android
- ✅ **Better performance than PWA**: Native rendering in Expo Go
- ✅ **Better APIs than PWA**: Native geolocation, better offline, better maps
- ✅ **Share link to either**: WhatsApp link → web OR deep link to Expo Go
- ✅ **Gradual onboarding**: Users can try web first, then install Expo Go for better experience
- ✅ **Developer experience**: Expo CLI is excellent, hot reload, easy debugging

##### Disadvantages
- ⚠️ **Expo Go install friction**: Users must install Expo Go first (one-time, but still friction)
- ⚠️ **QR code/deep link step**: Extra step vs direct app store download
- ⚠️ **"Not in app store" perception**: Some users may be confused
- ⚠️ **Expo Go limitations**: Some native modules not available in sandbox
- ⚠️ **Bundle size**: Expo Go is large (~200MB) because it includes all APIs
- ❌ **No push notifications in Expo Go**: Requires standalone build for notifications

##### Cost Analysis
- **Development time to MVP**: 5-7 weeks (slightly more than PWA due to React Native learning)
- **Ongoing costs**:
  - $0 for Expo Go deployment
  - Hosting: ~$10-20/month for web + API backend
  - EAS Build (optional): Free tier available, paid plans start $29/month
- **Learning curve**: Medium (React Native + Expo ecosystem)

##### Distribution Model
```
User Journey Option 1 (Web-first):
WhatsApp link → Opens in browser → Works immediately as PWA-like web app
                                 → "Get better experience" banner → Install Expo Go → Scan QR

User Journey Option 2 (Native-first):
WhatsApp deep link → "Install Expo Go" → Opens in Expo Go with native performance
```

##### Upgrade Path
When you hit 50+ users and want app store presence:
1. Run `eas build` → generates standalone iOS/Android apps
2. Submit to app stores (then need $99 Apple + $25 Google)
3. Users transition from Expo Go → standalone apps
4. Codebase remains identical

**Option 3B: Expo with Standalone Builds (EAS Build)**

##### How It Works
Build standalone native apps using Expo's cloud build service, submit to app stores normally.

##### Advantages
- ✅ All benefits of React Native (native performance, app store presence)
- ✅ Easier than pure React Native (Expo handles native complexity)
- ✅ Still supports web deployment from same code
- ✅ Better developer experience than pure React Native

##### Disadvantages
- ❌ Still requires Apple Developer ($99/year) and Google Play ($25)
- ❌ Still subject to app store approval delays
- ⚠️ EAS Build costs: Free tier limited, paid plans start $29/month

**Verdict for Option 3:** Expo Web + Expo Go provides the best trade-off for MVP.

---

## Comparison Matrix

| Factor | PWA | React Native | Expo (Web + Go) | Expo (Standalone) |
|--------|-----|--------------|-----------------|-------------------|
| **Time to MVP** | 4-6 weeks ⭐ | 8-12 weeks | 5-7 weeks ⭐ | 7-10 weeks |
| **Upfront cost** | $0 ⭐ | $124/year | $0 ⭐ | $124/year |
| **Distribution friction** | Lowest ⭐ | Medium | Low ⭐ | Medium |
| **Update speed** | Instant ⭐ | Days/weeks | Instant ⭐ | Days/weeks |
| **UX quality** | Good | Excellent ⭐ | Very Good ⭐ | Excellent ⭐ |
| **Cross-platform** | Automatic ⭐ | Manual | Automatic ⭐ | Automatic ⭐ |
| **Learning curve** | Low ⭐ | High | Medium | Medium |
| **Offline capability** | Limited | Excellent ⭐ | Very Good ⭐ | Excellent ⭐ |
| **Performance** | Good | Excellent ⭐ | Very Good ⭐ | Excellent ⭐ |
| **App store presence** | No | Yes ⭐ | No | Yes ⭐ |
| **Push notifications** | Unreliable | Yes ⭐ | No* | Yes ⭐ |

*Push notifications in Expo Go require workarounds; standalone builds support them fully.

---

## Spotsapp-Specific Analysis

### User Needs Assessment

From PRD User Journeys, analyze what UX quality is actually needed:

**Mika (Dawn Patrol - Journey 1):**
- Opens app at 5:15 AM while half-asleep
- Needs: Map loads fast (<3s), see conditions at a glance, mark session in <3 taps
- **PWA sufficient?** Yes - these are simple interactions
- **Expo Go better?** Slightly - faster map rendering when sleepy matters

**Sofia (Traveling Visitor - Journey 2):**
- New to area, exploring spots, reading wikis
- Needs: Good map performance, easy wiki reading, discover community
- **PWA sufficient?** Yes - mostly reading content
- **Expo Go better?** Yes - smoother map exploration matters when discovering new area

**Anonymous-to-Registered (Journey 3):**
- Exploring without commitment, deciding whether to register
- Needs: Fast initial experience, low friction
- **PWA sufficient?** Yes - web link is lowest friction
- **Expo Go better?** Equal - web first, then upgrade to Expo Go if they want

### Success Criteria Alignment

From PRD Success Criteria, check what's required:

| Success Criterion | PWA | Expo (Web + Go) | React Native |
|-------------------|-----|-----------------|--------------|
| One-glance decision < 10s | ✅ Can achieve | ✅ Can achieve | ✅ Can achieve |
| Zero-friction contribution < 15s | ✅ Can achieve | ✅ Can achieve | ✅ Can achieve |
| Newcomer self-service | ✅ Web link easiest | ✅ Web link easiest | ⚠️ App store friction |
| Map loads < 3s | ✅ Achievable | ✅ Achievable | ✅ Achievable |
| 5-10 influencers Month 1 | ✅ Easy to share | ✅ Easy to share | ⚠️ App store friction |
| 50+ users Month 3 | ✅ Can scale | ✅ Can scale | ✅ Can scale |

**Insight:** PWA and Expo both meet success criteria. React Native's app store friction may actually hurt early adoption.

### Technical Feasibility

**Map Performance Requirements:**
- PRD specifies Mapbox/Leaflet integration
- Zoom-density scaling with marker clustering
- **PWA:** Mapbox GL JS works well, clustering libraries available
- **Expo:** React Native Maps + clustering works excellently
- **Verdict:** Both sufficient, Expo slightly smoother

**Offline Requirements:**
- NFR-AVAIL-03: "Display cached map data when offline"
- **PWA:** Service workers can cache tiles, limited
- **Expo:** AsyncStorage + NetInfo gives better offline control
- **Verdict:** Expo better but PWA acceptable for MVP

**Geolocation:**
- FR-MAP-04: "Map automatically centers on user's current location"
- **PWA:** Geolocation API works, higher battery drain
- **Expo:** expo-location provides better accuracy and efficiency
- **Verdict:** Expo better but PWA sufficient

---

## Strategic Recommendation

### Primary Recommendation: **Expo (Web + Expo Go)**

**Rationale:**

1. **MVP Validation Optimized:**
   - $0 cost during validation (no app store fees)
   - Fast to market (5-7 weeks, comparable to PWA)
   - Instant updates based on user feedback
   - Multiple access paths (web + Expo Go) = lower friction

2. **Superior UX vs PWA:**
   - Native map rendering (smoother than web)
   - Better offline capabilities (matters for beach with spotty connection)
   - Better geolocation (important for auto-centering map)
   - Platform-agnostic codebase ready for React Native migration

3. **Lower Risk than React Native:**
   - No app store approval dependency for MVP
   - Can iterate fast based on influencer feedback
   - Upgrade path to app stores when justified by traction

4. **Aligns with PRD Goals:**
   - "Framework-agnostic learning" - Learn React Native without full native complexity
   - "Agentic coding exercise" - Expo has excellent documentation for AI tools
   - "Architecture showcase" - Single codebase for web + mobile demonstrates good architecture
   - API-first backend - Same backend works for web + Expo + future standalone

5. **Distribution Strategy:**
   ```
   Phase 1 (Month 1 - 5-10 influencers):
   - Share web link in WhatsApp
   - "Want better performance? Install Expo Go + scan QR"
   - Gather feedback on both experiences

   Phase 2 (Month 2-3 - 50+ users):
   - Continue web + Expo Go distribution
   - Monitor user preferences (web vs Expo Go usage)

   Phase 3 (Month 4+ - if traction proven):
   - If users demand app store presence: Build standalone apps
   - If web + Expo Go works well: Stay with it, invest in features instead
   ```

### Implementation Plan

**Week 1-2: Project Setup**
- Initialize Expo project: `npx create-expo-app spotsapp`
- Configure for web: Install `@expo/webpack-config`
- Set up API backend (separate from frontend)
- Configure Expo Router for navigation

**Week 3-4: Core Features**
- Map integration (react-native-maps for native, Mapbox GL JS for web)
- Spot creation and display
- Session planning UI
- Condition reporting forms

**Week 5-6: Polish & Deploy**
- Responsive design (web + mobile)
- Offline caching
- Deploy web to Vercel/Netlify
- Publish Expo Go build
- Generate QR code for distribution

**Week 7: Launch**
- Share web link + QR code in WhatsApp
- Gather influencer feedback
- Iterate based on usage data

### Upgrade Path Decision Points

**Trigger for Standalone Apps (App Stores):**
- ✅ 50+ active users sustained (product-market fit proven)
- ✅ Users explicitly requesting "real app store app"
- ✅ Push notifications become critical (can't do in Expo Go)
- ✅ Expo Go friction causing user drop-off (measure with analytics)

**If triggers met:**
1. Run `eas build --platform all`
2. Purchase Apple Developer ($99) + Google Play ($25)
3. Submit to stores (2-3 weeks first approval)
4. Notify users to upgrade from Expo Go → standalone app
5. Maintain web version as well (same codebase)

**If triggers NOT met:**
- Stay with web + Expo Go
- Invest in features instead of app store presence
- Most users probably don't care about app stores (coordination utility, not social app)

---

## Alternative Scenarios

### Scenario A: "I Want Fastest MVP Possible"
**Choose:** PWA only
**Rationale:** 4-6 weeks, zero complexity, share link and done
**Trade-off:** Leave UX quality on table, may need to rebuild for native later

### Scenario B: "Users Absolutely Demand Native Feel"
**Choose:** React Native with app stores
**Rationale:** Best UX from day 1, worth the investment if you know users want it
**Trade-off:** 8-12 weeks, $124 upfront, slower iteration

### Scenario C: "I Want to Learn React Native"
**Choose:** Expo (Web + Go) → Standalone
**Rationale:** Learn React Native incrementally, get web for free, upgrade path clear
**Trade-off:** Slight learning curve vs pure PWA

---

## Decision Record

**Date:** 2026-02-20
**Decision:** Start with **Expo (Web + Expo Go deployment)**

**Why:**
- Meets all MVP success criteria
- Superior UX vs PWA (native performance)
- Lower risk vs React Native (no app store dependency)
- $0 cost during validation
- Clear upgrade path when/if needed
- Single codebase for web + iOS + Android
- Aligns with "architecture showcase" goal from PRD

**Success Metrics:**
- Month 1: 5-10 influencers using either web or Expo Go
- Month 2: Measure web vs Expo Go usage split
- Month 3: 50+ users target - if met, evaluate standalone app need

**Review Date:** Month 3 (May 2026) - Reassess based on user feedback and usage data

**Stakeholders:** Hemmu (developer + product owner)

---

## Technical Specifications

### Expo Configuration

```json
// app.json
{
  "expo": {
    "name": "Spotsapp",
    "slug": "spotsapp",
    "platforms": ["ios", "android", "web"],
    "web": {
      "bundler": "metro",
      "favicon": "./assets/favicon.png"
    },
    "ios": {
      "bundleIdentifier": "com.spotsapp.app",
      "supportsTablet": true
    },
    "android": {
      "package": "com.spotsapp.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    }
  }
}
```

### Key Dependencies
- `expo` - Core framework
- `expo-router` - File-based routing (works web + native)
- `react-native-maps` - Native maps (iOS/Android)
- `mapbox-gl` - Web maps
- `expo-location` - Geolocation
- `expo-sqlite` - Offline storage
- `expo-notifications` - Push (standalone apps only)

### API Backend
- Separate Node.js/Python backend with REST API
- Deploy to Railway/Fly.io/Render
- Same API serves web + Expo + future standalone apps
- GraphQL or REST with OpenAPI docs

---

## Appendix: Expo Go User Experience

### First-Time User Flow (Expo Go)

1. User receives WhatsApp message: "Check out Spotsapp! [web link] or [expo link]"
2. **Option A (Web):** Tap web link → Opens in browser → Works immediately
3. **Option B (Expo Go):**
   - Tap expo link
   - If Expo Go not installed: Redirects to app store → Install Expo Go (one-time)
   - Opens in Expo Go → Full native performance

### Returning User (Expo Go)
1. Open Expo Go app
2. Spotsapp appears in recent apps
3. Tap to open → Instant launch (already downloaded)

### Update Experience
- Developer publishes update
- Expo Go checks for updates on launch
- Downloads delta (only changed code)
- User sees update within seconds, no approval wait

---

## Questions & Answers

**Q: Will users be confused by Expo Go?**
A: Possibly, but two mitigations: (1) Provide web version for instant access, (2) Clear instructions: "Install Expo Go app, then scan this QR code for better performance"

**Q: What if Expo Go gets removed from app stores?**
A: Very unlikely (Expo is well-established), but if it happens, switch to standalone builds immediately. Codebase stays identical.

**Q: Can we do push notifications?**
A: Not in Expo Go sandbox. Need standalone builds for push. This is a Month 4+ feature anyway (Growth phase per PRD).

**Q: What about React Native limitations (no DOM APIs)?**
A: Expo provides cross-platform abstractions. For web-specific needs, use `Platform.select()`. Most Spotsapp features (map, forms, lists) work fine.

**Q: Performance comparison to native?**
A: Expo Go: ~85-90% of native performance (very good, better than PWA). Standalone builds: ~95-98% of native (excellent).

---

## Conclusion

**Start with Expo (Web + Expo Go)** - it provides the best balance of:
- Fast time to market (comparable to PWA)
- Superior UX (native performance)
- Low risk ($0 cost, no app store dependencies)
- Clear upgrade path (to standalone apps when justified)

This decision can be revisited at Month 3 based on user feedback and traction data. The beauty of Expo is that the codebase remains identical regardless of deployment target - we're not locked in.

**Next Steps:**
1. Initialize Expo project
2. Design UX with platform-agnostic patterns
3. Build MVP with web + Expo Go deployment
4. Launch and gather feedback
5. Reassess at Month 3
