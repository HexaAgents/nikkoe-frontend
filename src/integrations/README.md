# src/integrations/

Third-party service client setup. Currently contains only the Supabase client singleton, which handles JWT session lifecycle management for the frontend.

## How it works

After the backend authenticates a user and returns the JWT, `supabase.auth.setSession()` stores it in `localStorage`. The Supabase client then auto-refreshes the token before it expires, and `src/lib/api.ts` reads the current token from the client on every API request to attach it as a `Bearer` header.

## Why this design

The frontend still needs a Supabase client even though all auth operations go through the backend. Without it, the frontend would need to implement its own token storage, expiry tracking, and refresh logic -- the Supabase client provides all of that out of the box.

## Files

- **supabase/client.ts** -- Creates and exports the Supabase client singleton using the anon key (`VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`). Configures `localStorage` for session persistence and `autoRefreshToken: true` so the JWT is refreshed before expiry. This client is used for exactly two things: (1) storing and refreshing the JWT session after the backend authenticates the user, and (2) providing the current JWT to `src/lib/api.ts` so it can attach it to every API request as a Bearer token.
