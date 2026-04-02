# PostHog Setup Report

## Integration Summary

PostHog analytics (`posthog-js`) was integrated into this React + Vite SPA. The SDK is initialized before the React app renders and is available globally via `import posthog from "posthog-js"`.

**SDK:** `posthog-js` (client-side, browser)
**Initialization:** `src/main.tsx`
**Environment variables:** `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`

---

## Events Tracked

| Event | File | Properties |
|---|---|---|
| `user_signed_in` | `src/pages/Login.tsx` | `email` |
| `user_signed_up` | `src/pages/Signup.tsx` | `email` |
| `user_signed_out` | `src/contexts/AuthContext.tsx` | _(none)_ |
| `sale_created` | `src/components/sales/AddSaleForm.tsx` | `line_count`, `channel_id`, `has_customer` |
| `sale_voided` | `src/pages/SaleDetail.tsx` | `sale_id`, `has_reason` |
| `receipt_created` | `src/components/receipts/AddReceiptForm.tsx` | `line_count`, `has_supplier`, `has_reference` |
| `receipt_voided` | `src/pages/ReceiptDetail.tsx` | `receipt_id`, `has_reason` |
| `item_created` | `src/components/modals/AddItemModal.tsx` | `has_description`, `has_category` |

**User identification:** `posthog.identify(userId, { email })` is called on `user_signed_in` and `user_signed_up`. `posthog.reset()` is called on `user_signed_out`.

---

## Dashboard

**"Analytics basics"** — https://us.posthog.com/project/361725/dashboard/1411130

| Insight | Type | Link |
|---|---|---|
| Daily Active Users | Trends | https://us.posthog.com/project/361725/insights/ebfPAy5D |
| Sales & Receipts Activity | Trends | https://us.posthog.com/project/361725/insights/WC1N6DMd |
| Sign-in to Sale Conversion | Funnel | https://us.posthog.com/project/361725/insights/8Q409YuY |
| Void Rate | Trends | https://us.posthog.com/project/361725/insights/yvmvA9U5 |
| New Inventory Items | Trends | https://us.posthog.com/project/361725/insights/eyJhetgA |
