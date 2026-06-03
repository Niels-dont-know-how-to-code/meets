# Meets

Meets is a mobile-first student local events map for discovering, hosting, and sharing things happening around Belgian campuses. It combines a full-screen Leaflet map, Supabase-backed event data, social discovery, friend activity, notifications, and automatic imports from UiTDatabank.

Live app: https://meets-eight.vercel.app

Repository: https://github.com/Niels-dont-know-how-to-code/meets

## Why This Exists

Student events are scattered across group chats, posters, Instagram stories, and campus pages. Meets gives students one map-based view of nearby events and gives organizers a lightweight way to publish activities without needing a full event platform.

The project is open source so other student communities, schools, and local event builders can reuse the map-first UX, Supabase schema, moderation patterns, and Belgian event-import workflow.

## Features

- Interactive map with category-colored event markers
- Event hosting flow with address search and map-based location picking
- Date navigation, category filtering, search, radius filtering, and trending events
- Supabase Auth with profiles, usernames, password reset, and account deletion
- Hearts/interests, friend requests, organizer follows, organizer profiles, and friend activity
- In-app notifications for interests, follows, friend requests, and acceptances
- Event reporting, basic rate limiting, RLS policies, and moderation helpers
- Social share links with Open Graph preview support on Vercel
- Optional UiTDatabank import endpoint for Belgian cultural and local events

## Tech Stack

- React 19 and Vite
- Tailwind CSS
- Supabase Auth, Postgres, RLS, RPCs, and Storage
- React Leaflet and CartoDB Voyager map tiles
- Nominatim/OpenStreetMap geocoding
- Vercel serverless functions

## Quick Start

Requirements:

- Node.js 20 or newer
- npm
- Supabase project credentials

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:5173.

## Environment

Create `.env.local` from `.env.example`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Optional Vercel/serverless variables:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
UITDATABANK_API_KEY=
UITDATABANK_ENV=test
IMPORT_USER_ID=
```

## Database

The Supabase schema and migrations live in `sql/`.

Important files:

- `schema.sql`: base events/interests schema
- `sql/phase4-5-6-schema.sql`: social, notifications, discovery, and reporting
- `sql/security-fixes.sql`: RLS and security hardening
- `sql/cancel-and-delete-account.sql`: account deletion flow
- `sql/add-username.sql`: username search and profile helpers

Apply the schema in Supabase SQL editor or through your preferred migration workflow. Keep Row Level Security enabled.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Roadmap

- Add a public demo dataset for local development without a Supabase account
- Add Playwright smoke tests for search, event creation, auth gates, and map rendering
- Add screenshots and a short demo video to the README
- Improve deployment docs for schools or student associations that want to fork it
- Add issue templates and a contributor-friendly backlog

## Contributing

Contributions are welcome. Please keep changes focused, run `npm run lint` and `npm run build`, and avoid committing secrets or generated build output.

Good first contributions:

- Better empty states and onboarding copy
- Accessibility fixes around map controls and modals
- Demo data and local development setup
- Tests for critical user flows
- Documentation for Supabase setup

## Contributors

- Niels Jansen: creator and primary maintainer
- OpenAI Codex: AI-assisted project revival, documentation, Supabase setup, and security review

## License

MIT. See `LICENSE`.
