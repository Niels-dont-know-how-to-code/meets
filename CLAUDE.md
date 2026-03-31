# Meets - Student Local Events Map

## Quick Start
```bash
npm run dev    # starts at http://localhost:5173
```

## Stack
- React (Vite) + TailwindCSS v3
- Supabase (Email/Password auth + PostgreSQL)
- React Leaflet (OpenStreetMap)
- Lucide React icons, date-fns

## Supabase
- Project ref: `oosnzahggbgwgtppurqz`
- Tables: `events`, `interests` (with RLS)
- RPC: `get_events_with_details(target_date date)` — returns events with interest counts + creator username
- Auth: Email/Password with email confirmation
- Admin: assign via SQL `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' WHERE id = '<uuid>';`

## Key Files
- `src/App.jsx` — main orchestrator, all state + handlers
- `src/hooks/useEvents.js` — Supabase CRUD + interest toggle
- `src/hooks/useAuth.js` — Email/password auth + session
- `src/components/Auth/AuthModal.jsx` — Sign up / Log in modal with tabs
- `src/components/Map/MapView.jsx` — Leaflet map
- `src/components/Map/EventMarker.jsx` — custom category-colored pins
- `src/components/Event/HostEventModal.jsx` — create/edit form + LocationPicker
- `src/components/List/ListOverlay.jsx` — side panel with search, tabs, cards

## Architecture
- Single-page app, no router
- Map is full-screen, everything else floats on top (z-10 to z-50)
- Category colors: party=#E91E63, culture=#00BCD4, sports=#FF9800
- Fonts: Outfit (display), DM Sans (body)
- Events fetched per date via Supabase RPC, filtered client-side by bounds + category + search

## Environment Variables
```
VITE_SUPABASE_URL=https://oosnzahggbgwgtppurqz.supabase.co
VITE_SUPABASE_ANON_KEY=<from supabase dashboard>
```
