# src/integrations/

Third-party service client setup. This directory previously contained the Supabase client singleton for JWT session management. That has been removed — the frontend now stores tokens directly in `localStorage` without any third-party SDK.

## Current state

This directory is empty in application code. The only remaining Supabase client is in `src/test/helpers/test-client.ts`, used exclusively by integration tests to perform CRUD operations against a live Supabase database.

## Why the Supabase client was removed

The frontend previously used `@supabase/supabase-js` to store JWTs, auto-refresh tokens, and listen for auth state changes. This created a direct dependency on a specific Supabase project (URL + anon key baked into the frontend). By moving token storage to plain `localStorage` and token verification to `GET /api/auth/me` on the backend, the frontend has zero knowledge of what database or auth service the backend uses. This makes it possible to swap the backend's database without touching any frontend code.
