# Deployed end-to-end verification

This Playwright suite verifies the real deployed path:

```text
Vercel frontend preview -> Vercel backend preview -> isolated Supabase staging
```

It does not write to production. The test:

- signs in through the deployed frontend;
- asserts API traffic uses the configured deployed backend;
- opens the TOBU3 and NORPS-12 null-quote regression fixtures;
- creates and edits a uniquely prefixed temporary item;
- exercises receipt, transfer, sale, and void operations;
- reloads the browser between operations to prove persistence; and
- removes temporary database rows in a `finally` cleanup.

## Required environment variables

- `E2E_FRONTEND_URL`
- `E2E_API_URL` (must include `/api`)
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`
- `E2E_FRONTEND_BYPASS`
- `E2E_BACKEND_BYPASS`
- `E2E_SUPABASE_URL`
- `E2E_SUPABASE_SERVICE_ROLE_KEY` (cleanup only)

Run with:

```bash
npm run test:deployed
```

GitHub Actions runs the same command from the manually dispatched
`Deployed E2E` workflow and uploads traces, screenshots, and video on failure.
