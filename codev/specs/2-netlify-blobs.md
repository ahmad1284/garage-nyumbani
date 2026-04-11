# Spec 2: Port Storage Layer to Netlify Blobs

**Status**: In Progress — Specify Phase  
**Issue**: #5  
**Branch**: `spir/2-netlify-blobs`

---

## Problem

The app currently stores all data in `localStorage` via `src/lib/storage.ts`. This means:

- Data is **per-device** — a customer's booking on their phone is invisible from a different browser
- Data is **lost** on browser clear or private browsing
- The **admin dashboard** cannot see bookings from other devices
- No real persistence for a live garage business
- No future path to multi-user or staff-facing features

## Goal

Replace all `localStorage` reads/writes with **Netlify Blobs** (server-side key-value object storage), accessed from the client via **Next.js API routes**. Data should persist across devices and browsers.

## Scope

### In Scope
- Replace `storageService` internals to call Next.js API routes instead of localStorage
- Create API routes (`/api/bookings`, `/api/logs`, `/api/records`) backed by Netlify Blobs
- Install and configure `@netlify/blobs`
- Update `netlify.toml` for local dev with `netlify dev`
- Maintain existing TypeScript types (`Booking`, `WhatsAppLog`, `ServiceRecord`) unchanged
- Keep the same `storageService` public API shape (method names and signatures) to minimize UI changes

### Out of Scope
- Authentication/authorization on API routes (admin password stays client-side for now)
- Migration/import of existing localStorage data
- Real-time updates (no WebSockets/polling)
- TanStack Query integration (Spec 3)
- Full multi-tenancy

## Current Architecture

```
page.tsx (client)          admin/page.tsx (client)
       │                          │
       └──────────┬───────────────┘
                  ▼
          storageService          ◄── src/lib/storage.ts
                  │
                  ▼
            localStorage          ◄── browser only, no persistence
```

## Target Architecture

```
page.tsx (client)          admin/page.tsx (client)
       │                          │
       └──────────┬───────────────┘
                  ▼
          storageService          ◄── src/lib/storage.ts (updated: fetch-based)
                  │
              fetch()
                  │
                  ▼
     Next.js API Routes           ◄── src/app/api/
     /api/bookings
     /api/bookings/[id]
     /api/logs
     /api/records
                  │
                  ▼
          Netlify Blobs            ◄── @netlify/blobs (server-side)
     Store: "garage-nyumbani"
     Keys: "bookings", "logs", "records"
```

## Data Design

All three data sets are stored as JSON arrays under single keys in one site-scoped store:

| Store | Key | Type |
|---|---|---|
| `garage-nyumbani` | `bookings` | `Booking[]` |
| `garage-nyumbani` | `logs` | `WhatsAppLog[]` |
| `garage-nyumbani` | `records` | `ServiceRecord[]` |

**Rationale**: Mirrors the existing localStorage pattern (single blob per entity type). Simple read-modify-write for a low-traffic app. Suitable to revisit if write concurrency becomes a concern.

**Consistency**: Use `consistency: "strong"` on the store to ensure immediate reads after writes.

## API Routes

### `GET /api/bookings`
Returns all bookings as JSON array.  
Optional `?phone=` query param to filter by phone (server-side filter).  
Response: `200 Booking[]`

### `POST /api/bookings`
Body: `Omit<Booking, 'id' | 'status' | 'createdAt'>`. Creates booking with server-generated ID (`crypto.randomUUID()` preferred over `Math.random()`), status `'New'`, and `createdAt` timestamp.  
Response: `201 Booking`  
Error: `400` on invalid body, `500` on Blobs failure

### `PATCH /api/bookings/[id]`
Body: `Partial<Booking>`. Handles both `updateBookingStatus` and `updateBooking` use cases — any subset of Booking fields can be updated.  
Pattern: read-modify-write (GET array → update matching entry → SET array). Last-write-wins if concurrent.  
Response: `200 Booking` (updated)  
Error: `404` if booking ID not found, `500` on failure

### `GET /api/logs`
Returns all logs.  
Response: `200 WhatsAppLog[]`

### `POST /api/logs`
Body: `{ bookingId: string, phone: string, message: string }`. Appends a log entry.  
Fire-and-forget from client, but API route must return a response.  
Response: `201 WhatsAppLog`  
Error: `500` on failure (surfaced to client as toast)

### `GET /api/records`
Returns all service records.  
Response: `200 ServiceRecord[]`

### `POST /api/records`
Body: `Omit<ServiceRecord, 'id'>`. Creates a service record.  
Response: `201 ServiceRecord`  
Error: `400` on invalid body, `500` on failure

**Empty store**: When a Blobs key doesn't exist yet (first deploy), treat `null` result as `[]`. All GET handlers must implement this fallback.

## Updated `storageService`

Method **names** stay identical. Signatures change from sync to async:

```typescript
// Before
getBookings(): Booking[]                   // sync
saveBooking(...): Booking                  // sync

// After
getBookings(): Promise<Booking[]>          // async
saveBooking(...): Promise<Booking>         // async
```

**Error handling pattern**: On network/server errors, `storageService` methods should throw (not silently return empty arrays). Callers handle errors via `try/catch` and show toasts. This applies to all methods including `addLog`.

All methods become async — UI code needs `await` + loading states where appropriate. The admin dashboard must add an `isLoading` state for the initial data load (bookings, records, logs are now network-bound).

## Component Impact

| File | Location | Change |
|---|---|---|
| `src/app/page.tsx` | `handleBook`, `handleSearch` | `await storageService` calls; add loading state |
| `src/app/admin/page.tsx` | `useEffect` loads, `handleStatusUpdate`, `handleComplete`, `handleSaveRecord` | `await storageService` calls |
| `src/app/admin/page.tsx` | L380, L396 — inline JSX render | **Breaking**: `storageService.getLogs()` is called synchronously in JSX render. Must be moved to `useEffect` with `logs` state, like `bookings` and `records` are already managed. |

The `handleBook`/`handleSearch` handlers are already `async`. The inline `getLogs()` in JSX render is the most significant change — it requires adding a `logs` state variable and a `useEffect` to load it.

## Local Development

Netlify Blobs requires the Netlify runtime. For Next.js (not Vite), use `netlify dev`:

```bash
netlify dev
```

This wraps `next dev` and injects Netlify environment. The `.netlify/` local state directory should be added to `.gitignore`.

No `@netlify/vite-plugin` needed — this is Next.js.

## Dependencies

```bash
npm install @netlify/blobs
npm install -D netlify-cli
```

`@netlify/blobs` — runtime dependency for server-side blob storage.  
`netlify-cli` — dev dependency for local development via `netlify dev`.

## Success Criteria

1. `netlify dev` starts without errors
2. Submitting a booking from the customer page stores it in Netlify Blobs (visible in `netlify blobs:get` or via admin dashboard)
3. Admin dashboard loads bookings from the server (not localStorage)
4. Bookings survive a browser clear / incognito window
5. Updating a booking status from admin is reflected on customer history lookup
6. All existing unit tests pass (updated for async signatures where needed)
7. No `localStorage` calls remain in production code
8. New API route unit tests exist for all 7 endpoints (GET/POST bookings, PATCH booking by id, GET/POST logs, GET/POST records)
9. Playwright smoke test: submit booking → check it appears in admin dashboard (cross-tab persistence)

**Testing tools available**: Jest (unit), Playwright (e2e), zen MCP (AI-assisted review)

## Risk & Mitigations

| Risk | Mitigation |
|---|---|
| Last-write-wins on concurrent updates | Acceptable for single-admin, low-traffic garage; document as known limitation |
| `netlify dev` required for local Blobs | Add to README / devcontainer setup |
| SSR hydration mismatch (async storage) | UI components already handle empty states; add `isLoading` where needed |
| Admin password hardcoded in client | Out of scope; existing behavior preserved |

## Consultation Log

**Claude (Spec review, Round 1)** — `REQUEST_CHANGES` with HIGH confidence

Key issues raised and addressed:
- Inline `getLogs()` calls in JSX render at admin/page.tsx L380/L396 are a breaking async change — flagged in Component Impact table
- No error handling strategy → added: storageService throws, callers use try/catch + toast
- No HTTP status codes → added to all API route definitions
- No test requirements beyond "existing tests pass" → added 8 unit tests + 1 Playwright smoke test
- Open questions unresolved → resolved all three (isLoading: yes, addLog errors: surface them, netlify dev in README: yes)
- Confusing firebase-tools sentence → removed
- "Signatures stay identical" contradiction → corrected to "method names stay identical"

---

## Resolved Questions

1. **`isLoading` state**: Yes — add to admin dashboard. Bookings, records, and logs are now network-bound. Show a loading spinner or skeleton on initial load.
2. **`addLog` error handling**: Surface errors. `storageService` throws on failure; callers catch and show a toast.
3. **`netlify dev` in README**: Yes — update README with local dev instructions for Netlify Blobs.

## Security Note (Future Work)

All API routes are currently unprotected — anyone who discovers them can read customer PII (names, phone numbers). A follow-up spec (Spec 3 or separate) should add a server-side API key check or move admin auth to middleware. This is accepted risk for now.
