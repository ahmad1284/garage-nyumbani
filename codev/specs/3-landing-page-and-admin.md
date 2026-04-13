# Spec 3: Landing Page & Admin Enhancements

**Status**: Specify Phase  
**Protocol**: SPIR  

---

## Problem

The current landing page (`src/app/page.tsx`) and admin dashboard (`src/app/admin/page.tsx`) are functional but lack polish, UX features, and business-critical workflows. Specifically:

1. **Light/Dark toggle is broken** — `useTheme` reads `theme` which may be `undefined` on first render (SSR mismatch with `next-themes`), so the icon and click handler behave incorrectly.
2. **No footer** — no Google Maps embed, WhatsApp link, social media links, or physical address block.
3. **No floating "Call Now" FAB** — mobile users have no persistent quick-dial button.
4. **No search bar on landing** — discovery section is missing; users must scroll past hero to find services.
5. **History has no PDF export** — user enters phone number and sees bookings on screen, but cannot download a formatted PDF of their history.
6. **Default language is English** — app should default to Swahili for the primary market (Zanzibar).
7. **Service cards show only emoji icons** — no real imagery; cards feel low-quality.
8. **No entry/scroll animations** — sections appear abruptly; Framer Motion is already installed but underused.
9. **No hero marquee** — missed opportunity for "24/7 Service" brand signal.
10. **Admin: no search/filter** — dashboard lists all data with no way to find specific records.
11. **Admin: no service-due alerts** — no visibility into cars nearing their next scheduled service date.
12. **Admin: no PDF download for service records** — admin cannot generate and download service history PDFs.
13. **Admin: no automated reminders** — system has WhatsApp/SMS logs but no automated trigger for reminders based on due dates or communication gaps.

---

## Goals

- Fix dark/light mode toggle reliably.
- Add a complete footer component.
- Add persistent mobile "Call Now" FAB.
- Add a search bar after the hero section.
- History lookup: user enters phone number → downloads formatted PDF of their booking history.
- Default UI language to Swahili; keep English toggle working.
- Redesign service cards with high-quality images.
- Add Framer Motion entry animations and scroll effects site-wide.
- Add scrolling marquee in hero ("24/7 Service").
- Add admin search/filter across bookings and records.
- Add "Cars Nearing Service Due" card/modal in admin dashboard.
- Add PDF download for service history in admin view.
- Automate SMS/WhatsApp reminders from admin.

---

## Scope

### In Scope

**Landing Page**
- Fix theme toggle (use `resolvedTheme` from `next-themes` instead of `theme`)
- New `<Footer>` component: Google Maps embed (iframe), WhatsApp CTA, Facebook/Instagram links, address block (Mpendae, Zanzibar), opening hours
- Persistent `<CallNowFAB>` component: fixed bottom-right, visible only on mobile (`sm:hidden`), links `tel:PHONE_NUMBER`, subtle pulse animation
- Search bar section immediately after hero: filters SERVICES list client-side by title/description, scrolls to filtered service card
- History PDF: user enters phone → `handleSearch` fetches bookings → "Download PDF" button generates formatted jsPDF with booking history (booking ID, date, service, car, status) and saves to disk
- Swahili default: change `language-provider.tsx` initial state from `'en'` to `'sw'`
- Service card images: add `image` field to `ServiceItem` in `constants.ts` with Unsplash URLs per service; replace emoji icon in card header with `next/image`
- Framer Motion: wrap each section with `motion.section` using `whileInView` fade-in; stagger service card entries; animate hero text lines
- Hero marquee: horizontal scrolling ticker below hero CTA buttons — "🔧 24/7 Service • Zanzibar Nzima • Huduma ya Dharura •" repeating

**Admin Dashboard**
- Search bar at top of each tab (Bookings, Records, Logs): filters list client-side by customer name, phone, car model, service type
- "Cars Nearing Service Due" dashboard card: reads `records` state, flags those where `nextServiceDate` is within 14 days; count badge + expandable list with customer name, phone, car, due date; click-to-call button
- PDF download for service records: extend `generateReceipt`-style function; admin can download full service history for a customer (all records matching phone), formatted as a multi-page jsPDF document
- Automated reminders modal: admin selects timeframe (e.g., "cars due within 7 days"), system generates WhatsApp deep-link messages for each; optionally trigger Africa's Talking SMS batch for those with phone numbers only; log reminder sent in `WhatsAppLog`

### Out of Scope

- Real-time push notifications
- Email reminders
- Changing the booking form fields
- Any database migration (still uses Netlify Blobs from Spec 2)
- Authentication overhaul (still uses `ADMIN_PASSWORD` env var)
- New pages beyond landing and admin

---

## Technical Design

### Theme Toggle Fix

`next-themes` sets `theme` to `undefined` until client hydration. Use `resolvedTheme` which always returns `'light'` or `'dark'` after mount.

```tsx
const { resolvedTheme, setTheme } = useTheme();
// ...
onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
// icon: resolvedTheme === 'dark' ? <Sun /> : <Moon />
```

### History PDF Download

User flow: enter phone → submit → results display → "Download PDF" button appears.

`generateHistoryPDF(bookings: Booking[])`:
- jsPDF document, A4
- Header: business name, phone number queried, generated date
- Table rows: Booking ID | Date | Service | Car | Status | Emergency flag
- Footer: "Generated by Garage Nyumbani" + page numbers
- Saves as `History_{phone}.pdf`

No API changes needed — uses existing `storageService.getBookings(phone)`.

### Footer Component

```
src/components/footer.tsx
```
- Google Maps embed: `<iframe>` pointing to Mpendae, Zanzibar coordinates — lazy-loaded (`loading="lazy"`) to avoid blocking page load on slow mobile connections
- WhatsApp link: `https://wa.me/WHATSAPP_NUMBER`
- Social: Facebook, Instagram (placeholder hrefs from constants)
- Address: `BUSINESS_LOCATION` constant
- Hours: Mon–Sat 8am–6pm, Sun/Holidays Emergency only
- Copyright line

### Service Card Images

Add to `constants.ts`:
```ts
interface ServiceItem {
  // ...existing fields
  imageUrl: string;  // Unsplash URL for the service
}
```

Use `next/image` with `fill` + `object-cover` in card header area (fixed height ~160px). Keep emoji as overlay badge.

**Fallback**: Each service card must define a `fallbackBg` Tailwind gradient class used when the image fails to load. Do not hotlink with no fallback — broken images degrade trust.

### Marquee

CSS-only approach using `@keyframes scroll` + `overflow: hidden` wrapper — no extra library needed. Framer Motion `animate={{ x }}` with `useAnimationControls` is an alternative.

### Admin: Cars Nearing Due

```tsx
const nearingDue = records.filter(r =>
  r.nextServiceDate &&
  isBefore(new Date(r.nextServiceDate), addDays(new Date(), 14))
);
```

Display as dashboard stat card with red/orange badge. Expandable list. Clicking a row auto-fills the reminder modal.

### Admin: PDF Service History

New function `generateServiceHistoryPDF(records: ServiceRecord[])`:
- Filter records by phone
- Multi-page jsPDF: header with business name/logo text, table of services (date, service, mechanic, price, notes)
- Footer with page numbers

### Admin: Automated Reminders

1. Admin clicks "Send Reminders" for nearing-due cars
2. Modal shows list with pre-composed WhatsApp message per customer
3. **WhatsApp flow**: Show customers one at a time — "Send to [Name]" button opens deep link, admin clicks through sequentially. No mass-tab-open. After each, admin marks as sent.
4. **SMS flow** (requires Africa's Talking): "Send All via SMS" calls `POST /api/reminders/send` which loops through Africa's Talking API. Shows confirmation dialog with count + estimated cost before sending.
5. Each sent reminder creates a `WhatsAppLog` entry with `type: 'reminder'`

---

## Open Questions

### Critical

1. **Google Maps location**: Exact coordinates or Place ID for Mpendae, Zanzibar for the footer embed?
2. **Social media links**: What are the actual Facebook/Instagram handles for Garage Nyumbani?

### Important

3. **SMS reminders**: Should reminders be manual-trigger only (admin clicks) or also scheduled (cron via Netlify Scheduled Functions)?
4. **Marquee content**: Confirm the exact Swahili/English text for the hero marquee ticker.

### Nice-to-know

7. Should the "Call Now" FAB also have a WhatsApp option (small secondary button)?
8. Should service card images be configurable from admin (future)?

---

## Success Criteria

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | Dark/light toggle works on first load and subsequent clicks | Manual test: hard reload, click toggle, verify icon + background change |
| 2 | Footer renders with Maps embed, WhatsApp, address | Visual check; Maps iframe loads |
| 3 | Call Now FAB visible on mobile, hidden on desktop | Resize browser / DevTools mobile view |
| 4 | Search bar filters services in real time | Type "brake" → only brake card shown |
| 5 | History PDF downloads correctly | Enter phone → results show → click Download → PDF saves with all bookings |
| 6 | App loads in Swahili by default | Hard reload, no localStorage → Swahili text visible |
| 7 | Service cards show images | Cards display photo, not just emoji |
| 8 | Scroll animations fire on section entry | Scroll down; sections fade/slide in |
| 9 | Hero marquee scrolls continuously | "24/7 Service" text scrolls in hero |
| 10 | Admin search filters results | Type customer name → list filters |
| 11 | Admin shows nearing-due cars | Dashboard card lists cars with nextServiceDate within 14 days |
| 12 | Admin PDF download works | Click download → PDF saves to disk with service history |
| 13 | Reminder workflow completes | Admin selects customers → WhatsApp links open / SMS sent |

---

## Consultation Log

### Round 1 — Claude (Opus)

**Verdict**: REQUEST_CHANGES | Confidence: HIGH

**Key feedback incorporated**:
- Added OTP rate limiting (3/hr per phone), brute-force cap (5 attempts), phone normalization (E.164)
- Marked Africa's Talking credentials as hard blocker; demo-mode bypass gated to non-production
- Revised WhatsApp reminder UX: sequential per-customer flow instead of mass tab-open
- Added SMS send confirmation dialog with count/cost
- Added image fallback gradients for service cards
- Added `loading="lazy"` to Google Maps iframe

**Not acted on**: Claude suggested splitting into 2-3 specs. User confirmed single spec is intentional — all features target one release. Implementation will be phased in the plan.

**User feedback**: Removed OTP security flow entirely. History is open — enter phone → get PDF. No verification gate.

**User feedback**: Removed OTP security flow entirely. History is open — enter phone → get PDF. No verification gate.

**Gemini**: Skipped — daily quota exhausted on free tier key.
