# Plan 2: Port Storage Layer to Netlify Blobs

**Status**: Draft  
**Spec**: `codev/specs/2-netlify-blobs.md`  
**Issue**: #5  
**Branch**: `spir/2-netlify-blobs`

---

## phases_json
```json
{
  "phases": [
    { "id": "setup", "title": "Setup — dependencies, helpers, auth utilities" },
    { "id": "api-routes", "title": "API Routes — all endpoints backed by Netlify Blobs" },
    { "id": "client-integration", "title": "Client Integration — async storageService + UI wiring" },
    { "id": "tests", "title": "Tests — unit tests for API routes, Playwright verification" }
  ]
}
```

---

## Phase 1: Setup
**Status**: pending  
**Objective**: Install dependencies, create the Blobs store helper, and build the auth utility used by all protected routes.

### Deliverables

1. **Install dependencies**
   ```bash
   npm install @netlify/blobs
   npm install -D netlify-cli
   ```

2. **`src/lib/blobs.ts`** (new file)
   - Export `getGarageStore()` — returns a site-scoped Netlify Blobs store named `"garage-nyumbani"` with `consistency: "strong"`
   - Typed helpers:
     ```typescript
     getGarageStore(): Store
     ```
   - All API routes import this; never call `getStore()` directly in route files

3. **`src/lib/auth.ts`** (new file)
   - `verifyAdminToken(request: Request): Promise<boolean>` — reads `Authorization: Bearer <token>` header, looks up token key `admin-session:<token>` in Blobs, checks `createdAt + 8h > Date.now()`
   - `createAdminSession(): Promise<string>` — generates `crypto.randomUUID()`, writes `{ createdAt: Date.now() }` to Blobs under `admin-session:<uuid>`, returns the uuid
   - `deleteAdminSession(token: string): Promise<void>` — deletes `admin-session:<token>` from Blobs
   - Returns `false` / rejects on any error (missing token, expired, Blobs failure)

4. **`src/lib/storage.ts`** — add token management
   - Add module-level: `let _adminToken: string | null = null`
   - Export `setAdminToken(token: string | null): void` — stores token in module variable and syncs to `sessionStorage`
   - Export `getAdminToken(): string | null` — reads from module variable (falls back to `sessionStorage` on reload)
   - Admin page calls `setAdminToken(token)` after login; storageService reads it when making admin fetch calls

5. **Update `.env.local`** (gitignored)
   ```
   ADMIN_PASSWORD=your-dev-password
   ```

6. **Update `netlify.toml`** — add `[dev]` section to set the target port:
   ```toml
   [dev]
   command = "npm run dev"
   targetPort = 3000
   ```

7. **Update `README.md`** — add a "Local Development" section documenting:
   - Requires `netlify-cli` installed
   - Copy `.env.local.example` → `.env.local`, set `ADMIN_PASSWORD`
   - Run `netlify dev` instead of `npm run dev` when working with Blobs

8. **Remove `firebase-tools`** from devDependencies — it's unused and large:
   ```bash
   npm uninstall firebase-tools
   ```

### Success Criteria
- `npm run build` passes (no TypeScript errors)
- `netlify dev` starts and Next.js is accessible
- `getGarageStore()` and `verifyAdminToken()` are importable without runtime errors
- README has local dev instructions

---

## Phase 2: API Routes
**Status**: pending  
**Objective**: Create all API route handlers. Each route reads/writes Netlify Blobs. No UI changes yet.  
**Depends on**: Phase 1 (blobs.ts, auth.ts must exist)

### Deliverables

**`src/app/api/auth/route.ts`**
- `POST` — reads `{ password }` from body, compares to `process.env.ADMIN_PASSWORD`
  - Match: calls `createAdminSession()`, returns `200 { token }`
  - No match: `401 { error: "Invalid password" }`
  - `ADMIN_PASSWORD` not set: `503 { error: "Auth not configured" }`

**`src/app/api/logout/route.ts`**
- `POST` — requires auth (`verifyAdminToken`), calls `deleteAdminSession(token)`, returns `200`
  - Unauth: `401`

**`src/app/api/bookings/route.ts`**
- `GET` — fetches `bookings` key from Blobs (null → `[]`), filters by `?phone=` if present, returns `200 Booking[]`
- `POST` — reads body, generates `crypto.randomUUID()` id, sets `status: 'New'` and `createdAt`, appends to array in Blobs, returns `201 Booking`

**`src/app/api/bookings/[id]/route.ts`**
- `PATCH` — requires auth, reads `Partial<Booking>` body, finds booking by id, merges update, writes back, returns `200 Booking`
  - `404` if id not found
  - `401` if not authenticated

**`src/app/api/logs/route.ts`**
- `GET` — returns `200 WhatsAppLog[]`
- `POST` — requires auth, appends log entry with `crypto.randomUUID()` id and `sentAt`, returns `201 WhatsAppLog`

**`src/app/api/records/route.ts`**
- `GET` — returns `200 ServiceRecord[]`
- `POST` — requires auth, appends record with `crypto.randomUUID()` id, returns `201 ServiceRecord`

**All routes must:**
- Handle null Blobs result as `[]`
- Return JSON with `Content-Type: application/json`
- Return `500 { error: "..." }` on Blobs failures (catch all errors)
- Use `getGarageStore()` from `src/lib/blobs.ts` — no direct `getStore()` calls

### Success Criteria
- All routes reachable via `netlify dev`
- `POST /api/auth` with correct password returns a token
- `POST /api/auth` with wrong password returns 401
- `POST /api/bookings` stores a booking visible in Blobs
- `PATCH /api/bookings/:id` without token returns 401
- No TypeScript errors (`npm run build` passes)

---

## Phase 3: Client Integration
**Status**: pending  
**Objective**: Update `storageService` to async fetch-based, wire up UI components.  
**Depends on**: Phase 2 (API routes must exist and be reachable)

### Deliverables

**`src/lib/storage.ts`** — replace localStorage internals, keep method names
```typescript
// All methods become async:
getBookings(phone?: string): Promise<Booking[]>
saveBooking(data: Omit<Booking, 'id'|'status'|'createdAt'>): Promise<Booking>
updateBookingStatus(id: string, status: BookingStatus, mechanic?: string): Promise<void>
updateBooking(id: string, updates: Partial<Booking>): Promise<void>
getLogs(): Promise<WhatsAppLog[]>
addLog(bookingId: string, phone: string, message: string): Promise<void>
getServiceRecords(): Promise<ServiceRecord[]>
saveServiceRecord(record: Omit<ServiceRecord,'id'>): Promise<ServiceRecord>
```
- Remove all `localStorage` calls
- Public methods (getBookings, saveBooking): plain `fetch`
- Admin methods (updateBooking*, addLog, saveServiceRecord): include `Authorization: Bearer ${getAdminToken()}` header
- All methods throw on non-OK response (callers handle with `try/catch` + toast)

**`src/app/page.tsx`** — customer page
- `handleBook`: make `async`, `await storageService.saveBooking()`, wrap in `try/catch`, show error toast on failure
- `handleSearch`: make `async`, `await storageService.getBookings(searchPhone)` (pass phone param), wrap in `try/catch`

**`src/app/admin/page.tsx`** — admin dashboard
- `handleLogin`: POST to `/api/auth` instead of client-side password check, call `setAdminToken(token)` on success
- Add logout button → POST to `/api/logout`, call `setAdminToken(null)`, `setIsAuthenticated(false)`
- Add `const [logs, setLogs] = useState<WhatsAppLog[]>([])` state
- Add `isLoading` state; show spinner/skeleton while initial data loads
- `useEffect` (authenticated): await all three — `getBookings()`, `getServiceRecords()`, `getLogs()` — set all three states, set `isLoading(false)`
- `handleStatusUpdate`: make `async`, `await storageService.updateBookingStatus()`, then reload bookings
- `handleComplete` (completion modal submit): make `async`, `await storageService.updateBooking()`
- Inline `onSubmit` at L658 (manual record form): make `async`, `await storageService.saveServiceRecord()`
- Remove inline `storageService.getLogs()` calls at L380/L396, use `logs` state instead
- Wrap all async admin calls in `try/catch` with `toast.error()`

### Success Criteria
- Customer can submit a booking and see confirmation
- Admin can log in with `ADMIN_PASSWORD` and see bookings loaded from server
- Bookings visible in admin after submitting from customer page (cross-device persistence)
- Booking status update from admin is immediately reflected
- Logout clears session and returns to login screen
- No `localStorage` references remain in production code
- `npm run build` passes with no TypeScript errors

---

## Phase 4: Tests
**Status**: pending  
**Objective**: Unit tests for all API routes; update existing tests for async storageService; Playwright MCP visual verification.  
**Depends on**: Phase 3 (fully working integration)

### Deliverables

**`src/__tests__/api/`** (new test files)

`auth.test.ts`:
- Correct password → 201 + token
- Wrong password → 401
- Missing `ADMIN_PASSWORD` env var → 503

`bookings.test.ts`:
- GET returns empty array on first call (null Blobs)
- GET with `?phone=` filters correctly
- POST creates booking with server-generated id and status `'New'`
- PATCH updates booking fields
- PATCH with invalid id → 404
- PATCH without auth → 401

`logs.test.ts`:
- GET returns logs array
- POST without auth → 401
- POST with auth appends log

`records.test.ts`:
- GET returns records
- POST without auth → 401
- POST with auth creates record

**Update existing tests** in `src/__tests__/`:
- Update any tests that call `storageService` synchronously → add `await`
- Mock `fetch` instead of `localStorage`

**Playwright MCP verification** (manual, run in review session):
- Submit booking from customer page (`/`)
- Open admin page (`/admin`), log in
- Verify the booking appears in the dashboard
- Update booking status from admin
- Open customer page in new tab, look up by phone → verify status is updated

### Success Criteria
- All new unit tests pass (`npm test`)
- All existing tests still pass
- No coverage regression
- Playwright MCP confirms cross-tab booking flow works end-to-end

---

## Consultation Log

**Gemini 2.5 Flash (Plan review, Round 2, via zen MCP)** — `APPROVE` with HIGH confidence. No key issues.

**Claude (Plan review, Round 1)** — `COMMENT` with HIGH confidence (no blockers)

Issues raised and addressed:
- README local dev update not assigned to a phase → added to Phase 1 as explicit deliverable
- `POST /api/auth` response code mismatch (plan had 201, spec had 200) → aligned to `200`
- `firebase-tools` removal not mentioned → added to Phase 1
