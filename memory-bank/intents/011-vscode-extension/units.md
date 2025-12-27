---
intent: vscode-extension
phase: construction
status: construction
updated: 2025-12-27T16:30:00Z
---

# Units: VS Code Extension

## Overview

The VS Code extension is decomposed into 6 units based on functional responsibility. Each unit has a single purpose and can be developed/tested independently.

## Requirement-to-Unit Mapping

| FR | Requirement | Unit |
|----|-------------|------|
| FR-1.1 | Activity bar sidebar view | `extension-core` |
| FR-1.2 | Tree structure for artifacts | `sidebar-provider` |
| FR-1.3 | Title and icon | `extension-core` |
| FR-1.4 | Auto-detect specsmd projects | `artifact-parser` |
| FR-1.5 | Pixel logo footer | `sidebar-provider` |
| FR-1.6 | Refresh button | `extension-core` |
| FR-2.1-2.8 | Artifact tree structure & sorting | `sidebar-provider` |
| FR-3.1-3.5 | Status indicators | `artifact-parser`, `sidebar-provider` |
| FR-4.1-4.5 | File operations (click, open, copy) | `extension-core` |
| FR-5.1-5.4 | File watching | `file-watcher` |
| FR-6.1-6.6 | Memory bank parsing & schema | `artifact-parser` |
| FR-7.1-7.7 | Project detection & installation | `welcome-view` |
| FR-8.1-8.6 | Tab-based sidebar architecture | `sidebar-provider` |
| FR-9.1-9.10 | Command center (Bolts tab) | `sidebar-provider` |
| FR-10.1-10.6 | Bolt dependencies parsing | `artifact-parser` |
| FR-11.1-11.5 | Activity feed derivation | `artifact-parser`, `sidebar-provider` |

## Units

### 1. extension-core

**Purpose**: Extension entry point, lifecycle management, and command registration

**Assigned Requirements**: FR-1.1, FR-1.3, FR-1.6, FR-4.1-4.5

**Dependencies**: All other units (orchestrates them)

### 2. sidebar-provider

**Purpose**: TreeDataProvider implementation for the sidebar tree view

**Assigned Requirements**: FR-1.2, FR-1.5, FR-2.1-2.8, FR-3 (display)

**Dependencies**: `artifact-parser`, `file-watcher`

### 3. artifact-parser

**Purpose**: Parse memory-bank structure, read frontmatter, determine artifact status

**Assigned Requirements**: FR-1.4, FR-3 (logic), FR-6.1-6.6

**Dependencies**: None (foundation unit)

### 4. file-watcher

**Purpose**: Watch file system for changes and trigger tree refresh

**Assigned Requirements**: FR-5.1-5.4

**Dependencies**: `artifact-parser`

### 5. welcome-view

**Purpose**: Empty state UI when no specsmd project detected, installation flow

**Assigned Requirements**: FR-7.1-7.7

**Dependencies**: `artifact-parser` (for detection)

### 6. webview-lit-migration

**Purpose**: Migrate webview from raw HTML template strings to Lit web components

**Assigned Requirements**: N/A (architecture improvement, not functional requirement)

**Dependencies**: `sidebar-provider` (existing webview to migrate)

**Note**: This unit was added during construction to address maintainability issues and fix the infinite re-render bug. It modernized the webview architecture using a hybrid approach (Lit for Bolts view, server-rendered HTML for Specs/Overview).

## Dependency Graph

```
                    ┌─────────────────┐
                    │  extension-core │
                    │   (orchestrator)│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ sidebar-provider│ │   file-watcher  │ │   welcome-view  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ artifact-parser │
                    │  (foundation)   │
                    └─────────────────┘
```

## Build Order

1. **artifact-parser** - Foundation, no dependencies
2. **file-watcher** - Depends on artifact-parser
3. **sidebar-provider** - Depends on artifact-parser
4. **welcome-view** - Depends on artifact-parser
5. **extension-core** - Orchestrates all units

## Unit Summary

| Unit | Stories | Priority | Status | Notes |
|------|---------|----------|--------|-------|
| artifact-parser | 6 | Must | Complete | Core parsing and activity feed |
| file-watcher | 2 | Must | Complete | File watching |
| sidebar-provider | 19 | Must | Complete | Tabs, command center, activity UI |
| welcome-view | 3 | Must | Complete | Installation flow |
| extension-core | 4 | Must | Complete | Extension lifecycle |
| webview-lit-migration | 10 | Must | Complete | Lit components |
| **Total** | **44** | | | All units complete |
