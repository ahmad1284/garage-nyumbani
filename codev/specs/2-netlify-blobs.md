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
Returns all bookings. Optional `?phone=` query param to filter by phone.

### `POST /api/bookings`
Body: `Omit<Booking, 'id' | 'status' | 'createdAt'>`. Creates booking, returns the new `Booking`.

### `PATCH /api/bookings/[id]`
Body: `Partial<Booking>`. Updates fields on a booking. Returns updated `Booking`.

### `GET /api/logs`
Returns all WhatsApp logs.

### `POST /api/logs`
Body: `{ bookingId, phone, message }`. Appends a log entry.

### `GET /api/records`
Returns all service records.

### `POST /api/records`
Body: `Omit<ServiceRecord, 'id'>`. Creates a service record.

## Updated `storageService`

The public method signatures stay identical. Internals change from `localStorage` to `fetch`:

```typescript
// Before
getBookings(): Booking[]                   // sync
saveBooking(...): Booking                  // sync

// After
getBookings(): Promise<Booking[]>          // async
saveBooking(...): Promise<Booking>         // async
```

**Breaking change**: All methods become async. Components currently call them synchronously. UI code will need `await` / `useEffect` / loading state updates.

## Component Impact

| File | Change |
|---|---|
| `src/app/page.tsx` | `handleBook`, `handleSearch` → await storageService calls |
| `src/app/admin/page.tsx` | `useEffect` loads, `handleStatusUpdate`, `handleComplete`, `handleSaveRecord` → await |

Both files already use `async` event handlers in most places. The change is additive.

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
```

No other new runtime dependencies. Dev dependency: `netlify-cli` is already in devDependencies as `firebase-tools`... actually it needs to be added:

```bash
npm install -D netlify-cli
```

## Success Criteria

1. `netlify dev` starts without errors
2. Submitting a booking from the customer page stores it in Netlify Blobs (visible in `netlify blobs:get` or via admin dashboard)
3. Admin dashboard loads bookings from the server (not localStorage)
4. Bookings survive a browser clear / incognito window
5. Updating a booking status from admin is reflected on customer history lookup
6. All existing unit tests pass (or are updated for async signatures)
7. No `localStorage` calls remain in production code

## Risk & Mitigations

| Risk | Mitigation |
|---|---|
| Last-write-wins on concurrent updates | Acceptable for single-admin, low-traffic garage; document as known limitation |
| `netlify dev` required for local Blobs | Add to README / devcontainer setup |
| SSR hydration mismatch (async storage) | UI components already handle empty states; add `isLoading` where needed |
| Admin password hardcoded in client | Out of scope; existing behavior preserved |

## Consultation Log

*(To be filled after consultations)*

---

## Open Questions

1. Should we add a simple `isLoading` state to the admin dashboard, or is optimistic UI sufficient?
2. Should `addLog` remain fire-and-forget or surface errors to the UI?
3. Do we need `netlify dev` documented in the README, or is it obvious from netlify.toml?
