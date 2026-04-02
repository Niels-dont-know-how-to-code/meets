# Meets - Student Local Events Map

## Quick Start
```bash
npm run dev    # starts at http://localhost:5173
```

## What Is This
A Waze-inspired web app where students can discover and host local events on an interactive map. Built for the Leuven/Belgium student community. Mobile-first, works on Safari and Chrome.

## Stack
- **Frontend:** React 18 (Vite), TailwindCSS v3
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Map:** React Leaflet + CartoDB Voyager tiles
- **Icons:** Lucide React
- **Dates:** date-fns
- **Geocoding:** Nominatim API (OpenStreetMap)
- **Deployment:** Vercel (with serverless API for OG previews)

## Design System
- **Style:** Waze-inspired, light mode only, colorful, mobile-first
- **Fonts:** `Outfit` (headings/display, font-display), `DM Sans` (body text, font-body)
- **Category Colors:** Party=#E91E63 (pink), Culture=#00BCD4 (teal), Sports=#FF9800 (orange)
- **Accent:** meets-500=#1A85FF (blue) — used for CTAs, active states, links
- **Shadows:** shadow-float (floating controls), shadow-card (cards), shadow-overlay (panels)
- **Animations:** animate-slide-up, animate-fade-in, animate-bounce-in, animate-pulse-heart, animate-stagger-in
- **Component classes:** .btn-primary, .btn-secondary, .card, .overlay-panel, .floating-btn, .category-badge

## Supabase
- **Project ref:** `oosnzahggbgwgtppurqz`
- **Auth:** Email/Password with email confirmation (Supabase sends confirmation emails automatically)
- **Tables:**
  - `events` — id, title, description, date, start_time (timetz), end_time (timetz), lat, lng, address_label, category, organizer_name, created_by_id, created_at, image_url
  - `interests` — id, user_id, event_id, created_at (UNIQUE user_id+event_id)
  - `reports` — id, event_id, reporter_id, reason (max 500 chars), created_at (UNIQUE event_id+reporter_id)
  - `follows` — follower_id, following_id (both FK auth.users, CASCADE), UNIQUE, CHECK(follower != following)
  - `friendships` — user_id, friend_id (FK), status ('pending'|'accepted'), UNIQUE, CHECK(user != friend)
  - `notifications` — user_id, type, title, body, data (jsonb), read (bool), created_at
- **RLS:**
  - events/interests: public read. Auth create (max 5/day). Owners + admins update/delete.
  - follows: public SELECT, auth INSERT/DELETE own.
  - friendships: SELECT where either party is self, INSERT own pending, UPDATE own pending (accept), DELETE own.
  - notifications: SELECT/UPDATE/DELETE own only.
  - reports: auth insert own, admin select/delete.
- **RPCs:**
  - `get_events_with_details(target_date, end_date, user_lat, user_lng, radius_km)` — events with interest counts, creator name, distance (Haversine), verified badge. Auto-hides 3+ reports.
  - `get_organizer_profile(organizer_id)` — display_name, avatar, member_since, is_verified, total_events, total_interests, follower_count, events list
  - `get_friends_interests(target_date)` — event_id, friend_name, friend_avatar for accepted friends
  - `search_user_by_email(search_email)` — returns id, display_name, avatar_url (SECURITY DEFINER)
  - `get_trending_events(from_date, to_date, max_results)` — events with 2+ interests, sorted by count
- **Triggers:**
  - `check_event_limit()` — max 5 events per user per 24h
  - `trg_notify_interest` — notifies event owner when someone shows interest
  - `trg_notify_follow` — notifies when someone follows you
  - `trg_notify_friend` — notifies on friend request / acceptance
- **Storage:** `event-images` bucket (public read, auth upload, owner delete)
- **Admin role:** `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' WHERE id = '<uuid>';`
- **Verified badge:** `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"verified":true}' WHERE id = '<uuid>';`

## Architecture
- **Single-page app**, no router — everything lives on one page
- **Map is full-screen** (100dvh), all UI floats on top with z-index layers (z-10 to z-50)
- **State lives in App.jsx:** selectedDate, endDate, radiusKm, showList, showHostForm, showEventDetail, editingEvent, mapBounds, selectedCategory, activeTab, searchQuery, showAuthModal, showNotifications, showOrganizerProfile, showFriendsList
- **Data flow:** App.jsx -> useEvents(selectedDate, fetchOptions) -> Supabase RPC -> MapView + ListOverlay
- **Social flow:** App.jsx -> useSocial(user, selectedDate) -> follows, friends, organizer profiles
- **Notifications:** App.jsx -> useNotifications(user) -> polls every 30s -> NotificationBell + Panel
- **Filtering:** Category + map bounds + text search + radius (Haversine) + date range — client-side + server-side
- **Optimistic updates:** Heart/interested toggle updates UI immediately, rolls back on error

## File Structure
```
src/
  App.jsx                          <- Main orchestrator, all state + handlers
  main.jsx                         <- Entry point, imports Leaflet CSS
  index.css                        <- Tailwind directives, fonts, custom CSS, Leaflet overrides
  lib/
    supabase.js                    <- Supabase client init
    constants.js                   <- CATEGORIES, colors, DEFAULT_CENTER, DEFAULT_ZOOM
    dateUtils.js                   <- date-fns helpers (formatTime, formatDate, etc.)
    geocoding.js                   <- Nominatim address search
    haptics.js                     <- Vibration API helpers (hapticLight, hapticMedium, hapticSuccess)
  hooks/
    useAuth.js                     <- Email/password auth, profile management, isAdmin
    useEvents.js                   <- Supabase CRUD + interest toggle + fetch with date range/radius/distance
    useGeolocation.js              <- Browser geolocation with Leuven fallback
    useMapBounds.js                <- Track visible map bounds
    useToast.js                    <- Toast notification state
    useSocial.js                   <- Follow/unfollow, friend requests, organizer profiles, friends interests
    useNotifications.js            <- Poll notifications every 30s, mark read, unread count
  components/
    Auth/
      AuthModal.jsx                <- Sign Up / Log In / Forgot Password modal with tabs
      LoginButton.jsx              <- User dropdown (Settings + Friends + Logout) or Login button
      ProfileSettingsModal.jsx     <- Change display name, password
      AuthGuard.jsx                <- Conditional render based on auth state
    Map/
      MapView.jsx                  <- Full-screen Leaflet map
      EventMarker.jsx              <- Category-colored DivIcon markers + popups
      LocationPicker.jsx           <- Address search + click-to-place map for host form
    Layout/
      FloatingControls.jsx         <- List toggle button (top-right)
      DateNavigator.jsx            <- Date nav with range mode (Weekend/7 Days presets)
      CategoryFilter.jsx           <- Horizontal filter chips (All/Party/Culture/Sports)
      RadiusFilter.jsx             <- Toggle pill: "All areas" / "Within 50km"
      CitySearch.jsx               <- Collapsible city search with Nominatim, flies map to city
    List/
      ListOverlay.jsx              <- Side panel: trending + search + tabs + event cards
      EventCard.jsx                <- Event card with verified badge, friend avatars, heart
      SearchBar.jsx                <- Search input with icon
      ListTabs.jsx                 <- "All Events" / "My Interests" tabs
      SkeletonCard.jsx             <- Loading placeholder card
      TrendingSection.jsx          <- Horizontal scroll of popular events (2+ interests)
    Event/
      EventDetailModal.jsx         <- Full detail + report + share + friends interested + organizer link
      HostEventModal.jsx           <- Create/edit form with all fields + LocationPicker + TimePicker
      TimePicker.jsx               <- Custom time picker component
      CategoryBadge.jsx            <- Colored category pill
      InterestedButton.jsx         <- Heart toggle with count
    Social/
      NotificationBell.jsx         <- Bell icon with red unread badge
      NotificationPanel.jsx        <- Dropdown list with type-specific icons, relative time
      OrganizerProfileModal.jsx    <- Organizer stats, follow button, event history
      FriendsList.jsx              <- Pending requests, friend list, add by email
    Toast.jsx                      <- Toast notification (success/error, auto-dismiss)
    CookieConsent.jsx              <- GDPR cookie consent banner
api/
  og.js                            <- Vercel serverless: OG meta tags for share link previews
sql/
  phase4-5-6-schema.sql            <- Social + Notifications + Discovery SQL migration
```

## Key Patterns
- **Times:** HTML time inputs give "HH:MM", Supabase stores "HH:MM:SS+TZ". Append ":00" before insert.
- **Dates:** Selected as Date objects, formatted to "YYYY-MM-DD" via formatDateForApi() for Supabase.
- **Date ranges:** endDate state + fetchOptions passed to useEvents. DateNavigator has range presets.
- **Markers:** Custom L.divIcon with inline SVG icons, category colors, CSS pointer triangle.
- **Auth gating:** When user tries to create event or heart without being logged in, the auth modal opens.
- **Toast notifications:** showToast('message', 'success'|'error') from useToast hook.
- **Display name fallback:** RPC uses: display_name -> user_name -> email prefix.
- **isHappeningNow():** Compares current time against event start/end times to show "LIVE" badge.
- **Stale request guard:** useEvents uses fetchIdRef to discard responses from outdated date fetches.
- **Notification polling:** useNotifications polls every 30s, triggers created by DB triggers (no Edge Functions).
- **Distance filtering:** Haversine formula in pure SQL (no PostGIS), client passes user lat/lng + radius.
- **Friend search:** By email via SECURITY DEFINER RPC (clients can't query auth.users directly).
- **Verified badge:** Admin-granted via SQL (raw_app_meta_data), displayed via BadgeCheck icon.

## Key Features
- **Auth:** Email/password signup with email confirmation, forgot password, change password/display name
- **Map:** CartoDB Voyager tiles (Waze-like), category-colored markers, geolocation, city search, fly-to
- **Events:** CRUD with Nominatim geocoding, custom TimePicker, category filter, "LIVE" badge, image support
- **Social:** Follow organizers, friend requests (send/accept/decline), organizer profiles with stats
- **Notifications:** In-app notifications (interest, follow, friend request/accept), bell with unread count
- **Discovery:** Date range mode (Weekend/7 Days), radius filter (50km), trending events, city search
- **Sharing:** Share event links with OG meta tags for social media previews, Google Maps directions
- **List:** Search, tabs, trending section, loading skeletons, stagger animations, pull-to-refresh
- **UI:** User dropdown with Settings + Friends + Logout, toast notifications, empty states, cookie consent
- **Security:** RLS, rate limiting (5 events/day), input length constraints, auto-hide reported events (3+ reports), report form
- **Error handling:** React ErrorBoundary, stale request guards, optimistic rollbacks

## Environment Variables
```
VITE_SUPABASE_URL=https://oosnzahggbgwgtppurqz.supabase.co
VITE_SUPABASE_ANON_KEY=<from supabase dashboard>
```

### Vercel-only env vars (for api/og.js):
```
SUPABASE_SERVICE_ROLE_KEY=<from supabase dashboard>
```

## Conventions
- Use `font-display` (Outfit) for headings, labels, buttons
- Use `font-body` (DM Sans) for body text, descriptions, inputs
- Use Lucide React icons (import from 'lucide-react')
- Use existing Tailwind custom classes (.btn-primary, .card, .floating-btn, etc.)
- Keep all state in App.jsx, pass down as props
- Use Edit tool for targeted changes, not full file rewrites
