---
id: bolt-sidebar-provider-2
unit: sidebar-provider
intent: 011-vscode-extension
type: simple-construction-bolt
status: complete
stories:
  - 003-bolt-tree
  - 004-status-icons
  - 005-pixel-logo-footer
created: 2025-12-25T17:00:00Z
started: 2025-12-25T20:30:00Z
completed: 2025-12-25T21:00:00Z
current_stage: null
stages_completed:
  - name: plan
    completed: 2025-12-25T20:30:00Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2025-12-25T20:45:00Z
    artifact: implementation-walkthrough.md
  - name: test
    completed: 2025-12-25T21:00:00Z
    artifact: test-walkthrough.md

requires_bolts:
  - bolt-sidebar-provider-1
enables_bolts:
  - bolt-extension-core-1
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 2
---

# Bolt: bolt-sidebar-provider-2

## Overview

Second sidebar bolt adding the Bolts section with stages/stories, status icons, and pixel logo footer.

## Objective

Complete the sidebar with bolt tree (expandable stages/stories), visual status indicators, and branding footer.

## Stories Included

- **003-bolt-tree**: Bolts section with stages and stories as children (Must)
- **004-status-icons**: Status icons (gray/yellow/green/?) for all artifacts (Must)
- **005-pixel-logo-footer**: Fadeout logo at bottom linking to specs.md (Should)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Spec**: Pending → spec.md
- [ ] **2. Implement**: Pending → src/
- [ ] **3. Test**: Pending → test-report.md

## Dependencies

### Requires
- bolt-sidebar-provider-1 (base tree implementation)

### Enables
- bolt-extension-core-1 (complete sidebar ready)

## Success Criteria

- [ ] Bolts section with proper sorting (in-progress first)
- [ ] Bolt type badges (DDD, Simple)
- [ ] Expandable stages and stories under bolts
- [ ] Stages and stories visually differentiated
- [ ] All status icons working
- [ ] "?" icon with tooltip for invalid frontmatter
- [ ] Pixel logo footer (if webview approach works)
- [ ] Visual tests for icons

## Notes

- Bolt display format: `🔄 bolt-name [DDD] Stage: Current`
- Use ThemeIcon for VS Code theme compatibility
- Footer may need webview - consider TreeView description as alternative
