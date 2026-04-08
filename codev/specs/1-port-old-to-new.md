# Spec 1: Port Old App Features to New Next.js App

**Status**: Draft  
**Date**: 2026-04-08

---

## Problem Statement

The project has two codebases:

- **`old/`** — A React + Vite SPA (monolithic `App.tsx`, ~2,000+ lines). It has all features: rich bilingual service catalog, detailed admin dashboard with mechanic assignment, invoice line items, FAQ, contact section, and WhatsApp integration.
- **`new/`** — A Next.js 15 App Router rewrite. It has the correct architecture (customer landing at `/`, admin at `/admin`), but is missing significant features and content from the old app.

The goal is to bring the `new/` app to feature parity with the `old/` app — without reverting to the monolithic pattern.

---

## Scope

### In Scope

**Customer Landing Page (`/`)**:
1. **Rich service catalog** — 9 services with bilingual (Swahili/English) titles, descriptions, and prices in TZS
2. **Booking form** — service type dropdown updated to match 9 services; add `whatsapp` field
3. **FAQ section** — 4 bilingual Q&A items
4. **Contact/Business info section** — phone, WhatsApp CTA, location (Mpendae, Zanzibar), business hours
5. **Business constants** — `BUSINESS_NAME`, `PHONE_NUMBER`, `WHATSAPP_NUMBER`, `BUSINESS_LOCATION` available across the app

**Admin Page (`/admin`)**:
1. **Predefined mechanics list** — dropdown from fixed list (JUMA BAKARI, SAID HAMAD, ALI KHAMIS, MWINYI HASSAN, SULEIMAN RASHID) instead of free-text input
2. **Price + Work Done fields** — when marking a booking as Completed, admin enters price (TZS) and work description
3. **Invoice line items** — admin can add/remove line items on the invoice (description + amount)
4. **Styled invoice PDF** — port the rich `BookingInvoice` component design: header, bill-to, vehicle log, line items table, total
5. **WhatsApp field** on booking display

**Data Model (`src/lib/storage.ts`)**:
1. Add `whatsapp?: string` to `Booking`
2. Add `price?: number` to `Booking`
3. Add `workDone?: string` to `Booking`
4. Add `invoiceItems?: { description: string; amount: number }[]` to `Booking`

**Constants (`src/lib/constants.ts`)** — new file:
- Business info constants
- 9 `ServiceItem` definitions (id, titleSw, titleEn, descriptionSw, descriptionEn, icon, price)
- FAQ items (4 bilingual Q&A)
- Mechanics list

**Translations (`src/components/language-provider.tsx`)**:
- Add keys for all 9 service names (Swahili + English)
- Add keys for FAQ section title, contact section, WhatsApp CTA

### Out of Scope
- Authentication beyond the simple password check (`admin123`)
- Backend/database — remains localStorage
- UI redesign — keep the new app's visual style (clean, modern, dark mode)
- The old app's `replace.cjs` / `cleanup.cjs` utility scripts
- AI Studio deployment (`server.ts`, `metadata.json`)

---

## Current State vs Desired State

| Feature | Old App | New App (current) | New App (target) |
|---|---|---|---|
| Service catalog | 9 rich bilingual services with prices | 7 simplified services, no prices | 9 rich bilingual services with prices |
| Booking form | Has `whatsapp` field | No `whatsapp` field | Has `whatsapp` field |
| FAQ section | 4 bilingual FAQs | Missing | 4 bilingual FAQs |
| Contact section | Phone, WhatsApp, location | Missing | Phone, WhatsApp, location |
| Business constants | In `constants.tsx` | Hardcoded inline | Shared `src/lib/constants.ts` |
| Mechanics assignment | Dropdown from 5 names | Free-text input | Dropdown from 5 names |
| Price + Work Done | Admin fills on completion | Missing | Admin fills on completion |
| Invoice line items | Add/remove items table | Fixed single line | Add/remove items |
| Invoice PDF style | Rich styled component | Basic text layout | Rich styled layout |
| Booking data model | Has price, workDone, invoiceItems | Missing these fields | Has all fields |

---

## Solution Approach

### Architecture Decision: Constants File
Create `src/lib/constants.ts` to hold the `SERVICES` array, `FAQ_ITEMS`, business constants, and `MECHANICS` list. This keeps data separate from components.

### Architecture Decision: No New Pages
All features fit into the existing two pages (`/` and `/admin`). No new routes needed.

### Architecture Decision: Data Model Extension
Extend the `Booking` interface in `src/lib/storage.ts` with optional fields. Backwards compatible — existing localStorage data will still load correctly since the new fields are optional.

### Architecture Decision: Service IDs
Update service IDs in both the customer page and the constants to match the old app's IDs (e.g., `scheduled-maintenance`, `engine-performance`, etc.) for consistency, but keep the new app's category display style.

### Architecture Decision: Invoice PDF
Use the existing `jsPDF` library (already in `package.json`). Port the styled invoice layout from old app's `BookingInvoice` component. No `html2canvas` needed for the core invoice — use jsPDF's native drawing API for a clean portable result.

---

## Success Criteria

1. Customer landing page shows all 9 services with bilingual names and TZS prices
2. Booking form has a WhatsApp field and service type options match 9 services
3. FAQ section renders 4 bilingual Q&As, toggling language
4. Contact section shows phone, WhatsApp CTA, and location
5. Admin mechanics assignment uses a dropdown of 5 predefined names
6. Admin "Complete" flow captures price, work done, and optional line items
7. Invoice PDF renders with: header (business name/location), bill-to, vehicle details, line items table, total in TZS
8. All new Booking fields (whatsapp, price, workDone, invoiceItems) persist to localStorage
9. Language toggle works for all new sections (services, FAQ, contact, form labels)
10. No TypeScript errors, no console errors in dev mode

---

## Assumptions & Constraints

- **Next.js 15 + React 19**: Already in use, stay on these versions
- **Tailwind CSS 4**: Already configured
- **No new dependencies**: Use what's already in `package.json` (`jsPDF`, `html2canvas`, `date-fns`, `motion/react`, `lucide-react`, `sonner`)
- **localStorage only**: No backend changes
- **Bilingual**: Every new user-visible string needs Swahili + English versions
- **Mobile-first**: Existing responsive design must be maintained

---

## Open Questions

| Priority | Question | Impact |
|---|---|---|
| Important | Should service descriptions be shown on the landing page (expandable cards)? Old app had full descriptions in a services section. | Affects landing page layout complexity |
| Important | Should the WhatsApp number for the booking confirmation "Send WhatsApp" button be configurable (env var) or hardcoded? | Currently hardcoded as `255700000000` |
| Nice-to-know | Should we add the testimonials/trust section from the old app? (not clearly visible in old App.tsx) | Additional UI section |

---

## Consultation Log

*(To be updated after multi-agent review)*

