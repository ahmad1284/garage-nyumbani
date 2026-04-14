# Implementation Plan: 3-landing-page-and-admin

## Overview

Enhance landing page and admin dashboard across 8 phases: foundation fixes, footer + FAB, search bar + marquee, service cards + animations, history PDF, admin search + due alerts, admin PDF + reminders.

```json
{
  "phases": [
    {"id": "phase-1", "name": "Foundation Fixes", "status": "complete"},
    {"id": "phase-2", "name": "Footer & FAB", "status": "complete"},
    {"id": "phase-3", "name": "Search Bar & Marquee", "status": "complete"},
    {"id": "phase-4", "name": "Service Cards & Animations", "status": "complete"},
    {"id": "phase-5", "name": "History PDF", "status": "complete"},
    {"id": "phase-6", "name": "Admin Search & Due Alerts", "status": "complete"},
    {"id": "phase-7", "name": "Admin Extraction", "status": "complete"},
    {"id": "phase-8", "name": "Admin PDF & Reminders", "status": "complete"}
  ]
}
```

---

## Phases

### Phase 1: Foundation Fixes

- **Objective**: Fix dark/light toggle; set Swahili as default language
- **Files**:
  - `src/app/page.tsx` — replace `theme` with `resolvedTheme`
  - `src/components/language-provider.tsx` — change initial state from `'en'` to `'sw'`
- **Dependencies**: None
- **Success Criteria**:
  - Hard reload → app loads in Swahili
  - Click theme toggle → icon switches Sun/Moon, background changes correctly on first load and subsequent clicks
- **Tests**: Playwright MCP — navigate to `/`, assert Swahili text visible; click theme toggle, assert `html` class changes; hard reload, assert Swahili persists

---

### Phase 2: Footer & FAB

- **Objective**: Add footer component and persistent mobile Call Now FAB
- **Files**:
  - `src/components/footer.tsx` — new component: Google Maps iframe (`loading="lazy"`), WhatsApp link, Facebook/Instagram links, address, opening hours, copyright
  - `src/components/call-now-fab.tsx` — new component: fixed bottom-right, `sm:hidden`, `tel:PHONE_NUMBER`, pulse animation
  - `src/app/page.tsx` — import + render `<Footer>` and `<CallNowFAB>`
  - `src/lib/constants.ts` — add `FACEBOOK_URL`, `INSTAGRAM_URL`, `GOOGLE_MAPS_EMBED_URL`
- **Dependencies**: Phase 1
- **Success Criteria**:
  - Footer renders with Maps iframe, WhatsApp link, address, hours
  - FAB visible on mobile (375px viewport), hidden on desktop (1280px)
- **Tests**: Playwright MCP — resize to 375px, assert FAB visible; resize to 1280px, assert FAB hidden; assert footer Maps iframe present; take screenshot

---

### Phase 3: Search Bar & Marquee

- **Objective**: Add service search bar after hero; add scrolling marquee in hero
- **Files**:
  - `src/app/page.tsx` — add `searchQuery` state; filter SERVICES by query (hide non-matching); add search bar section after hero; add CSS marquee below hero CTAs
  - `src/app/globals.css` — add `@keyframes marquee-scroll` for CSS-only marquee
- **Dependencies**: Phase 2
- **Success Criteria**:
  - Type "brake" → only brake-related service cards visible
  - Clear search → all cards visible
  - Marquee scrolls continuously: "🔧 24/7 Service • Zanzibar Nzima • Huduma ya Dharura •"
- **Tests**: Playwright MCP — type "brake" in search, assert non-brake cards hidden; clear input, assert all cards visible; take screenshot of hero with marquee

---

### Phase 4: Service Cards & Animations

- **Objective**: Add images to service cards; add Framer Motion entry/scroll animations
- **Files**:
  - `src/lib/constants.ts` — add `imageUrl: string` and `fallbackBg: string` to `ServiceItem` interface; populate for all 9 services (Unsplash URLs + Tailwind gradient fallbacks). Note: `images.unsplash.com` remote pattern already exists in `next.config.ts`.
  - `src/app/page.tsx` — update service card header to show `next/image` (160px height, `object-cover`) with emoji overlay; add `motion.section` wrappers with `whileInView` + `initial={{ opacity: 0, y: 20 }}` to each page section; stagger service card entries with `transition={{ delay: idx * 0.05 }}`. Use `motion/react` import (not `framer-motion`).
- **Dependencies**: Phase 3
- **Success Criteria**:
  - Each service card shows image with emoji overlay badge
  - Image load failure → `fallbackBg` gradient visible
  - Sections fade/slide up on scroll entry
  - Service cards stagger in
- **Tests**: Playwright MCP — scroll page, take screenshots of service cards; assert `img` elements present in card headers; assert `fallbackBg` class on card DOM element

---

### Phase 5: History PDF

- **Objective**: Add PDF download button to booking history lookup results
- **Files**:
  - `src/lib/pdf-utils.ts` — new utility: `generateHistoryPDF(bookings, phone)` using jsPDF; A4, header (business name, phone, generated date), table rows (Booking ID, Date, Service, Car, Status, Emergency flag), page number footer
  - `src/app/page.tsx` — import `generateHistoryPDF`; show "Download PDF" button below history results when `history.length > 0`
- **Dependencies**: Phase 1
- **Success Criteria**:
  - Enter phone → results display → "Download PDF" button appears
  - Empty results → no button
  - Click → `History_{phone}.pdf` downloads with correct data
- **Tests**: Playwright MCP — fill phone input, submit, assert "Download PDF" button visible; click, assert download via `browser_network_requests` or console; assert no button when results empty

---

### Phase 6: Admin Search & Due Alerts

- **Objective**: Add search/filter to admin tabs; add nearing-due service dashboard card
- **Files**:
  - `src/app/admin/page.tsx` — add `bookingSearch`, `recordSearch`, `logSearch` state; filter respective arrays client-side; add search bar UI to Bookings, Reminders, Logs tabs; add "Cars Nearing Service Due" dashboard card (14-day window using `isBefore`/`addDays`, count badge, expandable list, click-to-call per row)
- **Dependencies**: None (independent of landing page phases)
- **Success Criteria**:
  - Search filters list instantly client-side
  - Dashboard card shows count of records with `nextServiceDate` within 14 days
  - Expanding card shows name, phone, car, due date; click-to-call on each row
- **Tests**: Playwright MCP — login to `/admin`, type in bookings search, assert list filters; assert nearing-due card on dashboard, expand it, assert rows

---

### Phase 7: Admin Extraction

- **Objective**: Extract bloated `admin/page.tsx` into sub-components before adding more features
- **Files**:
  - `src/app/admin/components/reminder-modal.tsx` — new: reminder workflow UI (sequential WhatsApp + SMS batch)
  - `src/app/admin/components/nearing-due-card.tsx` — new: nearing-due expandable card (extracted from Phase 6)
  - `src/lib/admin-pdf-utils.ts` — new utility: `generateServiceHistoryPDF(records)` using jsPDF
  - `src/app/admin/page.tsx` — import extracted components; remove inlined code
- **Dependencies**: Phase 6
- **Success Criteria**:
  - `admin/page.tsx` shrinks; no regressions in existing admin functionality
  - Components render identically to pre-extraction
- **Tests**: Playwright MCP — full admin smoke test: login, navigate all tabs, assert no regressions; take screenshots before/after

---

### Phase 8: Admin PDF & Reminders

- **Objective**: Wire up service history PDF download and automated reminder workflow
- **Files**:
  - `src/app/admin/page.tsx` — add download button in records tab calling `generateServiceHistoryPDF`; wire `<ReminderModal>` to nearing-due card; add `GET /api/reminders/sms-enabled` check to detect AT key server-side
  - `src/app/api/reminders/sms-enabled/route.ts` — new: returns `{ enabled: boolean }` based on `!!process.env.AT_API_KEY`. Client uses this to show/hide SMS button. Never exposes the key.
  - `src/app/api/reminders/send/route.ts` — new: loops Africa's Talking SMS API for batch send; logs each as `WhatsAppLog` with `type: 'reminder'`
- **Dependencies**: Phase 7
- **Success Criteria**:
  - Click download in records → multi-page PDF saves
  - Reminder modal: sequential WhatsApp flow (one customer at a time), mark-sent after click
  - SMS button hidden when `AT_API_KEY` not set (via `/api/reminders/sms-enabled`); visible + functional when set
  - Each sent reminder logged as `WhatsAppLog`
- **Tests**: Playwright MCP — click PDF download, assert download; open reminder modal, assert first customer + WhatsApp button; call `/api/reminders/sms-enabled`, assert `{ enabled: false }` in test env; assert SMS button absent in DOM

---

## Risk Assessment

- **Unsplash hotlinking**: URLs may break. Mitigated by `fallbackBg` gradient on every card. Note: `images.unsplash.com` remote pattern already in `next.config.ts` — no change needed.
- **`motion/react` import**: Package is `motion`, import from `motion/react` (not `framer-motion`). Online examples often show wrong import path.
- **Africa's Talking credentials**: SMS button hidden via `/api/reminders/sms-enabled` endpoint — key never exposed client-side. Feature degrades gracefully.
- **`admin/page.tsx` bloat**: Phase 7 extracts components before Phase 8 adds more. Extraction before growth is critical.
- **`page.tsx` size**: Phases 2-5 add content but `<Footer>` and `<CallNowFAB>` are extracted components; `generateHistoryPDF` is in `src/lib/pdf-utils.ts`. File stays manageable.
