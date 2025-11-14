# Product Requirements Document: runPaceFlow Route Discovery Platform

**Version:** 1.0
**Date:** November 11, 2025
**Status:** Draft for Review
**Author:** Product Team

---

## Executive Summary

### Product Vision

Transform runPaceFlow from a sync-focused activity aggregator into a **specialized route discovery platform** that helps runners find their ideal routes through intelligent recommendations based on surface preferences and optimal timing.

### Strategic Pivot

- **From:** Activity sync tool for existing Strava/NRC users
- **To:** Route discovery platform for new runners seeking better route intelligence
- **Focus:** Surface intelligence + timing recommendations (specialized, not broad)
- **Approach:** Aggregate existing routes from platforms + personalized recommendation feed

### Key Metrics for Success

**Primary:** Daily Active Users (DAU) and retention rates
**Target:** Users returning daily for new route recommendations

---

## Problem Statement

### The Gap in the Market

Current running platforms (Strava, Garmin Connect, Nike Run Club) focus heavily on:

- Performance tracking and social features (Strava)
- Comprehensive fitness metrics (Garmin)
- Guided runs and achievements (Nike Run Club)

**What's missing:** Intelligent route discovery based on surface preferences and optimal timing factors that casual and intermediate runners care about most.

### User Pain Points

1. **Surface preference blind spot**: Runners who prefer trail vs. pavement can't easily filter routes
2. **Timing guesswork**: No guidance on when to run specific routes for best experience
3. **Discovery overload**: Strava's route library is vast but lacks personalized curation
4. **Analysis paralysis**: Too many metrics, not enough actionable route recommendations

### Why This Matters

- **60% of recreational runners** care more about enjoying their route than optimizing pace
- Surface type significantly impacts injury risk and enjoyment
- Weather, daylight, and crowd factors change route quality throughout the day
- Current solutions require manual research across multiple tools

---

## Target Users & Personas

### Primary Audience

**New runners not currently using runPaceFlow** - expanding beyond the existing Strava/NRC sync user base

### Persona 1: The Trail Seeker

- **Name:** Sarah, 32, Marketing Manager
- **Running Level:** Intermediate (3-4 runs/week, 5-10km)
- **Pain Point:** "I love trail running but hate searching through hundreds of routes on AllTrails and Strava to find good ones near me"
- **Goal:** Discover new trail routes that match her distance preference and difficulty level
- **Behavior:** Opens app when planning weekend runs, saves routes for later

### Persona 2: The Pavement Perfectionist

- **Name:** Marcus, 28, Software Engineer
- **Running Level:** Beginner-Intermediate (2-3 runs/week, 3-8km)
- **Pain Point:** "I need flat pavement routes for my knees, but every 'easy' route people recommend has surprise hills or gravel sections"
- **Goal:** Find consistent, predictable pavement routes for training
- **Behavior:** Checks app for route suggestions based on available time and conditions

### Persona 3: The Time Optimizer

- **Name:** Jennifer, 41, Small Business Owner
- **Running Level:** Regular (4-5 runs/week, 5-12km)
- **Pain Point:** "I run at different times each day. Some routes are great in morning but terrible at noon (sun exposure, crowds)"
- **Goal:** Get recommendations for which route to run based on time of day
- **Behavior:** Daily check-in for personalized timing-based route suggestions

### Non-Target Users (Out of Scope for MVP)

- Competitive/elite runners focused on performance optimization
- Ultra-runners needing specialized trail routing
- Casual walkers (may expand later, but focusing on runners first)

---

## Product Vision & Goals

### North Star

**Become the go-to platform for runners who want to discover their perfect route, not analyze their past runs.**

### MVP Goals (3-6 months)

1. **Validation:** Prove that personalized route recommendations drive daily engagement
2. **Differentiation:** Establish "surface intelligence" as our unique value proposition
3. **Foundation:** Build aggregation pipeline from major running platforms
4. **Engagement:** Achieve 30% weekly retention rate among early adopters

### Long-term Vision (6-18 months)

- Route discovery authority for recreational runners
- Community-contributed route enhancements (surface verification, timing reviews)
- Native tracking capabilities to enhance recommendation engine
- Expansion to walking routes, cycling routes

### What Success Looks Like

- **User behavior:** "I check runPaceFlow every morning to see what route I should run today"
- **Word of mouth:** "If you want to find great running routes, use runPaceFlow"
- **Ecosystem position:** Complementary to Strava (they track, we recommend)

---

## Core Features (MVP Scope)

### Feature 1: Route Aggregation Engine

**Priority:** P0 (Critical)

**Description:**
Automatically aggregate running routes from existing platforms (Strava Routes, MapMyRun, etc.)

**Capabilities:**

- Import popular routes from Strava's public route library
- Parse route metadata: distance, elevation, location, popularity
- Store route data in normalized database schema
- Periodic sync to keep route library fresh

**Technical Requirements:**

- Integration with Strava Routes API
- Route deduplication logic (same physical route from multiple sources)
- Geocoding and reverse geocoding for location-based search
- Database schema for routes, surfaces, conditions

**Out of Scope for MVP:**

- User-generated route creation
- Real-time route tracking
- Turn-by-turn navigation

---

### Feature 2: Surface Intelligence Classification

**Priority:** P0 (Critical)

**Description:**
Classify routes by primary surface type and provide surface preference filtering

**Surface Categories:**

1. **Pavement** - Road, sidewalk, paved paths
2. **Trail** - Dirt trails, forest paths, natural terrain
3. **Mixed** - Combination of pavement and trail
4. **Track** - Running tracks, stadiums
5. **Gravel** - Gravel paths, crushed stone

**Classification Methods (MVP):**

- **Heuristic-based:** Use route names, descriptions, tags from source platforms
- **Crowd-sourced validation:** Allow users to verify/correct surface type (post-MVP)
- **GIS data integration:** Cross-reference with OpenStreetMap surface data (post-MVP)

**User-Facing Features:**

- Surface type filter in route discovery
- Surface preference setting in user profile
- Visual surface indicators on route cards

**Acceptance Criteria:**

- 80% of aggregated routes have surface classification
- Surface filter reduces result set to only matching routes
- Users can set primary and secondary surface preferences

---

### Feature 3: Timing Recommendations

**Priority:** P1 (High)

**Description:**
Provide guidance on optimal times to run specific routes based on various factors

**Timing Factors (MVP):**

1. **Daylight hours** - Prefer routes with good lighting/visibility at current time
2. **Historical weather patterns** - Avoid routes with heavy sun exposure during peak heat
3. **Crowd levels** - Flag popular routes that get crowded at certain times

**Implementation (MVP):**

- **Simple rules engine:** Morning = wooded trails (shade), Evening = lit paths
- **Weather integration:** Pull current and forecasted conditions
- **Time-of-day tags:** Morning-friendly, Evening-friendly, All-day

**User-Facing Features:**

- "Best time to run" badge on route cards
- Time-based route filtering ("Show routes good for running now")
- Timing recommendation in personalized feed

**Out of Scope for MVP:**

- Machine learning-based timing optimization
- Real-time crowd data from mobile tracking
- Historical personal preference learning

---

### Feature 4: Personalized Recommendation Feed

**Priority:** P0 (Critical)

**Description:**
Daily personalized route recommendations based on user preferences, location, and conditions

**Feed Logic (MVP):**

```
User preferences (surface type, distance range, location)
+ Current conditions (time of day, weather, temperature)
+ Route popularity and ratings
= Personalized daily route recommendations
```

**Feed Composition:**

- 5-10 recommended routes per day
- Mix of familiar nearby routes + discovery of new routes
- Refresh daily at 6am local time
- "For you" explanations (e.g., "Recommended because: trail route, 5km, shaded morning run")

**Personalization Inputs:**

- Preferred surface types (set in onboarding/profile)
- Typical running distance (extracted from connected Strava/NRC data)
- Home location (city/neighborhood)
- Time of day when user typically opens app

**User Actions:**

- Save routes to favorites
- Mark routes as "interested" or "not for me" (feedback for algorithm)
- Export route to GPX for watch/phone
- View route details and map

**Acceptance Criteria:**

- Feed refreshes daily with new recommendations
- Recommendations respect user surface preferences (≥70% match)
- User can take action (save, export, dismiss) on each recommendation
- Feed loads in <2 seconds

---

### Feature 5: Route Detail & Export

**Priority:** P0 (Critical)

**Description:**
Detailed route information and ability to export for use in running apps/watches

**Route Detail Page Includes:**

- Interactive map with route overlay
- Key stats: distance, elevation gain/loss, surface type
- Timing recommendations (best times to run)
- Source attribution (e.g., "Popular on Strava")
- Weather-aware description (e.g., "Minimal shade - avoid midday in summer")

**Export Options:**

- **GPX download** - For Garmin, Coros, Suunto watches
- **Share link** - Send route to friends
- **Open in Strava** - Direct link to Strava route page
- **Add to calendar** - Schedule route for specific time (post-MVP)

**Acceptance Criteria:**

- Route page loads with map rendered in <3 seconds
- GPX export works correctly in Garmin Connect
- All route metadata (distance, elevation, surface) displayed accurately

---

### Feature 6: User Profile & Preferences

**Priority:** P0 (Critical)

**Description:**
User account with preferences for personalization and saved routes

**Profile Components:**

- **Account basics:** Email, password, location (city/zip)
- **Running preferences:**
  - Primary surface preference (pavement, trail, mixed)
  - Secondary surface preference (optional)
  - Typical running distance (3-5km, 5-10km, 10-15km, 15+km)
  - Preferred running times (morning, midday, evening, flexible)
- **Connected accounts:** Strava, Nike Run Club (OAuth integration)
- **Saved routes:** Bookmarked routes from recommendations

**Onboarding Flow:**

1. Sign up (email/password or OAuth)
2. Connect Strava/NRC (optional but encouraged)
3. Set location (required for recommendations)
4. Choose surface preference (required)
5. Set typical distance (required)
6. View first personalized recommendation feed

**Acceptance Criteria:**

- Onboarding completes in <2 minutes
- Preferences immediately affect recommendation feed
- Users can edit preferences and see feed update
- Saved routes persist and are easily accessible

---

### Feature 7: Route Search & Discovery

**Priority:** P1 (High)

**Description:**
Manual search and filtering for users who want to browse beyond the recommendation feed

**Search Capabilities:**

- **Location search:** Find routes near specific address/city
- **Distance filter:** Select desired route length (slider: 1-30km)
- **Surface filter:** Pavement, Trail, Mixed, Track, Gravel
- **Elevation filter:** Flat, Rolling, Hilly (based on elevation gain)
- **Sorting options:** Most popular, Highest rated, Newest, Closest

**Search Results Display:**

- Map view with route clusters
- List view with route cards
- Infinite scroll pagination
- "Show on map" toggle between list and map views

**Acceptance Criteria:**

- Search returns results in <2 seconds
- Filters work in combination (AND logic)
- Map view shows route locations accurately
- Zero-results state suggests expanding filters

---

## Non-MVP Features (Future Roadmap)

### Phase 2 (6-12 months post-MVP)

- **Native route tracking:** Record routes within runPaceFlow app
- **Community reviews:** User ratings and comments on routes
- **AI-powered route generation:** Generate custom routes based on preferences
- **Weather integration:** Real-time weather overlays on route maps
- **Social features:** Follow friends, share routes, see who's run what

### Phase 3 (12-18 months post-MVP)

- **Training plans:** Structured route recommendations for race training
- **Route challenges:** Gamification around discovering new routes
- **Premium features:** Advanced filters, route comparison, offline maps
- **Expansion:** Walking routes, cycling routes, hiking trails

---

## User Experience & Flow

### Primary User Journey: Daily Route Discovery

```
1. User opens runPaceFlow app/website (morning routine)
   ↓
2. Lands on personalized recommendation feed
   - Sees 5-10 route suggestions for today
   - Each card shows: route name, distance, surface type, "why recommended"
   ↓
3. User browses recommendations
   - Scrolls through feed
   - Taps route card for more details
   ↓
4. User selects a route they like
   - Views detailed route page with map
   - Checks timing recommendation ("Best: 6-9am, avoid midday")
   - Sees elevation profile and surface breakdown
   ↓
5. User takes action
   Option A: Save route to favorites for later
   Option B: Export GPX to running watch
   Option C: Share route with running buddy
   Option D: Dismiss and keep browsing
   ↓
6. User goes for run (outside app)
   ↓
7. User returns next day for new recommendations
   - Algorithm learns from saved routes
   - Feed becomes more personalized over time
```

### Secondary Journey: Manual Route Search

```
1. User has specific route needs (e.g., visiting new city)
   ↓
2. Navigates to Search/Explore tab
   ↓
3. Enters location + applies filters
   - Location: "Portland, OR"
   - Distance: 5-8km
   - Surface: Trail
   - Elevation: Flat to rolling
   ↓
4. Views search results
   - Map shows route locations
   - List shows route details
   ↓
5. Selects route → same detail page flow as primary journey
```

### Onboarding Journey (New User)

```
1. Landing page → "Get personalized route recommendations"
   ↓
2. Sign up (email or OAuth)
   ↓
3. Connect Strava/NRC (optional)
   - "We'll use your running history to personalize recommendations"
   ↓
4. Set location
   - "Where do you run most often?"
   - Auto-detect or manual entry
   ↓
5. Choose surface preference
   - "What surface do you prefer?"
   - [Pavement] [Trail] [Mixed] [No Preference]
   ↓
6. Set typical distance
   - "How far do you usually run?"
   - [3-5km] [5-10km] [10-15km] [15+km]
   ↓
7. View first recommendation feed
   - "Here are your personalized routes for today"
   - Tutorial tooltips explain features
   ↓
8. User explores and takes action
```

---

## Technical Architecture

### Platform Decision: Web-Only MVP

**Rationale:**

- Faster development and iteration
- Single codebase to maintain
- Easier user acquisition (no app store approvals)
- Desktop + mobile web covers primary use case
- Native apps can be added post-MVP if validated

### Technology Stack

#### Frontend

- **Framework:** Next.js 15 (React) - Already in use
- **Language:** TypeScript
- **Styling:** TailwindCSS + UIKit colors (existing setup)
- **Maps:** Mapbox GL JS or Leaflet for route visualization
- **State Management:** React Context + TanStack Query
- **Auth:** NextAuth.js (already integrated)

#### Backend

- **Runtime:** Node.js (Next.js API routes)
- **Database:** SQLite (current) → PostgreSQL (production)
- **ORM:** Drizzle ORM (already in use)
- **API:** tRPC (type-safe API layer)
- **Auth:** NextAuth.js with OAuth providers

#### External Services

- **Route Data:** Strava API, MapMyRun API
- **Maps:** Mapbox or Google Maps API
- **Weather:** OpenWeatherMap API
- **Geocoding:** Nominatim (OpenStreetMap) or Google Geocoding
- **Email:** Resend or SendGrid (for notifications)

#### Infrastructure

- **Hosting:** Vercel (Next.js optimized)
- **Database:** Supabase (PostgreSQL) or Railway
- **File Storage:** Cloudflare R2 or S3 (for route GPX files)
- **Monitoring:** Sentry (errors) + Vercel Analytics

---

### Database Schema (Core Tables)

```sql
-- Routes
routes
  - id (uuid, primary key)
  - external_id (string, unique) -- Strava route ID, etc.
  - source (enum: strava, mapmyrun, etc.)
  - name (string)
  - description (text, nullable)
  - distance_meters (integer)
  - elevation_gain_meters (integer)
  - elevation_loss_meters (integer)
  - surface_type (enum: pavement, trail, mixed, track, gravel)
  - surface_confidence (float) -- Classification confidence
  - gpx_url (string) -- Link to GPX file
  - polyline (text) -- Encoded polyline for map display
  - location_city (string)
  - location_country (string)
  - latitude (float) -- Center point
  - longitude (float) -- Center point
  - created_at (timestamp)
  - updated_at (timestamp)

-- Route Timing Metadata
route_timing
  - id (uuid, primary key)
  - route_id (uuid, foreign key → routes)
  - best_time_of_day (enum: morning, midday, evening, any)
  - shade_level (enum: none, partial, full)
  - lighting_required (boolean) -- Needs daylight or lit paths
  - crowd_level (enum: low, medium, high, variable)
  - notes (text, nullable)

-- Users
users
  - id (uuid, primary key)
  - email (string, unique)
  - name (string)
  - location_city (string)
  - location_lat (float)
  - location_lng (float)
  - surface_preference_primary (enum)
  - surface_preference_secondary (enum, nullable)
  - typical_distance_min (integer) -- in meters
  - typical_distance_max (integer) -- in meters
  - preferred_times (array of enum: morning, midday, evening)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Connected Accounts
connected_accounts
  - id (uuid, primary key)
  - user_id (uuid, foreign key → users)
  - provider (enum: strava, nrc, garmin)
  - provider_user_id (string)
  - access_token (encrypted text)
  - refresh_token (encrypted text)
  - expires_at (timestamp)
  - created_at (timestamp)

-- Saved Routes (Favorites)
saved_routes
  - id (uuid, primary key)
  - user_id (uuid, foreign key → users)
  - route_id (uuid, foreign key → routes)
  - saved_at (timestamp)

-- User Route Interactions (for algorithm)
user_route_interactions
  - id (uuid, primary key)
  - user_id (uuid, foreign key → users)
  - route_id (uuid, foreign key → routes)
  - interaction_type (enum: viewed, saved, exported, dismissed)
  - timestamp (timestamp)
```

---

### API Architecture

#### Key Endpoints (tRPC procedures)

```typescript
// Route Discovery
router.route.getFeed(userId) → PersonalizedRouteRecommendation[]
router.route.search(filters) → SearchResult[]
router.route.getById(routeId) → RouteDetail
router.route.export(routeId, format) → { downloadUrl: string }

// User Management
router.user.create(email, password) → User
router.user.getProfile(userId) → UserProfile
router.user.updatePreferences(userId, preferences) → User
router.user.connectAccount(userId, provider, oauth_code) → ConnectedAccount

// Interactions
router.interaction.save(userId, routeId) → SavedRoute
router.interaction.unsave(userId, routeId) → boolean
router.interaction.trackView(userId, routeId) → void
router.interaction.dismiss(userId, routeId) → void
```

---

### Data Sources & Integration

#### Strava Routes API

- **Access:** Public routes, requires Strava API key
- **Rate Limits:** 100 requests per 15 minutes, 1000 per day
- **Data Quality:** High - well-structured, popular routes
- **Integration Priority:** P0 (Critical for MVP)

#### MapMyRun API

- **Access:** Under Armour Connected Fitness API
- **Rate Limits:** TBD based on partnership
- **Data Quality:** Good - large route library
- **Integration Priority:** P1 (Nice to have)

#### OpenStreetMap / Overpass API

- **Access:** Free, open data
- **Use Case:** Surface type verification via GIS data
- **Integration Priority:** P2 (Post-MVP enhancement)

---

### Recommendation Algorithm (MVP)

#### Simple Rule-Based System

```python
def generate_recommendations(user, time_of_day, weather):
    # Filter routes by user preferences
    routes = get_routes_near(user.location, radius=10km)
    routes = filter_by_surface(routes, user.surface_preference)
    routes = filter_by_distance(routes, user.typical_distance_range)

    # Apply timing logic
    if time_of_day == "morning" and weather.temp < 20:
        routes = boost_routes_with(routes, shade_level="full")
    elif time_of_day == "midday" and weather.temp > 25:
        routes = filter_routes_with(routes, shade_level!="none")
    elif time_of_day == "evening":
        routes = boost_routes_with(routes, lighting_required=false)

    # Rank by popularity and newness
    routes = rank_by(routes, popularity_score, discovery_score)

    # Return top 10
    return routes[:10]
```

#### Future: ML-Based Personalization

- Learn from user interactions (saves, exports, dismissals)
- Collaborative filtering (routes similar users enjoyed)
- Embedding-based route similarity
- Contextual bandits for exploration vs exploitation

---

## Success Metrics & KPIs

### Primary Success Metric

**Daily Active Users (DAU) and Retention**

**Why:** Product thesis is that personalized recommendations drive daily habit formation

**Measurement:**

- **DAU:** Unique users who open app/website per day
- **Weekly Active Users (WAU):** Rolling 7-day active users
- **Monthly Active Users (MAU):** Rolling 30-day active users
- **Retention Rates:**
  - Day 1 retention: % users who return next day
  - Day 7 retention: % users who return within week
  - Day 30 retention: % users still active after month

**MVP Targets:**

- **DAU growth:** 10% week-over-week for first 3 months
- **Day 7 retention:** ≥30% (industry benchmark: 20-25%)
- **Day 30 retention:** ≥15% (industry benchmark: 10-12%)

---

### Secondary Metrics

#### Engagement Metrics

- **Routes viewed per session:** Target ≥3
- **Routes saved:** Target 15% of viewed routes
- **Routes exported:** Target 5% of viewed routes
- **Feed refresh rate:** How often users check for new recommendations

#### Discovery Metrics

- **Routes discovered:** Total unique routes viewed per user per month
- **Discovery diversity:** % of routes outside user's immediate area
- **New route adoption:** % of users who try routes they haven't run before

#### Quality Metrics

- **Recommendation relevance:** % of routes matching user preferences (Target: ≥80%)
- **User satisfaction:** Post-interaction surveys (Target: ≥4.0/5.0)
- **Route dismissal rate:** % of recommendations dismissed (Target: <30%)

#### Acquisition Metrics

- **Sign-up conversion:** % of visitors who create account
- **Onboarding completion:** % who finish preference setup
- **OAuth connection rate:** % who connect Strava/NRC
- **Referral rate:** % users who share routes with friends

---

### Analytics Implementation

**Tools:**

- **Product Analytics:** PostHog or Mixpanel (event tracking)
- **Web Analytics:** Vercel Analytics + Google Analytics 4
- **Error Tracking:** Sentry
- **User Feedback:** Hotjar (heatmaps, session recordings) or similar

**Key Events to Track:**

```javascript
// User Actions
- user_signed_up
- user_completed_onboarding
- user_connected_account (provider: strava/nrc)
- user_updated_preferences

// Route Interactions
- route_viewed (route_id, source: feed/search)
- route_saved (route_id)
- route_exported (route_id, format: gpx)
- route_dismissed (route_id)
- route_shared (route_id)

// Feed Interactions
- feed_viewed (num_routes)
- feed_refreshed
- feed_empty_state_shown

// Search Interactions
- search_performed (filters_used)
- search_results_shown (num_results)
- search_zero_results
```

---

## Go-to-Market Strategy

### Phase 1: Private Beta (Weeks 1-4)

**Goal:** Validate core assumptions with 50-100 early adopters

**Audience:**

- Friends, family, and personal network runners
- Running club members in target cities
- Beta testers from existing runPaceFlow user base (if applicable)

**Activities:**

- Manual onboarding and personalized support
- Weekly feedback surveys and 1-on-1 interviews
- Rapid iteration based on feedback
- Dog-food internally (team uses product daily)

**Success Criteria:**

- ≥60% of beta users return weekly
- ≥70% of users rate recommendations as "relevant" or "very relevant"
- Identify and fix critical UX issues

---

### Phase 2: Public Launch (Weeks 5-8)

**Goal:** Open to public, acquire first 1000 users

**Channels:**

1. **Product Hunt launch:** Target "Product of the Day"
2. **Reddit:** r/running, r/trailrunning (non-spammy, value-first posts)
3. **Running communities:** Local Facebook groups, Strava clubs
4. **Content marketing:** "Best trail runs in [City]" blog posts (SEO)
5. **Partnerships:** Reach out to running bloggers/influencers for reviews

**Messaging:**

- **Headline:** "Find your perfect running route, recommended just for you"
- **Value Props:**
  - "Tired of searching for good running routes? Get personalized recommendations daily"
  - "Love trails? Hate pavement? Filter routes by surface type"
  - "Know the best time to run any route"

**Pricing:** Free for all features during MVP validation phase

---

### Phase 3: Growth & Iteration (Weeks 9-24)

**Goal:** Achieve product-market fit, scale to 10,000+ users

**Growth Tactics:**

- **Viral loop:** "Share this route" feature with branded link
- **SEO strategy:** City-specific landing pages ("Best running routes in Portland")
- **Email marketing:** Weekly "New routes near you" digest
- **Partnerships:** Integrate with running watch brands, running stores
- **Community building:** Feature user stories, route of the week

**Monetization Research:**

- Survey users on willingness to pay
- Test premium feature concepts (advanced filters, offline maps, training plans)
- Explore B2B opportunities (running clubs, coaches, tourism boards)

---

## Risks & Mitigations

### Risk 1: Data Quality - Route Aggregation

**Risk:** Aggregated routes have poor/missing metadata (surface type, timing info)
**Impact:** High - Undermines core value proposition
**Likelihood:** High

**Mitigation:**

- Start with high-quality sources (Strava routes with ≥10 completions)
- Implement crowd-sourced verification (users confirm surface type)
- Build surface classification heuristics (analyze route names, descriptions)
- Accept 70-80% coverage for MVP, not 100%

---

### Risk 2: User Adoption - Weak Value Prop

**Risk:** Users don't find recommendations valuable enough to return daily
**Impact:** Critical - Invalidates product thesis
**Likelihood:** Medium

**Mitigation:**

- Validate with beta users before public launch
- A/B test different recommendation algorithms
- Provide manual search as fallback if recommendations miss
- Clearly communicate "why recommended" to build trust
- Iterate quickly based on feedback

---

### Risk 3: Technical - API Rate Limits

**Risk:** Strava API rate limits prevent scaling route aggregation
**Impact:** Medium - Limits route library growth
**Likelihood:** Medium

**Mitigation:**

- Apply for Strava API partnership (higher limits)
- Implement smart caching and batch processing
- Add additional data sources (MapMyRun, AllTrails)
- Consider crowd-sourced route creation as alternative

---

### Risk 4: Competitive - Strava Adds Similar Features

**Risk:** Strava launches personalized route recommendations
**Impact:** High - Primary competitive threat
**Likelihood:** Low-Medium

**Mitigation:**

- Focus on specialized depth (surface + timing) vs. broad features
- Build strong community and brand loyalty early
- Position as complementary tool ("Use Strava to track, runPaceFlow to discover")
- Expand into adjacent areas Strava won't (walking routes, tourism use cases)

---

### Risk 5: Monetization - Willingness to Pay

**Risk:** Users won't pay for premium features, limiting business model
**Impact:** Medium - Affects long-term sustainability
**Likelihood:** Medium

**Mitigation:**

- Launch free to validate engagement first
- Research monetization with engaged users, not all users
- Consider B2B2C models (running clubs, tourism boards pay, users access free)
- Explore affiliate revenue (gear recommendations, race registrations)
- Build strong value before introducing payments

---

## Open Questions & Decisions Needed

### Product Decisions

1. **Route density threshold:** How many routes needed per city to launch? (Proposal: ≥50 routes within 10km radius)
2. **Recommendation refresh frequency:** Daily? On-demand? Both? (Proposal: Daily at 6am + manual refresh button)
3. **Saved route limit:** Unlimited or cap for free users? (Proposal: Unlimited for MVP)
4. **Export formats:** GPX only or also TCX, FIT? (Proposal: GPX for MVP, expand later)

### Technical Decisions

1. **Map provider:** Mapbox ($5/1000 loads) vs. Leaflet + OSM (free, self-hosted) (Proposal: Leaflet for MVP to minimize costs)
2. **Database:** Migrate from SQLite to PostgreSQL now or later? (Proposal: Now, use Supabase free tier)
3. **Authentication:** Email/password + OAuth or OAuth-only? (Proposal: Both for flexibility)
4. **Route storage:** Store GPX files or just polylines? (Proposal: Both - polylines for display, GPX for export)

### Business Decisions

1. **Beta launch cities:** Which 3-5 cities to prioritize for beta? (Proposal: Portland, Seattle, Denver, Austin, Boston - strong running cultures)
2. **Strava API partnership:** Apply immediately or wait for traction? (Proposal: Apply now, 4-6 week approval process)
3. **Legal/Privacy:** GDPR compliance needed for MVP? (Proposal: Yes, implement basic privacy policy and data deletion)
4. **Brand positioning:** "Route discovery" vs. "Route intelligence" vs. "Smart route recommendations"? (Proposal: Test messaging in beta)

---

## Roadmap & Milestones

### Sprint 1-2 (Weeks 1-2): Foundation

- [ ] Set up production infrastructure (Vercel, Supabase, Mapbox/Leaflet)
- [ ] Implement database schema and migrations
- [ ] Build authentication system (NextAuth + Strava OAuth)
- [ ] Create basic UI shell (navigation, layout, design system)

### Sprint 3-4 (Weeks 3-4): Route Aggregation

- [ ] Integrate Strava Routes API
- [ ] Build route import pipeline and cron jobs
- [ ] Implement surface type classification (heuristic-based)
- [ ] Create route detail page with map visualization
- [ ] Build GPX export functionality

### Sprint 5-6 (Weeks 5-6): Personalization Engine

- [ ] Build user onboarding flow (preferences setup)
- [ ] Implement recommendation algorithm (rule-based MVP)
- [ ] Create personalized feed UI
- [ ] Add save/favorite functionality
- [ ] Implement timing recommendations logic

### Sprint 7-8 (Weeks 7-8): Search & Polish

- [ ] Build route search and filtering
- [ ] Add map view for search results
- [ ] Implement analytics tracking (PostHog/Mixpanel)
- [ ] Write comprehensive test suite
- [ ] Bug fixes and UX polish

### Sprint 9 (Week 9): Private Beta Launch

- [ ] Deploy to production
- [ ] Invite 50-100 beta testers
- [ ] Set up feedback collection (surveys, interviews)
- [ ] Monitor metrics and errors closely

### Sprint 10-12 (Weeks 10-12): Iteration

- [ ] Analyze beta feedback and metrics
- [ ] Prioritize and implement top improvements
- [ ] Refine recommendation algorithm
- [ ] Add additional route sources (MapMyRun, etc.)

### Sprint 13 (Week 13): Public Launch

- [ ] Final QA and load testing
- [ ] Prepare launch materials (Product Hunt, blog posts)
- [ ] Public launch!
- [ ] Monitor metrics and scale infrastructure as needed

---

## Appendix

### Competitive Analysis

| Platform        | Focus             | Strength                             | Weakness                                     |
| --------------- | ----------------- | ------------------------------------ | -------------------------------------------- |
| **Strava**      | Social + tracking | Huge route library, social proof     | Too many features, no personalization        |
| **AllTrails**   | Hiking/trails     | Excellent trail coverage             | Not runner-focused, no timing recs           |
| **MapMyRun**    | Route planning    | Good route creation tools            | Outdated UX, weak discovery                  |
| **Komoot**      | Multi-sport       | Strong route planning, offline maps  | Europe-focused, complex for casual users     |
| **runPaceFlow** | Route discovery   | Specialized focus, personalized recs | New entrant, small route library (initially) |

---

### Success Metrics Dashboard (MVP Target)

| Metric                      | Week 4 | Week 8 | Week 12 |
| --------------------------- | ------ | ------ | ------- |
| **Total Users**             | 100    | 500    | 1,500   |
| **DAU**                     | 30     | 120    | 400     |
| **DAU/MAU Ratio**           | 30%    | 25%    | 27%     |
| **Day 7 Retention**         | 25%    | 30%    | 35%     |
| **Routes Viewed/User/Week** | 5      | 7      | 10      |
| **Routes Saved/User**       | 2      | 4      | 6       |
| **Feed Engagement Rate**    | 60%    | 70%    | 75%     |

---

### User Feedback Themes (To Monitor)

**Positive Signals:**

- "This saved me so much time searching for routes"
- "I never knew there were good trails near me"
- "The timing recommendations are spot-on"
- "I check this every morning before my run"

**Warning Signals:**

- "Recommendations don't match my preferences"
- "Route library is too small in my city"
- "I don't understand why these routes were recommended"
- "I prefer just searching manually"

---

## Document Change Log

| Version | Date         | Author       | Changes                                  |
| ------- | ------------ | ------------ | ---------------------------------------- |
| 1.0     | Nov 11, 2025 | Product Team | Initial draft based on discovery session |

---

## Approval & Sign-Off

**Product Owner:** ****\*\*****\_****\*\***** Date: \***\*\_\_\*\***

**Engineering Lead:** ****\*\*****\_****\*\***** Date: \***\*\_\_\*\***

**Design Lead:** ****\*\*****\_****\*\***** Date: \***\*\_\_\*\***

---

## Next Steps

1. **Review this PRD** with stakeholders and gather feedback
2. **Decide on open questions** (map provider, beta cities, brand positioning)
3. **Break down into detailed user stories** for engineering sprint planning
4. **Create design mockups** for key flows (onboarding, feed, route detail)
5. **Set up project management** (Linear, Jira, GitHub Projects)
6. **Kick off Sprint 1** - Let's build!
