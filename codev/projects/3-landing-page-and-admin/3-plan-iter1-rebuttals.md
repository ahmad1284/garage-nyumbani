# Plan 3 — Iteration 1 Rebuttals

## Gemini — SKIPPED
Quota exhausted. No feedback to address.

## Codex — SKIPPED
Not installed. No feedback to address.

## Claude — COMMENT (all addressed)

**Phase 2 overloaded** → Fixed: split into Phase 2 (Footer + FAB) and Phase 3 (Search Bar + Marquee).

**Phase 3 artificial dependency on Phase 2** → Accepted: Phase 4 (Service Cards) depends on Phase 3 so the chain makes sense. Phase 5 (History PDF) depends only on Phase 1 and is independent.

**No extraction strategy for `admin/page.tsx`** → Fixed: added Phase 7 (Admin Extraction) before Phase 8 adds more code. Extracts `<ReminderModal>`, `<NearingDueCard>`, and `generateServiceHistoryPDF` into separate files.

**Missing AT_API_KEY detection mechanism** → Fixed: added `GET /api/reminders/sms-enabled` route in Phase 8 — returns `{ enabled: boolean }` based on server-side env var. Client polls this to show/hide SMS button. Key never exposed client-side.

**`next.config.ts` already has Unsplash pattern** → Noted in Phase 4 and Risk Assessment.

**`motion/react` import path** → Noted in Phase 4 and Risk Assessment.

**`generateHistoryPDF` extraction** → Fixed: moved to `src/lib/pdf-utils.ts` in Phase 5.
