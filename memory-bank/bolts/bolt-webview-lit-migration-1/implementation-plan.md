---
stage: plan
bolt: bolt-webview-lit-migration-1
created: 2025-12-26T19:30:00Z
---

# Implementation Plan: webview-lit-migration Bolt 1

## Objective

Fix the critical infinite re-render bug that prevents webview interaction, clean up duplicate files for maintainability, and set up esbuild bundling to enable future Lit component integration.

## Root Cause Analysis

### Infinite Re-render Loop Identified

The re-render loop occurs in this sequence:

1. Webview loads → script runs → sends `ready` message
2. `ready` handler calls `this.refresh()` (line 441 in webviewProvider.ts)
3. `refresh()` calls `loadFromModel()` → triggers store update
4. Store subscription fires → calls `_updateWebview()`
5. `_updateWebview()` replaces entire webview HTML
6. New HTML loads → script runs again → sends `ready` message
7. Loop continues infinitely

### Contributing Factors

- No guard against multiple `ready` message processing
- `_updateWebview()` has no re-entrancy protection
- Store subscription fires on every state change, including UI state changes

## Deliverables

### Story 020: Fix Infinite Re-render

- [ ] Add `_initialLoadComplete` flag to prevent re-processing `ready` message
- [ ] Add `_isUpdating` re-entrancy guard to `_updateWebview()`
- [ ] Add render counter for debugging (can be removed later)

### Story 021: Remove Duplicate Files

- [ ] Delete `src/sidebar/styles.ts` (1607 lines, unused)
- [ ] Delete `src/sidebar/webviewContent.ts` (701 lines, unused except for `getNonce`)
- [ ] Update test import: `webviewContent.test.ts` → import from `../webview`

### Story 022: Setup esbuild

- [ ] Install esbuild as dev dependency
- [ ] Create `esbuild.webview.mjs` build script
- [ ] Update `package.json` scripts for build/watch
- [ ] Update `.vscodeignore` for production packaging
- [ ] Create minimal webview entry point for bundling

## Dependencies

### External

- `esbuild` - Fast JavaScript/TypeScript bundler

### Internal

- Existing `src/webview/` module structure
- Existing `src/sidebar/webviewProvider.ts`
- Existing test infrastructure (mocha)

## Technical Approach

### 1. Fix Re-render Loop (Story 020)

```typescript
// webviewProvider.ts changes

// Add flags
private _initialLoadComplete = false;
private _isUpdating = false;

// Guard ready message
case 'ready':
    if (!this._initialLoadComplete) {
        this._initialLoadComplete = true;
        await this.refresh();
    }
    break;

// Guard webview updates
private _updateWebview(): void {
    if (this._isUpdating || !this._view) {
        return;
    }
    this._isUpdating = true;
    try {
        // ... existing render logic
    } finally {
        this._isUpdating = false;
    }
}
```

### 2. Remove Duplicates (Story 021)

Files to delete:
- `src/sidebar/styles.ts` - Legacy CSS, not imported anywhere
- `src/sidebar/webviewContent.ts` - Legacy HTML generator, `getNonce` exists in `webview/index.ts`

Test file to update:
- `src/test/sidebar/webviewContent.test.ts` → change import to `../../webview`

### 3. Setup esbuild (Story 022)

Create `esbuild.webview.mjs`:
- Entry: `src/webview/index.ts`
- Output: `dist/webview/bundle.js`
- Format: IIFE (for browser)
- Features: sourcemaps (dev), minify (prod), watch mode

Update package.json scripts:
- `compile` - Include esbuild step
- `watch:webview` - Watch mode for development

Note: For this initial bolt, we keep existing inline scripts working. The esbuild setup prepares for future Lit migration without breaking current functionality.

## Acceptance Criteria

### Story 020: Fix Infinite Re-render
- [ ] `[SpecsMD] Scripts initializing...` appears exactly once in console
- [ ] Tab clicks respond immediately
- [ ] Console shows `[SpecsMD] Tab clicked: {tab}` on click
- [ ] No render loop visible in DevTools

### Story 021: Remove Duplicate Files
- [ ] `src/sidebar/styles.ts` deleted
- [ ] `src/sidebar/webviewContent.ts` deleted
- [ ] `npm run compile` succeeds
- [ ] `npm test` passes (all 95+ tests)

### Story 022: Setup esbuild
- [ ] `npm run compile` creates `dist/webview/bundle.js`
- [ ] `npm run watch` includes webview watch mode
- [ ] Bundle works in webview (no CSP errors)
- [ ] Existing functionality preserved

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing webview functionality | Test manually after each change |
| Missing imports after file deletion | Run compile and test before committing |
| CSP issues with bundled code | Test bundle loading in actual webview |

## Implementation Order

1. **Story 020** (Critical) - Fix re-render loop first (enables testing of other changes)
2. **Story 021** (Cleanup) - Remove duplicates while codebase is fresh in mind
3. **Story 022** (Foundation) - Setup esbuild for future Lit work

## Notes

- The re-render fix is the highest priority as it blocks all webview interaction
- Keep existing inline scripts working; esbuild is preparation for bolt-2
- Manual testing with DevTools console is essential for verifying the fix
