# src/contexts/

React context providers for app-wide state. Currently contains only the authentication context, which wraps the entire application and provides session state and auth methods to every component.

## How it works

1. On app load, `AuthProvider` calls `supabase.auth.getSession()` to check for an existing JWT in `localStorage` and subscribes to `onAuthStateChange` for token refresh events.
2. When the user logs in, `signIn()` sends credentials to the backend's `POST /api/auth/login`, receives the JWT, and stores it via `supabase.auth.setSession()`.
3. The `onAuthStateChange` listener fires, updating `session` and `user` state in the context, which triggers a re-render and allows `ProtectedRoute` to grant access.
4. The Supabase client handles auto-refreshing the token before expiry, keeping the session alive without user interaction.

## Why this design

All auth goes through the backend so the frontend never handles credentials directly. The Supabase client is still needed for JWT lifecycle management -- storage in localStorage, auto-refresh before expiry, and making the token available for `api.ts` to read.

## Files

- **AuthContext.tsx** -- Authentication provider that wraps the entire application. Manages `session` and `user` React state via Supabase's `onAuthStateChange` listener. Exposes four methods: `signIn(email, password)` calls the backend's `POST /api/auth/login`, receives the JWT, and stores it via `supabase.auth.setSession()`; `signUp(email, password)` calls `POST /api/auth/signup`; `signOut()` clears the local session and fires analytics events; `changePassword(currentPassword, newPassword)` calls `POST /api/auth/change-password` with the JWT attached.
