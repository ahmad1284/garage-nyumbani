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
- **Admin API authentication**: protect write/admin endpoints with a server-side password check via `ADMIN_PASSWORD` Netlify environment variable
- Install and configure `@netlify/blobs`
- Update `netlify.toml` for local dev with `netlify dev`
- Maintain existing TypeScript types (`Booking`, `WhatsAppLog`, `ServiceRecord`) unchanged
- Keep the same `storageService` public API shape (method names and signatures) to minimize UI changes

### Out of Scope
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
       │                     │  Auth: Bearer token in sessionStorage
       │                     │  Login: POST /api/auth → token
       └──────────┬───────────┘
                  ▼
          storageService          ◄── src/lib/storage.ts (updated: fetch-based)
                  │
              fetch()  [+ Authorization header for admin calls]
                  │
                  ▼
     Next.js API Routes           ◄── src/app/api/
     /api/auth            (public — validates ADMIN_PASSWORD, returns session token)
     /api/logout          (admin-only — deletes session token from Blobs)
     /api/bookings        (POST: public, GET: public)
     /api/bookings/[id]   (PATCH: admin-only)
     /api/logs            (GET: public, POST: admin-only)
     /api/records         (GET: public, POST: admin-only)
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

**Client-side exposure**: `storageService.getBookings()` gains an optional `phone?: string` parameter. When provided, it passes `?phone=<value>` to the API route. This replaces the existing client-side filter in `handleSearch`.

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

## Admin Authentication

The admin password moves from a hardcoded client-side string (`'admin123'`) to a server-side environment variable.

**Flow:**
1. Admin submits password on the login page
2. Client POSTs to `/api/auth` with `{ password }`
3. API route compares against `process.env.ADMIN_PASSWORD`
4. On match: generates a `crypto.randomUUID()` session token, stores it in Netlify Blobs under key `admin-session:<uuid>` with value `{ createdAt }`, returns `{ token: uuid }` to the client
5. Client stores token in `sessionStorage`
6. All admin write requests include `Authorization: Bearer <token>` header
7. API route middleware looks up the token in Blobs, checks it exists and is not expired (TTL: 8 hours)
8. `/api/logout` deletes the session token from Blobs, clearing the session

**Why not password-as-token**: The raw `ADMIN_PASSWORD` as a bearer token would be visible in browser DevTools on every request, and would be replayable indefinitely if captured. Session tokens are short-lived and revocable.

**Protected endpoints** (require auth token):
- `PATCH /api/bookings/[id]` — admin-only status updates
- `POST /api/logs` — admin-only log entries
- `POST /api/records` — admin-only service records

**Public endpoints** (no auth required):
- `POST /api/bookings` — customers submit bookings
- `GET /api/bookings?phone=` — customers look up their own history
- `GET /api/records`, `GET /api/logs` — read-only (acceptable for now; can restrict later)

**New API routes for auth:**
- `POST /api/auth` — validate password, return session token. Response: `200 { token }` or `401`
- `POST /api/logout` — delete session token from Blobs. Requires `Authorization: Bearer <token>`

**Environment variable**: Set `ADMIN_PASSWORD` via Netlify dashboard → Site settings → Environment variables. For local dev, add to `.env.local` (gitignored).

**Session store**: Sessions stored in the same `garage-nyumbani` Blobs store under keys prefixed `admin-session:`. TTL checked at verification time (no automatic expiry in Blobs — compare `createdAt + 8h` against `Date.now()`).

**Token check helper**: A shared `verifyAdminToken(request: Request): Promise<boolean>` utility used by all protected routes.

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
| `src/app/page.tsx` | `handleBook`, `handleSearch` | Both are sync — must become `async`, add `await storageService` calls + `try/catch` + loading state |
| `src/app/admin/page.tsx` | `useEffect` loads, `handleStatusUpdate`, `handleComplete` | Add `await` to storageService calls |
| `src/app/admin/page.tsx` | L658 — inline `onSubmit` on the manual record form | Inline handler calls `storageService.saveServiceRecord()` — must become async and await |
| `src/app/admin/page.tsx` | L380, L396 — inline JSX render | **Breaking**: `storageService.getLogs()` called synchronously in JSX render. Must be moved to `useEffect` with `logs` state variable. |

`handleBook` and `handleSearch` in `page.tsx` are **not** async — both need to become `async` and gain `await` + `try/catch`. The inline `getLogs()` in JSX render is the most structurally significant change — it requires adding a `logs` state variable and a `useEffect` to load it.

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
6. Admin login uses `ADMIN_PASSWORD` env var — wrong password returns `401`, correct password returns a UUID session token
7. Session token stored in Netlify Blobs, expires after 8 hours
8. Unauthenticated PATCH/POST to admin endpoints returns `401`
9. Logout deletes session token from Blobs; subsequent requests with that token return `401`
8. All existing unit tests pass (updated for async signatures where needed)
9. New API route unit tests exist for all endpoints including `/api/auth`
10. Playwright MCP verification: submit booking → check it appears in admin dashboard (cross-tab persistence)

**Testing tools**: Jest (unit tests), Playwright MCP (browser-based visual verification — used to check the app is working, not as a CLI test runner), zen MCP (AI consultation via Gemini)

## Risk & Mitigations

| Risk | Mitigation |
|---|---|
| Last-write-wins on concurrent updates | Acceptable for single-admin, low-traffic garage; document as known limitation |
| `netlify dev` required for local Blobs | Add to README / devcontainer setup |
| SSR hydration mismatch (async storage) | UI components already handle empty states; add `isLoading` where needed |
| Admin password hardcoded in client | **Mitigated**: moved to `ADMIN_PASSWORD` env var, verified server-side |
| `ADMIN_PASSWORD` not set in local dev | Document: add to `.env.local`; API routes return `503` with clear error if var is missing |

## Consultation Log

**Gemini 2.5 Flash (Spec review, Round 3, via zen MCP)** — `REQUEST_CHANGES` with HIGH confidence

Key issue raised and addressed:
- Using raw `ADMIN_PASSWORD` as bearer token exposes the secret in browser DevTools and allows indefinite replay attacks → redesigned to UUID session tokens stored in Blobs with 8h TTL + explicit `/api/logout` endpoint

**Claude (Spec review, Round 2)** — `COMMENT` with HIGH confidence (no blockers)

Key issues raised and addressed:
- `handleBook`/`handleSearch` are sync, not async — corrected in Component Impact table
- Phone filter client-side exposure undefined → added optional `phone?` param to `getBookings()`
- Auth token design ambiguous → resolved: use `ADMIN_PASSWORD` as bearer token directly
- `.env.local` and `.netlify/` not in `.gitignore` → added both
- `handleSaveRecord` doesn't exist — it's an inline `onSubmit` at L658 → corrected

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

## Security

Admin authentication is **in scope** for this spec:
- `ADMIN_PASSWORD` stored as a Netlify environment variable, never in source code or network traffic
- Login generates a UUID session token stored in Blobs (TTL 8h) — the password itself is never sent to the client
- All admin write endpoints protected by session token verification
- Customer-submitted bookings remain public (no auth needed to book a service)
- `.env.local` is gitignored; `ADMIN_PASSWORD` set via Netlify dashboard for production
- Logout endpoint deletes the session token, enabling proper session revocation

Accepted limitations for now:
- Public GET endpoints expose booking data to anyone with the URL — acceptable for this garage's scale
- No rate limiting on public endpoints
- Session token is `sessionStorage`-based (cleared on tab close); server-side token also expires after 8h
