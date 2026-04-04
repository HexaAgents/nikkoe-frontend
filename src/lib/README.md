# src/lib/

Shared utility modules used across the entire application. Contains the HTTP client, token management, analytics abstraction, CSS class-name helper, and Excel export function.

## How it works

The central module is `api.ts`, which every hook in `src/hooks/` calls. It reads the JWT from `localStorage`, attaches it as a `Bearer` token, and sends the request to the FastAPI backend. Other modules in this folder provide cross-cutting utilities that multiple components and pages depend on.

## Why this design

`api.ts` has a separate `getList()` method because list endpoints return a `{ data, total }` envelope that needs unwrapping, while detail endpoints return the object directly. `analytics.ts` wraps PostHog to decouple the vendor — if you switch to Mixpanel or Amplitude, only this file changes.

## Files

- **api.ts** -- HTTP client that wraps the Fetch API. Exports token management helpers: `getStoredToken()` reads the JWT from `localStorage`, `setStoredToken(token)` saves it, `clearStoredToken()` removes it. The `apiFetch` function reads the token and attaches it as a `Bearer` header on every request. Handles non-OK responses by parsing the JSON error body and throwing an Error. Exports `api.get()`, `api.getList()` (which unwraps the `{ data, total }` pagination envelope), `api.post()`, `api.put()`, and `api.del()`.
- **analytics.ts** -- Thin abstraction layer over the PostHog SDK. Exports `analytics.identify()` (set user identity after login), `analytics.track()` (log events like sale_created, receipt_voided), and `analytics.reset()` (clear identity on sign-out). Decouples all application code from the PostHog API so the analytics provider can be swapped without touching any component.
- **utils.ts** -- Single utility function `cn()` that merges Tailwind CSS class names using `clsx` + `tailwind-merge`. Handles conditional classes and resolves conflicting Tailwind utilities (e.g. `p-2` and `p-4` on the same element). Used throughout all components and pages.
- **exportToExcel.ts** -- Generates and downloads `.xlsx` files using the ExcelJS library. Accepts a data array, column definitions (key + header), and optional voided-row styling (red text). Creates a date-stamped filename, builds an in-memory workbook, and triggers a browser download via a temporary Blob URL.
