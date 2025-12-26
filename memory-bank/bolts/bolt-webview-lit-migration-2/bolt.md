---
id: bolt-webview-lit-migration-2
unit: webview-lit-migration
intent: 011-vscode-extension
type: simple-construction-bolt
status: planned
stories:
  - 023-lit-scaffold
  - 024-tabs-component
created: 2025-12-26T19:00:00Z
started: null
completed: null
current_stage: null
stages_completed: []

requires_bolts:
  - bolt-webview-lit-migration-1
enables_bolts:
  - bolt-webview-lit-migration-3
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 1
---

# Bolt: bolt-webview-lit-migration-2

## Overview

Scaffold bolt that creates the Lit project structure, installs dependencies, and migrates the tab navigation to a proper Lit component. This establishes the component architecture for all subsequent view migrations.

## Objective

Create a well-organized Lit component structure with base classes, theme styles, and a working tab navigation component that replaces the current inline HTML tabs.

## Stories Included

- **023-lit-scaffold**: Create Lit project structure with base element and theme (Must)
- **024-tabs-component**: Migrate tabs to `<view-tabs>` Lit component with state persistence (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Plan**: Pending → implementation-plan.md
- [ ] **2. Implement**: Pending → implementation-walkthrough.md
- [ ] **3. Test**: Pending → test-walkthrough.md

## Dependencies

### Requires
- bolt-webview-lit-migration-1 (esbuild setup for bundling Lit)

### Enables
- bolt-webview-lit-migration-3 (component foundation for Bolts view)

## Success Criteria

- [ ] Lit installed and bundled correctly
- [ ] `<specsmd-app>` root component renders
- [ ] `<view-tabs>` component shows three tabs with icons
- [ ] Tab clicks switch active tab
- [ ] Tab state persists across sidebar hide/show
- [ ] VS Code theme colors applied correctly
- [ ] BaseElement class provides shared styles
- [ ] Bundle size < 10kb gzipped

## Notes

- Follow GitLens pattern for VS Code Lit integration
- Use @lit/decorators for cleaner syntax
- TypeScript strict mode enabled
- Component directory structure matches target architecture
