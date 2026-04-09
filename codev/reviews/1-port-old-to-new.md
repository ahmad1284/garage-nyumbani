# Review: Port Old App Features to New Next.js App

> Spec: `codev/specs/1-port-old-to-new.md`
> Plan: `codev/plans/1-port-old-to-new.md`
> Date: 2026-04-09

## Summary

Successfully ported the old Garage Nyumbani React app to a new Next.js 15 app router project. All 4 implementation phases completed: foundation, customer landing page, admin dashboard, and bug fixes. 40 unit tests passing, build clean, Netlify deployment configured.

## What Was Built

- **Constants library** (`src/lib/constants.ts`): SERVICES (9 items), MECHANICS (5 names), FAQ_ITEMS (4 bilingual Q&A), business info constants
- **Extended storage** (`src/lib/storage.ts`): Added `whatsapp`, `price`, `workDone`, `invoiceItems`, `notes` fields to Booking; added `updateBooking()` method
- **Bilingual translation system** (`src/components/language-provider.tsx`): Full EN/SW UI string map, SSR-safe hydration without flash
- **Customer landing page** (`src/app/page.tsx`): Service catalog with accordion, booking form with optional WhatsApp/notes, FAQ section, contact section
- **Admin dashboard** (`src/app/admin/page.tsx`): MECHANICS dropdown, completion modal with price/work-done/line-items, InvoiceDocument PDF generation via html2canvas + jsPDF
- **Invoice component** (`src/components/invoice-document.tsx`): Off-screen React component captured as PDF
- **Netlify deployment**: `netlify.toml` with `@netlify/plugin-nextjs`, root `package.json` proxy for build/test commands

## Architecture Updates

### Directory Structure
```
garage-nyumbani/
├── netlify.toml              # Netlify deployment config (base=new/)
├── package.json              # Root proxy: build/test → new/
├── new/                      # Next.js 15 app (deployed to Netlify)
│   ├── next.config.ts        # No standalone output (Netlify plugin handles it)
│   ├── jest.config.ts        # Jest + ts-jest + jsdom
│   ├── jest.setup.ts         # @testing-library/jest-dom
│   └── src/
│       ├── app/
│       │   ├── page.tsx      # Customer-facing landing page
│       │   ├── admin/page.tsx # Admin dashboard
│       │   └── actions.ts    # Server action: Gemini AI analysis
│       ├── components/
│       │   ├── language-provider.tsx  # EN/SW i18n context
│       │   └── invoice-document.tsx   # PDF invoice React component
│       └── lib/
│           ├── constants.ts  # All business data (services, mechanics, FAQs)
│           └── storage.ts    # localStorage CRUD for bookings
└── codev/                    # Development methodology files
```

### Key Patterns
- **PDF generation**: InvoiceDocument rendered off-screen at `left: -9999px` → html2canvas capture → jsPDF.addImage
- **Accordion expand/collapse**: AnimatePresence from `motion/react` wrapping conditional content
- **SSR-safe i18n**: Default language rendered immediately, `useEffect` switches to localStorage language on mount — no blank flash
- **Storage**: All bookings in localStorage under `garage_nyumbani_bookings` key

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| `@google/genai` | Gemini AI car issue analysis (server action) |
| `html2canvas` | Capture InvoiceDocument div as image |
| `jspdf` | Embed image into PDF file |
| `motion/react` | AnimatePresence accordion animations |
| `@netlify/plugin-nextjs` | Next.js SSR on Netlify |
| `sonner` | Toast notifications in admin dashboard |

## Lessons Learned Updates

### Testing

- **Mock jsPDF and html2canvas in jsdom tests**: These libraries crash in jsdom (`TextEncoder not defined`). Always mock them at the module level in any test file that imports components which use them.
- **Wrap components in providers during testing**: Components using `useLanguage()` need `<LanguageProvider>` wrapper. Create a `renderWithProviders` helper in test files that need it.
- **`getAllByText` when text appears multiple times**: Service prices like `TZS 45,000` may appear on multiple cards. Use `getAllByText` and check `length > 0` rather than `getByText`.

### Architecture

- **Remove `output: standalone` for Netlify**: Next.js standalone mode conflicts with `@netlify/plugin-nextjs`. The plugin handles SSR routing; standalone creates a separate server that Netlify doesn't know how to route.
- **Root package.json proxy for monorepo-style repos**: When build tooling (porch, CI) runs from the repo root but the app lives in a subdirectory, a root `package.json` that proxies `build` and `test` scripts avoids path issues.

### Process

- **Create GitHub issue before starting spec**: SPIR workflow expects issue → spec → plan → implement → PR. Creating the issue after implementation still works but is cleaner upfront.
- **Defer impl-phase consultation to PR stage**: `consult --type impl` requires a live PR (architect context). If the PR doesn't exist yet, skip impl consultation and consolidate all consultation at the PR review stage.

### Tooling

- **`porch check` requires specific section headings**: Review document must contain `## Architecture Updates` and `## Lessons Learned Updates` exactly as written for porch to pass the checks.
- **Valid Gemini model names**: `gemini-2.0-flash` works; `gemini-3-flash-preview` does not exist (as of April 2026).

## Test Coverage

| Test File | Tests | Coverage |
|-----------|-------|---------|
| `constants.test.ts` | 9 | SERVICES, MECHANICS, FAQ_ITEMS, business info |
| `storage.test.ts` | 5 | CRUD + updateBooking |
| `language-provider.test.tsx` | 5 | EN/SW switching, context hook |
| `page.test.tsx` | 12 | Service catalog, booking form, FAQ, contact |
| `admin.test.tsx` | 9 | Login, mechanics dropdown, completion modal, PDF |
| **Total** | **40** | |

## Deferred

- E2E Playwright tests (marked optional in plan, deferred to future iteration)
- PR consultation (gemini + others) — to be run after PR is created and consult/MCP debugged
