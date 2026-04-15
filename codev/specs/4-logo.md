# Spec 4: Brand Logo Integration

**Status**: Complete  
**Protocol**: ASPIR  

---

## Problem

The navbar, footer, admin dashboard, and browser tab all use a generic wrench icon + plain text "Garage Nyumbani" instead of the real brand identity. The actual logo assets exist (provided as images) and need to be integrated throughout the app.

---

## Goals

- Add logo SVG files to `public/`
- Replace navbar wrench + text with the full logo (mark + wordmark)
- Replace footer text logo with the logo mark
- Replace admin navbar text with the logo mark
- Set favicon to the logo mark

---

## Scope

### In Scope

- Create SVG assets:
  - `public/logo-mark.svg` — the CG icon mark (blue C arc + black G)
  - `public/logo-full.svg` — mark + "Garage Nyumbani" + "By Swift Group" text
- Update `src/app/page.tsx` navbar: replace `<Wrench>` + text span with `<Image src="/logo-full.svg">` (light-aware: invert on dark if needed)
- Update `src/app/layout.tsx`: add `<link rel="icon" href="/logo-mark.svg">` favicon
- Update `src/components/footer.tsx`: replace text brand with logo mark
- Update `src/app/admin/page.tsx`: replace text brand with logo mark in the admin nav

### Out of Scope

- PNG/WebP exports (SVG is sufficient)
- Animated logo
- Multiple colour-variant SVG files (dark/light handled via CSS)

---

## Technical Design

### SVG Assets

**Logo mark** (`logo-mark.svg`) — viewBox `0 0 100 100`:
- Blue gradient C arc: thick stroke arc, ~270°, opening to right, gradient top-darker to bottom-lighter (`#1B75BC` → `#29ABE2`)
- Black stylized G letterform inside the arc

**Full logo** (`logo-full.svg`) — viewBox `0 0 320 100`:
- Same mark on left portion
- "Garage Nyumbani" bold black text to the right
- "By Swift Group" smaller gray text below

### Dark Mode

The mark has a black G and a blue C — both are visible on dark backgrounds. No inversion needed. The wordmark text ("Garage Nyumbani") should be `currentColor` so it flips with the theme.

### Navbar

Replace:
```tsx
<Wrench className="w-6 h-6 text-blue-600" />
<span className="font-display font-bold text-xl">{BUSINESS_NAME}</span>
```
With:
```tsx
<Image src="/logo-full.svg" alt="Garage Nyumbani" width={180} height={48} priority />
```

### Favicon

In `layout.tsx` metadata:
```ts
icons: { icon: '/logo-mark.svg' }
```

---

## Success Criteria

| # | Criterion | Verify |
|---|-----------|--------|
| 1 | Logo mark SVG renders correctly | Visual check |
| 2 | Full logo SVG renders correctly | Visual check |
| 3 | Navbar shows logo (not wrench + text) | Screenshot |
| 4 | Footer shows logo mark | Screenshot |
| 5 | Admin nav shows logo mark | Screenshot |
| 6 | Browser tab favicon is logo mark | DevTools |
| 7 | Logo readable in light AND dark mode | Toggle theme |
| 8 | All 114 tests still pass | `npm test` |
