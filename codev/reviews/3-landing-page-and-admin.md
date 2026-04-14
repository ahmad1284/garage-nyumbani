# Review 3: Landing Page & Admin Enhancements

**Status**: Complete  
**Protocol**: SPIR  
**Date**: 2026-04-14  
**Branch**: `spir/3-landing-page-and-admin`  
**PR**: #7  

---

## Implementation Summary

All 8 planned phases delivered successfully. 114/114 tests pass. Clean build.

| Phase | Name | Status | Key Output |
|-------|------|--------|------------|
| phase-1 | Foundation Fixes | ✅ | Swahili default, theme dropdown |
| phase-2 | Footer & FAB | ✅ | `footer.tsx`, `call-now-fab.tsx` |
| phase-3 | Search Bar & Marquee | ✅ | Service filter, hero marquee |
| phase-4 | Service Cards & Animations | ✅ | Unsplash images, Framer Motion |
| phase-5 | History PDF | ✅ | `pdf-utils.ts`, download button |
| phase-6 | Admin Search & Due Alerts | ✅ | Search bars, nearing-due card |
| phase-7 | Admin Extraction | ✅ | `NearingDueCard`, `ReminderModal` |
| phase-8 | Admin PDF & Reminders | ✅ | SMS API, service history PDF |
| post-PR | Theme Switching Fix | ✅ | Tailwind v4 class strategy fix |

---

## Spec vs. Implementation Delta

### Changes from Spec

1. **Theme toggle**: Spec said fix via `resolvedTheme` only. Actual root cause was deeper — Tailwind v4 defaults to `prefers-color-scheme` media query, ignoring next-themes' `class="dark"` on `<html>`. Required `@variant dark (&:is(.dark *))` in globals.css + CSS variable overrides for `.dark` class. The spec-level fix (`resolvedTheme`) was necessary but not sufficient.

2. **Theme button icon**: Spec didn't specify icon convention. Implemented as "current mode" indicator (Moon = dark active, Sun = light active, Monitor = system), not "next state" toggle — this is clearer for a dropdown-based selector.

3. **OTP removed**: User confirmed open phone lookup is acceptable (bookings contain no sensitive financial data). No verification gate implemented.

4. **WhatsApp reminder UX**: Implemented sequential per-customer flow as specified.

5. **`@testing-library/dom`**: Was missing as an explicit dep; added to `devDependencies`. Pre-existing gap surfaced during fresh `npm install`.

---

## What Went Well

1. **Phase decomposition held up**: 8 phases mapped cleanly to commits. No phase needed to be split or merged mid-flight.
2. **Spec-driven clarity**: Having the spec written first eliminated ambiguity during implementation — the "Records = existing Reminders tab" clarification in spec prevented a wrong new tab being built.
3. **Fallback-first image strategy**: Adding `fallbackBg` gradients before adding Unsplash images meant broken images were never a deploy risk.
4. **Component extraction (Phase 7) before growth (Phase 8)**: Extracting `NearingDueCard` and `ReminderModal` before Phase 8 wired them up kept `admin/page.tsx` manageable.
5. **Consultation round on spec**: Claude's suggestion to document the open-phone-lookup privacy trade-off explicitly proved valuable — it's now clearly documented as an accepted MVP trade-off rather than an oversight.

---

## What Was Challenging

1. **Tailwind v4 dark mode**: The root cause wasn't what the spec diagnosed. `resolvedTheme` was only part of the fix. Tailwind v4's shift to media-first dark mode is a silent breaking change for any project using next-themes' class strategy. This cost an extra debugging pass post-PR.

2. **`motion/react` import path**: Online examples consistently reference `framer-motion`. The project uses the `motion` package which exports from `motion/react`. Required careful import discipline across every animated component.

3. **`@testing-library/dom` peer dep**: Missing from `devDependencies` in the original setup. Caused all 11 React component test suites to fail on a fresh install. Only surfaced when node_modules didn't exist (CI/fresh clone scenario). Fixed in this review.

4. **Marquee CSS vs. Framer Motion**: Spec suggested CSS-only marquee. Framer Motion `animate={{ x }}` alternative was considered but CSS `@keyframes` was simpler and performed better with no JS overhead.

---

## Systematic Issues Identified

### 1. Tailwind v4 Class Strategy Not Documented
**Issue**: No documentation in arch.md or CLAUDE.md about the `@variant dark` requirement for class-based dark mode in Tailwind v4 with next-themes.  
**Action**: Added to arch.md conventions section.

### 2. Missing `@testing-library/dom` in devDeps
**Issue**: `@testing-library/react@16` requires `@testing-library/dom` as a peer dep, but it wasn't listed in `devDependencies`. Tests only passed because CI likely cached `node_modules`.  
**Action**: Added `@testing-library/dom: ^10.4.1` to `devDependencies`.

### 3. arch.md Reflects Old Directory Structure
**Issue**: arch.md still references `new/` subdirectory from the old monorepo structure. The project has been restructured — source is now directly in `src/`.  
**Action**: Updated arch.md to reflect current structure.

### 4. README Is Generic AI Studio Template
**Issue**: README still says "Run and deploy your AI Studio app" — it's the scaffold template, not project-specific documentation.  
**Action**: Updated README with project-specific setup, features, and env vars.

---

## Lessons Learned

### For Future Specs
- **Diagnose root cause, not symptom**: "Fix dark toggle via `resolvedTheme`" was the symptom fix. A proper root cause analysis would have caught the Tailwind v4 strategy mismatch earlier.
- **Note framework version-specific gotchas explicitly**: Tailwind v4, Next.js 15 App Router, `motion/react` — each has divergences from docs/tutorials written for older versions. List these in the spec's Technical Design section.

### For Future Plans
- **Fresh-install test gate**: Add "verify `npm ci && npm test` passes on clean clone" as an explicit phase-1 success criterion. Would have caught the missing peer dep immediately.

### For Future Reviews
- **Playwright smoke test as review gate**: We added this organically (user request). Should be standard — at minimum a 3-screenshot smoke test (light/dark/system or key user flows) before marking review complete.

---

## Methodology Improvements

1. **Add "fresh install" to phase-1 checklist**: `npm ci` on a clean clone + `npm test` should be the first verification step, not an afterthought.
2. **Capture Tailwind v4 dark mode pattern in arch.md**: The `@variant dark (&:is(.dark *))` line is now documented as a convention — future specs can skip the debugging.
3. **Playwright verification as standard review step**: The user requested this; it proved valuable. Add it to the SPIR Review phase checklist.
