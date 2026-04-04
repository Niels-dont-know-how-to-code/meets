# Meets - Student Local Events Map

## Quick Start
```bash
npm run dev    # starts at http://localhost:5173
```

## What Is This
A Waze-inspired web app where students can discover and host local events on an interactive map. Built for the Leuven/Belgium student community. Mobile-first, works on Safari and Chrome.

## Stack
- **Frontend:** React 19 (Vite 8), TailwindCSS v3
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Storage)
- **Map:** React Leaflet + OpenStreetMap tiles + react-leaflet-cluster
- **Icons:** Lucide React
- **Dates:** date-fns
- **Geocoding:** Nominatim API (OpenStreetMap)
- **Image compression:** browser-image-compression
- **Testing:** Vitest + @testing-library/react + jsdom (148 tests)

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
- **Auth:** Email/Password with email confirmation + Google/Facebook OAuth (Supabase sends confirmation emails automatically)
- **Storage:** `event-images` public bucket for event photos (see sql/PENDING_MIGRATIONS.md)
- **Tables:**
  - `events` — id, title, description, date, start_time (timetz), end_time (timetz), lat, lng, address_label, category, organizer_name, created_by_id, created_at, image_url
  - `interests` — id, user_id, event_id, created_at (UNIQUE user_id+event_id)
  - `reports` — id, event_id, user_id, reason, created_at (UNIQUE event_id+user_id) — see sql/PENDING_MIGRATIONS.md
- **RLS:** Public read for events. Auth users create events. Owners + admins can update/delete. Auth users insert/delete own interests. Auth users insert own reports. Admins manage reports.
- **RPC:** `get_events_with_details(target_date date)` — joins events with interest counts, report counts, creator display name. Auto-hides events with 3+ reports.
- **Admin role:** Assign via SQL: `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' WHERE id = '<uuid>';`

## Architecture
- **Single-page app**, no router — everything lives on one page
- **Map is full-screen** (100dvh), all UI floats on top with z-index layers (z-10 to z-50)
- **State lives in App.jsx:** selectedDate, showList, showHostForm, showEventDetail, editingEvent, mapBounds, selectedCategory, activeTab, searchQuery, showAuthModal, showSettings, mapFlyTarget, pendingEventId
- **Hooks in App.jsx:** useAuth, useGeolocation, useEvents, useToast, useReports, useInstallPrompt
- **Data flow:** App.jsx → useEvents(selectedDate) → fetches from Supabase RPC → passes events to MapView + ListOverlay
- **Filtering:** Category filter + map bounds filter + text search — all client-side on fetched events
- **Share links:** `?event=<id>` URL param opens event detail on load via pendingEventId
- **Optimistic updates:** Heart/interested toggle updates UI immediately, rolls back on error

## File Structure
```
src/
  App.jsx                          ← Main orchestrator, all state + handlers
  main.jsx                         ← Entry point, imports Leaflet CSS
  index.css                        ← Tailwind directives, fonts, custom CSS, Leaflet overrides
  lib/
    supabase.js                    ← Supabase client init (throws on missing env vars)
    constants.js                   ← CATEGORIES, colors, DEFAULT_CENTER, DEFAULT_ZOOM
    dateUtils.js                   ← date-fns helpers (formatTime, formatDate, etc.)
    geocoding.js                   ← Nominatim address search
    imageUtils.js                  ← compressImage, uploadEventImage, deleteEventImage (Supabase Storage)
    calendarUtils.js               ← buildGoogleCalendarUrl (Google Calendar link builder)
  hooks/
    useAuth.js                     ← Email/password auth + signInWithProvider (OAuth)
    useEvents.js                   ← Supabase CRUD + interest toggle + fetch by date + report_count filter
    useGeolocation.js              ← Browser geolocation with Leuven fallback
    useMapBounds.js                ← Track visible map bounds
    useToast.js                    ← Toast notification state
    useReports.js                  ← Report/flag events (fetchUserReports, reportEvent)
    useInstallPrompt.js            ← PWA beforeinstallprompt capture + localStorage dismiss
  components/
    Auth/
      AuthModal.jsx                ← Sign Up / Log In modal with tabs, confirm password, show/hide toggle, social login
      LoginButton.jsx              ← Floating login button / user avatar
      ProfileSettingsModal.jsx     ← Profile settings: update display name, avatar, password
    Map/
      MapView.jsx                  ← Full-screen Leaflet map with MarkerClusterGroup
      MapSkeleton.jsx              ← Pulsing ghost pin placeholders while loading
      EventMarker.jsx              ← Category-colored DivIcon markers + popups
      LocationPicker.jsx           ← Address search + click-to-place map for host form
    Layout/
      FloatingControls.jsx         ← List toggle button (top-right)
      DateNavigator.jsx            ← Prev/next arrows + date picker (top-left)
      CategoryFilter.jsx           ← Horizontal filter chips (All/Party/Culture/Sports)
    List/
      ListOverlay.jsx              ← Side panel: search + tabs + event cards + loading skeletons
      EventCard.jsx                ← Event card with title, time, badge, heart, image thumbnail
      SearchBar.jsx                ← Search input with icon
      ListTabs.jsx                 ← "All Events" / "My Interests" tabs
      SkeletonCard.jsx             ← Loading placeholder card
    Event/
      EventDetailModal.jsx         ← Full event detail + edit/delete + report + Google Calendar + image
      HostEventModal.jsx           ← Create/edit form with all fields + LocationPicker + image upload
      CategoryBadge.jsx            ← Colored category pill
      InterestedButton.jsx         ← Heart toggle with count
      TimePicker.jsx               ← Custom time picker (touch-friendly, coarse pointer detection)
    ErrorBoundary.jsx              ← React error boundary wrapper
    Toast.jsx                      ← Toast notification (success/error, auto-dismiss)
    InstallPrompt.jsx              ← PWA "Add to Home Screen" floating banner
  test/
    setup.js                       ← Vitest setup: window.matchMedia polyfill for jsdom
```

## Key Patterns
- **Times:** HTML time inputs give "HH:MM", Supabase stores "HH:MM:SS+TZ". Append ":00" before insert.
- **Dates:** Selected as Date objects, formatted to "YYYY-MM-DD" via formatDateForApi() for Supabase.
- **Markers:** Custom L.divIcon with inline SVG icons, category colors, CSS pointer triangle.
- **Auth gating:** When user tries to create event, heart, or report without being logged in, the auth modal opens.
- **Toast notifications:** showToast('message', 'success'|'error') from useToast hook.
- **Image upload:** Client-side compression (max 1MB, 1200px) → Supabase Storage. Image URL stored in events table.
- **Report/flag:** Users report events with a reason. Events with 3+ reports auto-hidden (client filter + SQL).
- **Google Calendar:** buildGoogleCalendarUrl() generates pre-filled Google Calendar links from event data.

## Known Limitations
- No Supabase Realtime — manual refresh only
- No password reset flow yet
- Categories are hardcoded (party, culture, sports)
- Social login (Google/Facebook) requires enabling providers in Supabase Dashboard
- SQL migrations in `sql/PENDING_MIGRATIONS.md` must be applied manually in Supabase SQL Editor
- See `ROADMAP.md` for planned features (Phases 4–6)

## Environment Variables
```
VITE_SUPABASE_URL=https://oosnzahggbgwgtppurqz.supabase.co
VITE_SUPABASE_ANON_KEY=<from supabase dashboard>
```

## Conventions
- Use `font-display` (Outfit) for headings, labels, buttons
- Use `font-body` (DM Sans) for body text, descriptions, inputs
- Use Lucide React icons (import from 'lucide-react')
- Use existing Tailwind custom classes (.btn-primary, .card, .floating-btn, etc.)
- Keep all state in App.jsx, pass down as props
- Use Edit tool for targeted changes, not full file rewrites
- Run `npm test` before committing — 148 tests must pass

## Changelog (for session continuity)

### Phase 1 — Map & PWA
- Added `react-leaflet-cluster` for marker clustering in `MapView.jsx`
- Added `MapSkeleton.jsx` (ghost pins while loading)
- Added `InstallPrompt.jsx` + `useInstallPrompt.js` (PWA install banner)

### Phase 2 — Auth & UX Polish
- Rewrote `AuthModal.jsx`: confirm password on signup, Eye/EyeOff toggle, Google/Facebook OAuth buttons
- Added `signInWithProvider(provider)` to `useAuth.js`

### Phase 3 — Core Features
- **Event images:** `imageUtils.js` (compress + upload to Supabase Storage), image picker in `HostEventModal`, display in `EventDetailModal` + `EventCard`
- **Reports:** `useReports.js` hook, Report button + reason menu in `EventDetailModal`, client-side 3-report filter in `useEvents.js`
- **Google Calendar:** `calendarUtils.js` (URL builder), Calendar button in `EventDetailModal`
- **SQL migrations:** 7 pending in `sql/PENDING_MIGRATIONS.md` (interests fix, audit log, rate limit, image_url, storage bucket, reports table, RPC update)

### Security Hardening (pre-Phase 1)
- Input sanitization, env var validation, RLS fixes, rate limiting, audit log lockdown
- See `sql/security-fixes.sql` and `sql/PENDING_MIGRATIONS.md`

### Testing
- 148 tests across 18 files (Vitest + @testing-library/react)
- All hooks, utilities, and key components covered
