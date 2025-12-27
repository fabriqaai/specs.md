---
id: bolt-webview-lit-migration-1
unit: webview-lit-migration
intent: 011-vscode-extension
type: simple-construction-bolt
status: complete
stories:
  - 020-fix-infinite-rerender
  - 021-remove-duplicate-files
  - 022-setup-esbuild
created: 2025-12-26T19:00:00Z
started: 2025-12-26T19:30:00Z
completed: 2025-12-26T20:20:00Z
current_stage: null
stages_completed:
  - plan: 2025-12-26T19:30:00Z
  - implement: 2025-12-26T20:00:00Z
  - test: 2025-12-26T20:20:00Z

requires_bolts:
  - bolt-sidebar-provider-4
enables_bolts:
  - bolt-webview-lit-migration-2
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 2
  max_dependencies: 1
  testing_scope: 2
---

# Bolt: bolt-webview-lit-migration-1

## Overview

Foundation bolt that fixes the critical infinite re-render bug, cleans up duplicate files, and sets up esbuild for webview bundling. This establishes the foundation for the Lit migration.

## Objective

Fix the webview so it renders once and responds to clicks, remove confusing duplicate files, and set up a modern build pipeline that can bundle Lit components.

## Stories Included

- **020-fix-infinite-rerender**: Fix critical re-render loop destroying event listeners (Must)
- **021-remove-duplicate-files**: Remove unused sidebar/styles.ts and sidebar/webviewContent.ts (Must)
- **022-setup-esbuild**: Add esbuild for fast webview bundling with npm support (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Plan**: Pending → implementation-plan.md
- [ ] **2. Implement**: Pending → implementation-walkthrough.md
- [ ] **3. Test**: Pending → test-walkthrough.md

## Dependencies

### Requires
- bolt-sidebar-provider-4 (current webview implementation to fix)

### Enables
- bolt-webview-lit-migration-2 (needs clean foundation for Lit scaffold)

## Success Criteria

- [ ] Webview renders exactly once on load
- [ ] Tab clicks respond immediately
- [ ] No duplicate webview files exist
- [ ] esbuild compiles webview to dist/webview/bundle.js
- [ ] Watch mode rebuilds in < 100ms
- [ ] Bundle loads in webview without CSP errors
- [ ] All existing tests pass

## Notes

- Critical bug fix must be verified manually with DevTools console
- Keep existing functionality working during transition
- esbuild config should support both dev (sourcemaps) and production (minified)
