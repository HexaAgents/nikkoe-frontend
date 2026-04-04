# nikkoe-frontend

React single-page application for the Nikkoe inventory management platform. Built with TypeScript, Vite, React Query, and shadcn/ui. The frontend talks to a Python FastAPI backend for all data and authentication operations -- it never calls Supabase Auth or the database directly. The Supabase client exists solely to store the JWT in `localStorage` and auto-refresh it before expiry.

## How it works

1. The user performs an action (e.g. clicks "Add Receipt").
2. The page component calls a React Query hook from `src/hooks/`.
3. The hook calls a method on `src/lib/api.ts` (`api.post()`, `api.get()`, etc.).
4. `api.ts` reads the JWT from the Supabase session and attaches it as a `Bearer` token.
5. The request hits the FastAPI backend, which validates the token, executes the operation against the database, and returns the result.
6. React Query caches the response and re-renders the component.

## Why this design

All business logic and data access goes through the backend so it remains the single source of truth. This keeps credentials, validation rules, and authorization checks server-side where they cannot be bypassed by the browser.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in the required values (see below).
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:8080` in your browser.

## Environment Variables

- `VITE_API_URL` — Backend API base URL (defaults to `http://localhost:3000/api`).
- `VITE_SUPABASE_URL` — Supabase project URL. Used only for JWT session storage, not for direct auth or database calls.
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — Supabase anon key. Same constraint as above.
- `VITE_POSTHOG_KEY` — PostHog analytics project key.
- `VITE_POSTHOG_HOST` — PostHog host URL.

## Files

- **main.tsx** -- Application entry point that runs when the browser loads. Initializes PostHog analytics with the API key and host from environment variables, then renders the root `<App />` component into the DOM element with id "root".
- **App.tsx** -- Provider composition root that wraps the entire application in its required context providers: QueryClientProvider (React Query with 30s staleTime, 1 retry, no refetchOnWindowFocus), TooltipProvider, two toast systems (Radix Toaster and Sonner), BrowserRouter, and AuthProvider. Renders `<AppRoutes />` which handles all routing.
- **routes.tsx** -- Defines every URL route in the application. Public routes (`/login`, `/signup`) render without auth; all other routes wrap their page component in `<ProtectedRoute>` which redirects to login if unauthenticated. The `*` catch-all renders the NotFound page.
- **App.css** / **index.css** -- Global styles and Tailwind CSS configuration. `index.css` defines CSS custom properties for theming (colours, border radius) and imports Tailwind's base/components/utilities layers.

## Testing

```bash
npm test          # Unit + e2e tests (fast, no credentials needed)
npm run test:all  # Unit + e2e + integration tests
```

The test suite has three layers:

- **Unit tests** (`src/test/unit/`) — test isolated modules (api client, analytics, utilities) with mocked dependencies.
- **E2E user interaction tests** (`src/test/e2e/`) — 36 tests that render real React components with mocked auth/API and simulate user actions (clicking buttons, typing into forms, verifying validation errors). Covers login, signup, protected routes, create sale, create receipt, and change password flows.
- **Integration tests** (`src/test/integration/`) — test real CRUD operations against a live Supabase database. Requires `.env.test` credentials.

See `src/test/README.md` for detailed documentation of every test file and test case.
