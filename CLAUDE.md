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
- **Map:** React Leaflet + OpenStreetMap tiles
- **Icons:** Lucide React
- **Dates:** date-fns
- **Geocoding:** Nominatim API (OpenStreetMap)

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
  - `events` — id, title, description, date, start_time (timetz), end_time (timetz), lat, lng, address_label, category, organizer_name, created_by_id, created_at
  - `interests` — id, user_id, event_id, created_at (UNIQUE user_id+event_id)
- **RLS:** Public read for events/interests. Auth users create events. Owners + admins can update/delete. Auth users insert/delete own interests.
- **RPC:** `get_events_with_details(target_date date)` — joins events with interest counts + creator display name
- **Admin role:** Assign via SQL: `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' WHERE id = '<uuid>';`

## Architecture
- **Single-page app**, no router — everything lives on one page
- **Map is full-screen** (100dvh), all UI floats on top with z-index layers (z-10 to z-50)
- **State lives in App.jsx:** selectedDate, showList, showHostForm, showEventDetail, editingEvent, mapBounds, selectedCategory, activeTab, searchQuery, showAuthModal
- **Data flow:** App.jsx → useEvents(selectedDate) → fetches from Supabase RPC → passes events to MapView + ListOverlay
- **Filtering:** Category filter + map bounds filter + text search — all client-side on fetched events
- **Optimistic updates:** Heart/interested toggle updates UI immediately, rolls back on error

## File Structure
```
src/
  App.jsx                          ← Main orchestrator, all state + handlers
  main.jsx                         ← Entry point, imports Leaflet CSS
  index.css                        ← Tailwind directives, fonts, custom CSS, Leaflet overrides
  lib/
    supabase.js                    ← Supabase client init
    constants.js                   ← CATEGORIES, colors, DEFAULT_CENTER, DEFAULT_ZOOM
    dateUtils.js                   ← date-fns helpers (formatTime, formatDate, etc.)
    geocoding.js                   ← Nominatim address search
  hooks/
    useAuth.js                     ← Email/password auth (signUp, signIn, signOut, displayName, isAdmin)
    useEvents.js                   ← Supabase CRUD + interest toggle + fetch by date
    useGeolocation.js              ← Browser geolocation with Leuven fallback
    useMapBounds.js                ← Track visible map bounds
    useToast.js                    ← Toast notification state
  components/
    Auth/
      AuthModal.jsx                ← Sign Up / Log In modal with tabs, email confirmation message
      LoginButton.jsx              ← Floating login button / user avatar
      AuthGuard.jsx                ← Conditional render based on auth state
    Map/
      MapView.jsx                  ← Full-screen Leaflet map
      EventMarker.jsx              ← Category-colored DivIcon markers + popups
      LocationPicker.jsx           ← Address search + click-to-place map for host form
    Layout/
      FloatingControls.jsx         ← List toggle button (top-right)
      DateNavigator.jsx            ← Prev/next arrows + date picker (top-left)
      CategoryFilter.jsx           ← Horizontal filter chips (All/Party/Culture/Sports)
    List/
      ListOverlay.jsx              ← Side panel: search + tabs + event cards + loading skeletons
      EventCard.jsx                ← Event card with title, time, badge, heart
      SearchBar.jsx                ← Search input with icon
      ListTabs.jsx                 ← "All Events" / "My Interests" tabs
      SkeletonCard.jsx             ← Loading placeholder card
    Event/
      EventDetailModal.jsx         ← Full event detail + edit/delete for owner/admin
      HostEventModal.jsx           ← Create/edit form with all fields + LocationPicker
      CategoryBadge.jsx            ← Colored category pill
      InterestedButton.jsx         ← Heart toggle with count
    Toast.jsx                      ← Toast notification (success/error, auto-dismiss)
```

## Key Patterns
- **Times:** HTML time inputs give "HH:MM", Supabase stores "HH:MM:SS+TZ". Append ":00" before insert.
- **Dates:** Selected as Date objects, formatted to "YYYY-MM-DD" via formatDateForApi() for Supabase.
- **Markers:** Custom L.divIcon with inline SVG icons, category colors, CSS pointer triangle.
- **Auth gating:** When user tries to create event or heart without being logged in, the auth modal opens.
- **Toast notifications:** showToast('message', 'success'|'error') from useToast hook.

## Known Limitations (V1)
- No event images
- No Supabase Realtime — manual refresh only
- No password reset flow yet
- No social login (removed GitHub OAuth in favor of email/password)
- Categories are hardcoded (party, culture, sports)
- No map clustering for many events

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
