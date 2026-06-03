# Contributing

Thanks for helping improve Meets.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Use a Supabase project with the SQL files from `schema.sql` and `sql/`.

## Quality Checks

Run these before opening a pull request:

```bash
npm run lint
npm run build
```

## Guidelines

- Keep pull requests focused on one user-facing problem.
- Do not commit `.env.local`, service-role keys, screenshots with private data, or generated build output.
- Prefer existing component patterns under `src/components`.
- Keep map, event, auth, and social flows usable on mobile first.
