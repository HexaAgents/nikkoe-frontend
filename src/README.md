# src/

Root of the React frontend application. Everything the browser loads originates here, from the entry point that mounts the React tree to the route definitions, providers, and global styles.

## How it works

The browser loads `main.tsx`, which initializes PostHog analytics and renders `<App />`. App assembles the full provider tree (React Query, tooltips, toasts, router, auth) and renders `<AppRoutes />`. AppRoutes maps every URL to a page component, wrapping authenticated pages in `<ProtectedRoute>`.

## Why this design

Separating the entry point, provider composition, and route definitions into three files keeps each concern independently readable and avoids a single monolithic file.

## Files

- **main.tsx** -- Application entry point that runs when the browser loads. Initializes PostHog analytics with the API key and host from environment variables, then renders the root `<App />` component into the DOM element with id "root".
- **App.tsx** -- Provider composition root that wraps the entire application in its required context providers: QueryClientProvider (React Query with 30s staleTime, 1 retry, no refetchOnWindowFocus), TooltipProvider, two toast systems (Radix Toaster and Sonner), BrowserRouter, and AuthProvider. Renders `<AppRoutes />` which handles all routing.
- **routes.tsx** -- Defines every URL route in the application. Public routes (`/login`, `/signup`) render without auth; all other routes wrap their page component in `<ProtectedRoute>` which redirects to login if unauthenticated. The `*` catch-all renders the NotFound page.
- **App.css** / **index.css** -- Global styles and Tailwind CSS configuration. `index.css` defines CSS custom properties for theming (colours, border radius) and imports Tailwind's base/components/utilities layers.
