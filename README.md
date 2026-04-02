# nikkoe-frontend

React SPA for the Nikkoe inventory management platform.

## Setup

```bash
npm install
npm run dev
```

The app starts on `http://localhost:8080`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (default: `http://localhost:3000/api`) |
| `VITE_SUPABASE_URL` | Supabase project URL (used only for auth) |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon key (used only for auth) |
| `VITE_POSTHOG_KEY` | PostHog analytics key |
| `VITE_POSTHOG_HOST` | PostHog host URL |

## Architecture

This frontend communicates with the **nikkoe-backend** Express API for all data operations. Supabase is used client-side **only** for authentication (login, signup, session management). The JWT from Supabase Auth is forwarded as a Bearer token to the backend on every API request.

All data-fetching hooks in `src/hooks/` use the `api` helper from `src/lib/api.ts` which handles token forwarding automatically.
