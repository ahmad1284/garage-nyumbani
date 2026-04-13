# Implementation Plan: 3-landing-page-and-admin

## Overview

Enhance landing page and admin dashboard across 6 phases: foundation fixes, landing page UI, service cards + animations, history PDF, admin search + due alerts, and admin PDF + reminders.

```json
{
  "phases": [
    {"id": "phase-1", "name": "Foundation Fixes", "status": "pending"},
    {"id": "phase-2", "name": "Landing Page UI", "status": "pending"},
    {"id": "phase-3", "name": "Service Cards & Animations", "status": "pending"},
    {"id": "phase-4", "name": "History PDF", "status": "pending"},
    {"id": "phase-5", "name": "Admin Search & Due Alerts", "status": "pending"},
    {"id": "phase-6", "name": "Admin PDF & Reminders", "status": "pending"}
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
- **Tests**: Manual — hard reload, verify Swahili text; click toggle, verify theme switches

---

### Phase 2: Landing Page UI

- **Objective**: Add footer, Call Now FAB, search bar after hero, hero marquee
- **Files**:
  - `src/components/footer.tsx` — new component (Maps embed, WhatsApp, social links, address, hours)
  - `src/components/call-now-fab.tsx` — new component (mobile-only FAB, pulse animation)
  - `src/app/page.tsx` — add `<Footer>`, `<CallNowFAB>`, search bar section after hero, marquee below hero CTAs
  - `src/lib/constants.ts` — add `FACEBOOK_URL`, `INSTAGRAM_URL`, `GOOGLE_MAPS_EMBED_URL` constants
- **Dependencies**: Phase 1
- **Success Criteria**:
  - Footer visible with Maps iframe (`loading="lazy"`), WhatsApp link, address, opening hours
  - FAB visible on mobile (`< sm`), hidden on desktop
  - Search bar filters service cards in real time (non-matching cards hidden)
  - Marquee scrolls continuously in hero with "🔧 24/7 Service • Zanzibar Nzima • Huduma ya Dharura •"
- **Tests**: Manual — resize to mobile, verify FAB; type in search bar, verify filter; scroll hero, verify marquee

---

### Phase 3: Service Cards & Animations

- **Objective**: Add images to service cards; add Framer Motion section entry animations
- **Files**:
  - `src/lib/constants.ts` — add `imageUrl` and `fallbackBg` fields to `ServiceItem` interface + all 9 service entries
  - `src/app/page.tsx` — update service card render to show `next/image` in card header; add `motion.section` wrappers with `whileInView` fade-in to each section; stagger service card entries
- **Dependencies**: Phase 2
- **Success Criteria**:
  - Each service card shows image (160px height) with emoji overlay badge
  - Image failure falls back to `fallbackBg` gradient
  - Sections fade/slide in on scroll entry
  - Service cards stagger in with delay
- **Tests**: Manual — scroll through page, verify animations; block network, verify fallback gradients show

---

### Phase 4: History PDF

- **Objective**: Add PDF download to booking history lookup
- **Files**:
  - `src/app/page.tsx` — add `generateHistoryPDF(bookings)` function; show "Download PDF" button after history results load
- **Dependencies**: Phase 1
- **Success Criteria**:
  - Enter phone → results display → "Download PDF" button appears
  - Click button → `History_{phone}.pdf` downloads
  - PDF contains: header (business name, phone, date), table rows (Booking ID, Date, Service, Car, Status, Emergency), footer with page numbers
  - Empty results → no button shown
- **Tests**: Manual — search known phone number, verify PDF downloads and contains correct data

---

### Phase 5: Admin Search & Due Alerts

- **Objective**: Add search/filter to admin tabs; add "Cars Nearing Service Due" dashboard card
- **Files**:
  - `src/app/admin/page.tsx` — add search state per tab; filter `bookings`/`records`/`logs` arrays by query; add nearing-due dashboard card (14-day window, count badge, expandable list, click-to-call)
- **Dependencies**: None (admin is independent of landing page phases)
- **Success Criteria**:
  - Type in search bar → list filters client-side instantly
  - Dashboard shows card with count of records where `nextServiceDate` within 14 days
  - Expanding card shows customer name, phone, car, due date
  - Click-to-call button on each nearing-due row
- **Tests**: Manual — enter partial name in search, verify filter; add a test record with near due date, verify card count

---

### Phase 6: Admin PDF & Reminders

- **Objective**: Add service history PDF download for admin; add automated reminder workflow
- **Files**:
  - `src/app/admin/page.tsx` — add `generateServiceHistoryPDF(records)` function; add download button per customer in records tab; add reminder modal (sequential WhatsApp flow + SMS batch if `AT_API_KEY` set); add `POST /api/reminders/send` call
  - `src/app/api/reminders/send/route.ts` — new API route; loops Africa's Talking SMS API; hidden/disabled if `AT_API_KEY` not in env; logs each sent reminder as `WhatsAppLog`
- **Dependencies**: Phase 5
- **Success Criteria**:
  - Admin clicks download on a customer → multi-page PDF of all their service records saves
  - Reminder modal shows customers one at a time; "Send to [Name]" opens WhatsApp deep link
  - "Send All via SMS" button hidden when `AT_API_KEY` not set; when set, shows confirmation with count before sending
  - Each sent reminder logged as `WhatsAppLog` with `type: 'reminder'`
- **Tests**: Manual — download PDF, verify multi-page with service table; open reminder modal, verify sequential flow; with no `AT_API_KEY`, verify SMS button absent

---

## Risk Assessment

- **Unsplash hotlinking**: URLs may break. Mitigated by `fallbackBg` gradient on every card.
- **Africa's Talking credentials missing**: SMS button hidden in UI; feature degrades gracefully.
- **`page.tsx` size**: File is already 564 lines; phases 2-4 add significant content. Extract `<Footer>`, `<CallNowFAB>` as separate component files to keep page manageable.
- **`next/image` + Unsplash**: Must add `images.remotePatterns` for `images.unsplash.com` in `next.config.ts` — easy to miss.
