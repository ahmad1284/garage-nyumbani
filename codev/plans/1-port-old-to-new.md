# Plan 1: Port Old App Features to New Next.js App

**Status**: Draft  
**Date**: 2026-04-09  
**Spec**: `codev/specs/1-port-old-to-new.md`

---

## phases_json
```json
[
  "foundation",
  "customer-landing",
  "admin-dashboard",
  "bug-fixes-and-polish"
]
```

---

## Phase 1: Foundation
**Status**: pending  
**Objective**: Set up shared data layer — constants, extended types, and storage service — that all other phases depend on.

### Deliverables
1. **`new/src/lib/constants.ts`** (new file)
   - `BUSINESS_NAME`, `PHONE_NUMBER`, `WHATSAPP_NUMBER`, `BUSINESS_LOCATION`
   - `MECHANICS: string[]` — 5 predefined mechanic names
   - `SERVICES: ServiceItem[]` — 9 services ported from `old/constants.tsx`, with id, titleSw, titleEn, descriptionSw, descriptionEn, icon emoji, price (TZS)
   - `FAQ_ITEMS` — 4 bilingual Q&A items ported from `old/constants.tsx`

2. **`new/src/lib/storage.ts`** (extend)
   - Add to `Booking` interface: `whatsapp?: string`, `price?: number`, `workDone?: string`, `invoiceItems?: { description: string; amount: number }[]`, `notes?: string`
   - Add `updateBooking(id: string, updates: Partial<Booking>): void` to `storageService`

3. **`new/src/components/language-provider.tsx`** (extend)
   - Port all `UI_STRINGS` from `old/constants.tsx` into both `en` and `sw` translation objects
   - Remove the `if (!mounted) return null` pattern — replace with rendering using default language strings, then hydrating on mount (eliminates blank flash)

### Success Criteria
- `constants.ts` exports all constants without TypeScript errors
- `storage.ts` `Booking` interface has all new optional fields
- `updateBooking` correctly merges partial updates and persists to localStorage
- Language provider renders immediately on first paint (no blank flash)
- `next build` passes after this phase

### Depends on
Nothing — this is the foundation.

---

## Phase 2: Customer Landing Page
**Status**: pending  
**Objective**: Bring `/` to full feature parity: rich service catalog with descriptions and prices, updated booking form (9 services + whatsapp + notes fields), FAQ section, and contact section.

### Deliverables
1. **Service Catalog section** in `new/src/app/page.tsx`
   - Replace the 7-item simplified list with a rich card grid from `SERVICES` (9 items)
   - Each card: icon, bilingual title, bilingual description, price in TZS
   - Cards expand/collapse to show description (accordion-style or always-visible — match old app's layout)
   - Language toggle updates all service content

2. **Booking Form** updates in `new/src/app/page.tsx`
   - Service type dropdown options updated to use `SERVICES` ids and bilingual names
   - Add `whatsapp` input field (optional, below phone)
   - Add `notes` textarea (optional, below location)
   - Pass all new fields through `storageService.saveBooking()`

3. **FAQ Section** in `new/src/app/page.tsx`
   - New section below booking form
   - 4 accordion Q&A items from `FAQ_ITEMS`
   - Bilingual (uses current language)

4. **Contact/Business Info Section** in `new/src/app/page.tsx`
   - Business name, phone number (tap-to-call link), WhatsApp CTA button (opens `wa.me/WHATSAPP_NUMBER`)
   - Location (Mpendae, Zanzibar)
   - Working hours (24/7 for emergencies)
   - Uses constants from `src/lib/constants.ts`

### Success Criteria
- All 9 services render with bilingual name, description, and TZS price
- Language toggle updates all service/FAQ/contact content correctly
- Booking form submits with whatsapp, notes fields and they persist to localStorage
- FAQ section renders and is interactive
- Contact section shows correct phone/WhatsApp/location from constants
- No console errors on the page

### Depends on
Phase 1 (constants, storage, translations)

---

## Phase 3: Admin Dashboard
**Status**: pending  
**Objective**: Upgrade `/admin` with mechanics dropdown, price/workDone/invoiceItems capture on completion, and a styled invoice PDF.

### Deliverables
1. **Mechanics dropdown** in `new/src/app/admin/page.tsx`
   - Replace free-text mechanic input with `<select>` using `MECHANICS` list from constants
   - Default to empty/placeholder option

2. **Complete booking flow** in `new/src/app/admin/page.tsx`
   - When admin clicks "Mark as Completed", open an extended modal with:
     - Price field (TZS, number input — allows 0 for `other-specialist`)
     - Work Done textarea
     - Invoice line items section: list of `{ description, amount }` pairs with Add/Remove buttons
     - "Save & Complete" button
   - On submit: call `storageService.updateBooking()` with price, workDone, invoiceItems, then set status to Completed

3. **Booking detail display** in manage modal
   - Show `whatsapp` field if present (alongside phone)
   - Show `notes` field if present

4. **`InvoiceDocument` component** (`new/src/components/invoice-document.tsx`, new file)
   - Hidden off-screen React component that renders the styled invoice
   - Sections: header (business name, location, phone), invoice number + date, bill-to (customer name, phone, whatsapp, location), vehicle details (car model, service type), line items table (description + amount), total row in TZS
   - Falls back gracefully when `invoiceItems` is undefined — shows single service line with price

5. **Invoice PDF generation** in `new/src/app/admin/page.tsx`
   - Replace current basic `jsPDF` text layout with `html2canvas` capture of `InvoiceDocument`
   - Uses `html2canvas` → `jsPDF` pattern (matches existing admin page approach)

### Success Criteria
- Mechanics dropdown shows 5 predefined names
- Completing a booking captures price, workDone, invoiceItems and persists to localStorage
- price: 0 is accepted (valid for other-specialist)
- Manage modal shows whatsapp and notes if present
- Invoice PDF renders with all sections from InvoiceDocument
- Old bookings (without invoiceItems) generate invoice showing single service line
- No console errors on admin page

### Depends on
Phase 1 (constants, updateBooking, translations)

---

## Phase 4: Bug Fixes and Polish
**Status**: pending  
**Objective**: Fix the three known bugs and verify end-to-end build and render quality.

### Deliverables
1. **Fix duplicate emergency checkbox** in `new/src/app/page.tsx`
   - Remove the second emergency checkbox/toggle (lines ~312-323 in current page.tsx)
   - Keep only the cleaner styled version

2. **Fix invalid AI model name** in `new/src/app/actions.ts`
   - Change `gemini-3-flash-preview` → `gemini-2.0-flash`

3. **End-to-end verification**
   - `next build` passes with zero TypeScript errors
   - Both `/` and `/admin` render without console errors
   - Language toggle tested on all new sections

### Success Criteria
- Single emergency checkbox in booking form
- AI model name is valid
- `next build` exits 0
- No TypeScript errors

### Depends on
Phases 1, 2, 3 (runs last as final verification)

---

## Consultation Log

*(To be updated after multi-agent review)*
