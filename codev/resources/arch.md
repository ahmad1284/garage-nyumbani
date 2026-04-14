# Architecture

High-level architecture documentation for this project. Updated during MAINTAIN and SPIR Review phases.

## Overview

Garage Nyumbani is a mobile auto service platform for Zanzibar. Customers book mechanics online; admins manage bookings, assign mechanics, send reminders, and generate PDF reports. The app is bilingual (Swahili + English) and defaults to Swahili. Deployed on Netlify with Blobs for persistence.

## Directory Structure

```
garage-nyumbani/
├── netlify.toml                   # Netlify deployment config
├── package.json                   # Dependencies + scripts
├── next.config.ts                 # Next.js 15 config (Unsplash + picsum remote patterns)
├── jest.config.ts                 # Jest + ts-jest + jsdom
├── postcss.config.mjs             # Tailwind v4 PostCSS plugin
└── src/
    ├── app/
    │   ├── layout.tsx             # Root layout: ThemeProvider + LanguageProvider + Toaster
    │   ├── page.tsx               # Customer landing page
    │   ├── globals.css            # Tailwind v4 imports + dark variant + base styles
    │   ├── actions.ts             # Server action: Gemini AI car issue analysis
    │   └── admin/
    │       ├── page.tsx           # Admin dashboard (auth, bookings, reminders, comms)
    │       └── components/
    │           ├── nearing-due-card.tsx  # Cars nearing service due (14-day window)
    │           └── reminder-modal.tsx    # WhatsApp / SMS reminder workflow
    ├── api/
    │   └── reminders/
    │       ├── sms-enabled/route.ts  # GET: { enabled: bool } (AT_API_KEY presence)
    │       └── send/route.ts         # POST: Africa's Talking SMS batch send
    ├── components/
    │   ├── theme-provider.tsx     # Wraps next-themes NextThemesProvider
    │   ├── language-provider.tsx  # EN/SW i18n context (defaults to Swahili)
    │   ├── footer.tsx             # Footer: Maps embed, WhatsApp, socials, hours
    │   ├── call-now-fab.tsx       # Mobile-only floating Call Now button
    │   └── invoice-document.tsx   # PDF invoice React component (html2canvas target)
    └── lib/
        ├── constants.ts           # SERVICES, MECHANICS, FAQ_ITEMS, business info
        ├── storage.ts             # Netlify Blobs CRUD: bookings + service records
        ├── pdf-utils.ts           # generateHistoryPDF (customer booking history)
        └── admin-pdf-utils.ts     # generateServiceHistoryPDF (admin service records)
```

## Key Components

### Customer Landing Page

**Location**: `src/app/page.tsx`

**Purpose**: Public-facing booking form, service catalog, history lookup, FAQ

**Key Features**:
- Swahili/English language toggle (defaults to Swahili)
- Light/Dark/System theme selector dropdown (next-themes)
- Hero with Framer Motion animations + scrolling marquee
- Service search/filter (client-side, filter pattern)
- Booking history lookup by phone → PDF download
- Booking form with AI issue analyzer (Gemini via server action)
- Booking confirmation modal with GN-XXXXXX ID

**Key Files**:
- `constants.ts` — SERVICES (9 items with imageUrl + fallbackBg), FAQ_ITEMS
- `language-provider.tsx` — EN/SW string lookups via `useLanguage()`
- `storage.ts` — `saveBooking()`, `getBookings()` via Netlify Blobs
- `pdf-utils.ts` — `generateHistoryPDF()` jsPDF export

### Admin Dashboard

**Location**: `src/app/admin/page.tsx`

**Purpose**: Password-protected admin: manage bookings, service records, reminders, comms logs

**Key Features**:
- Search/filter across Bookings, Records, and Logs tabs
- Cars Nearing Service Due card (14-day alert, expandable, click-to-call)
- Service history PDF download per customer
- Reminder modal: sequential WhatsApp + optional Africa's Talking SMS batch
- SMS button hidden when `AT_API_KEY` not set

**Key Files**:
- `admin/components/nearing-due-card.tsx` — nearing-due alert card
- `admin/components/reminder-modal.tsx` — reminder workflow UI
- `admin-pdf-utils.ts` — `generateServiceHistoryPDF()` jsPDF export
- `api/reminders/sms-enabled/route.ts` — AT key presence check (never exposes key)
- `api/reminders/send/route.ts` — Africa's Talking SMS batch send

### Storage Layer

**Location**: `src/lib/storage.ts`

**Purpose**: All persistence via Netlify Blobs. Two stores: `bookings` and `service-records`.

**Note**: Requires Netlify CLI (`netlify dev`) for local development — plain `next dev` has no Blobs runtime.

### Theme System

**Location**: `src/components/theme-provider.tsx`, `src/app/globals.css`, `src/app/layout.tsx`

**Strategy**: Class-based dark mode via next-themes (`attribute="class"`).

**Critical config** — `globals.css` must declare:
```css
@variant dark (&:is(.dark *));
```
This tells Tailwind v4 to use `.dark` class (set by next-themes on `<html>`) instead of defaulting to `prefers-color-scheme` media query. Without this line, manually selecting Light or Dark has no visual effect.

CSS variables also need dark overrides:
```css
.dark { --bg-main: #000000; --text-main: #ffffff; }
```

### i18n

**Location**: `src/components/language-provider.tsx`

**Purpose**: EN/SW context. SSR-safe: renders Swahili immediately (default), switches to localStorage preference on mount.

## Data Flow

```
Customer fills form → saveBooking() → Netlify Blobs
Customer enters phone → getBookings(phone) → history display → PDF download
Booking form submit → analyzeCarIssue() [server action] → Gemini API → AI response

Admin loads dashboard → getAllBookings() + getServiceRecords() → display
Admin search → client-side filter (no API call)
Admin marks complete → updateBooking() → Netlify Blobs
Admin clicks history PDF → generateServiceHistoryPDF(records) → jsPDF download
Admin opens reminder modal → WhatsApp deep-link per customer
Admin clicks SMS batch → POST /api/reminders/send → Africa's Talking API → WhatsAppLog
```

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/reminders/sms-enabled` | GET | None | Reports whether AT_API_KEY is configured |
| `/api/reminders/send` | POST | Admin | Sends Africa's Talking SMS batch + logs |

## External Dependencies

| Dependency | Purpose |
|------------|---------|
| `@google/genai` | Gemini AI car issue analysis (server action) |
| `@netlify/blobs` | Persistent storage (bookings, service records) |
| `jspdf` | PDF generation (receipts, history, service records) |
| `motion/react` | Framer Motion animations (`motion/react`, not `framer-motion`) |
| `next-themes` | Light/Dark/System theme switching |
| `sonner` | Toast notifications |
| `date-fns` | Date formatting |
| `lucide-react` | Icons |

## Configuration

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Yes | Gemini AI for car issue analysis |
| `ADMIN_PASSWORD` | Yes | Admin dashboard login |
| `AT_API_KEY` | No | Africa's Talking SMS (feature disabled if absent) |

## Conventions

- All business data (services, mechanics, FAQs, constants) lives in `src/lib/constants.ts`
- Bilingual strings: `{ en: string, sw: string }` shape; UI picks based on `language` from context
- PDF generation: `jspdf` directly (no html2canvas; lesson from Spec 1)
- Service images: Unsplash URLs with `fallbackBg` Tailwind gradient on every card — never rely on remote image alone
- Dark mode: always use `@variant dark (&:is(.dark *))` in globals.css when using Tailwind v4 + next-themes
- Booking IDs: `GN-XXXXXX` format (sequential, zero-padded to 6 digits)
- Tests mock jsPDF at module level to avoid jsdom crashes

---

*Updated by SPIR Review 3 (2026-04-14).*
