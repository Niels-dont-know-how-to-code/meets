# Meets — Feature Roadmap

Tracking remaining feature phases. Check off items as they are completed.

---

## Completed

### Phase 1 — Map & PWA (done)
- [x] Map marker clustering (react-leaflet-cluster)
- [x] PWA install prompt (beforeinstallprompt API)
- [x] Skeleton loading states for map pins

### Phase 2 — Auth & UX Polish (done)
- [x] Double confirm password on sign up
- [x] Show/hide password toggle (Eye/EyeOff)
- [x] Social login — Google & Facebook (Supabase OAuth)

### Phase 3 — Core Features (done)
- [x] Event images (client-side compression via browser-image-compression, Supabase Storage)
- [x] Report/flag system (reports table, auto-hide at 3 reports, reason selection)
- [x] "Add to Google Calendar" button on event detail

---

## Upcoming

### Phase 4 — Social Layer
- [ ] Organizer profiles (public profile page with past events)
- [ ] Follow organizers (get their events surfaced)
- [ ] Friends system (see where friends are interested)
- [ ] Verified organizer badge (admin-granted)

### Phase 5 — Notifications & Sharing
- [ ] Push notifications via Web Push API + Service Worker
- [ ] OpenGraph share previews (meta tags for link sharing)
- [ ] Haptic feedback on mobile interactions (navigator.vibrate)

### Phase 6 — Discovery & Search
- [ ] Search by location area (draw/radius on map)
- [ ] Date range view (see events across multiple days)
- [ ] Trending/popular events section

---

## SQL Migrations Required

Before working on any phase, check `sql/PENDING_MIGRATIONS.md` for SQL changes
that need to be applied in the Supabase Dashboard (SQL Editor). Current pending:

1. Fix interests privacy leak
2. Fix audit log RLS
3. Lower event rate limit (10 → 5/day)
4. Add `image_url` column to events
5. Create `event-images` storage bucket + policies
6. Create `reports` table + RLS policies
7. Update `get_events_with_details` RPC (add image_url, report_count, auto-hide)

## Supabase Dashboard Setup Required

- **Social login:** Enable Google and Facebook providers in Authentication → Providers
  with appropriate client IDs/secrets
- **Storage:** Alternatively create the `event-images` bucket via Dashboard → Storage
  instead of SQL
