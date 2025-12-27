---
id: webview-lit-migration
intent: 011-vscode-extension
status: in-progress
created: 2025-12-26
---

# Unit: Webview Lit Migration

## Overview

Migrate the VS Code extension's webview from raw HTML template strings to Lit web components. This addresses critical maintainability issues, fixes the infinite re-render bug, and aligns with industry best practices (GitLens uses Lit).

## Problem Statement

### Critical Bug: Infinite Re-render Loop

The webview is currently re-rendering hundreds of times per second, destroying event listeners before they can respond to clicks. Console shows:

```
[SpecsMD] Scripts initializing... (repeated 200+ times)
[SpecsMD] Found 3 tabs
[SpecsMD] All event listeners attached successfully
```

### Architecture Issues

1. **Raw HTML Templates** - 2000+ lines of string concatenation, no type safety
2. **Duplicate Files** - `sidebar/styles.ts` and `webview/styles.ts` cause confusion
3. **Monolithic Scripts** - Single 242-line script string, hard to debug
4. **No Component Reuse** - Copy-paste for similar UI patterns
5. **State Management** - Full re-render on every state change

## Solution: Lit Web Components

### Why Lit?

- **Proven**: GitLens (10M+ installs) uses Lit successfully
- **Tiny**: ~5kb gzipped (vs React's 45kb+)
- **Web Standard**: Native Web Components
- **Reactive**: Built-in reactive properties, efficient DOM updates
- **VS Code Native**: Works with CSS variables automatically

### Target Architecture

```
src/webview/
├── components/
│   ├── app.ts                 # Main <specsmd-app> component
│   ├── tabs/
│   │   └── view-tabs.ts       # <view-tabs>
│   ├── bolts/
│   │   ├── mission-status.ts  # <mission-status>
│   │   ├── focus-card.ts      # <focus-card>
│   │   ├── queue-section.ts   # <queue-section>
│   │   └── activity-feed.ts   # <activity-feed>
│   ├── specs/
│   │   ├── intent-tree.ts     # <intent-tree>
│   │   ├── unit-item.ts       # <unit-item>
│   │   └── story-item.ts      # <story-item>
│   ├── overview/
│   │   ├── metrics-grid.ts    # <metrics-grid>
│   │   └── actions-list.ts    # <actions-list>
│   └── shared/
│       ├── progress-ring.ts   # <progress-ring>
│       └── status-badge.ts    # <status-badge>
├── styles/
│   └── theme.css              # VS Code CSS variables
├── state/
│   └── context.ts             # Lit context for state
├── ipc/
│   └── messaging.ts           # Typed VS Code messaging
└── index.ts                   # Entry point, esbuild bundle
```

## Success Criteria

- [ ] Webview renders without infinite loop
- [ ] All tabs clickable and functional
- [ ] All existing functionality preserved
- [ ] Bundle size < 20kb gzipped
- [ ] Hot module replacement for development
- [ ] Component tests with @open-wc/testing

## Dependencies

### Requires

- bolt-sidebar-provider-5 (current webview implementation)

### Enables

- Future UI enhancements with component reuse
- Shared components with potential desktop app

## Stories

1. **020-fix-infinite-rerender** - Fix the critical re-render loop bug
2. **021-remove-duplicate-files** - Clean up duplicate webview files
3. **022-setup-esbuild** - Add esbuild for webview bundling
4. **023-lit-scaffold** - Create Lit project structure
5. **024-tabs-component** - Migrate tabs to Lit component
6. **025-bolts-view-components** - Migrate Bolts view components
7. **026-specs-view-components** - Migrate Specs view components
8. **027-overview-view-components** - Migrate Overview view components
9. **028-state-context** - Add Lit context for state management
10. **029-ipc-typed-messaging** - Type-safe extension ↔ webview messaging

## References

- [GitLens Source (Lit)](https://github.com/gitkraken/vscode-gitlens/tree/main/src/webviews)
- [Lit Documentation](https://lit.dev/)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [GitKraken Blog: Web Components with Lit](https://www.gitkraken.com/blog/web-components-are-lit-with-lit)
