# src/contexts/

React context providers for app-wide state. Currently contains only the authentication context, which wraps the entire application and provides session state and auth methods to every component.

## How it works

1. On app load, `AuthProvider` checks `localStorage` for a stored JWT token. If found, it calls `GET /api/auth/me` on the backend to verify the token is still valid and loads the user profile.
2. When the user logs in, `signIn()` sends credentials to the backend's `POST /api/auth/login`, receives the JWT, and stores it in `localStorage` via `setStoredToken()`.
3. The `user` and `session` React state update, which triggers a re-render and allows `ProtectedRoute` to grant access.
4. On sign-out, `clearStoredToken()` removes the JWT from `localStorage` and resets the React state.

## Why this design

All auth goes through the backend — the frontend never talks to Supabase or any auth service directly. Tokens are stored in plain `localStorage` with no third-party SDK dependency. This means the backend's auth provider can be swapped (e.g. moving to a different Supabase project or a different auth service entirely) without changing any frontend code.

## Files

- **AuthContext.tsx** -- Authentication provider that wraps the entire application. Manages `session` and `user` React state. On mount, reads the token from `localStorage` and verifies it via `GET /api/auth/me`. Exposes four methods: `signIn(email, password)` calls `POST /api/auth/login` and stores the returned token; `signUp(email, password)` calls `POST /api/auth/signup`; `signOut()` clears `localStorage` and fires analytics events; `changePassword(currentPassword, newPassword)` calls `POST /api/auth/change-password` with the token attached.
