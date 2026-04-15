# Plan 4: Brand Logo Integration

**Status**: In Progress  
**Protocol**: ASPIR  

## Phases

```json
{
  "phases": [
    {"id": "phase-1", "name": "SVG Assets", "status": "pending"},
    {"id": "phase-2", "name": "App Integration", "status": "pending"}
  ]
}
```

---

### Phase 1: SVG Assets

**Objective**: Create `logo-mark.svg` and `logo-full.svg` in `public/`

**Files**:
- `public/logo-mark.svg` — CG icon mark
- `public/logo-full.svg` — mark + wordmark

**Success Criteria**: Both SVGs render at various sizes without pixelation or clipping

---

### Phase 2: App Integration

**Objective**: Wire logos into navbar, footer, admin nav, favicon

**Files**:
- `src/app/layout.tsx` — add favicon metadata
- `src/app/page.tsx` — replace wrench + text in navbar
- `src/components/footer.tsx` — replace text brand  
- `src/app/admin/page.tsx` — replace text brand in admin nav

**Success Criteria**: All 4 surfaces show logo; 114 tests pass; light + dark both readable
