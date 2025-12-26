---
id: vscode-extension-story-sp-018
unit: sidebar-provider
intent: 011-vscode-extension
status: complete
priority: must
created: 2025-12-26
assigned_bolt: bolt-sidebar-provider-5
implemented: true
---

# Story: Specs View Implementation

## User Story

**As a** extension user
**I want** to see all intents, units, and stories in a hierarchical tree view
**So that** I can navigate the project specification structure

## Acceptance Criteria

- [x] **Given** Specs tab is selected, **When** intents exist, **Then** display hierarchical tree: Intent > Unit > Story
- [x] **Given** an intent in the tree, **When** rendered, **Then** show intent number, name, unit count, story count, and progress ring
- [x] **Given** a unit in the tree, **When** rendered, **Then** show unit name, status indicator, and story progress (X/Y)
- [x] **Given** a story in the tree, **When** rendered, **Then** show story ID, title, and status indicator
- [x] **Given** intent/unit header, **When** clicked, **Then** expand/collapse the children
- [x] **Given** story item, **When** clicked, **Then** open the story markdown file in editor
- [x] **Given** filter dropdown, **When** changed, **Then** filter visible items by status
- [x] **Given** no intents exist, **When** Specs tab shown, **Then** display empty state message

## Technical Notes

**Files:**
- `src/webview/html.ts` - `getSpecsViewHtml()` function generates the HTML
- `src/webview/scripts.ts` - Click handlers for intent/unit expand, story click
- `src/sidebar/styles.ts` - CSS for `.specs-toolbar`, `.intent-*`, `.unit-*`, `.spec-story-*`

**UI Structure:**
```
┌─────────────────────────────────────┐
│ Filter: [All Status ▼]              │
├─────────────────────────────────────┤
│ ▼ 📋 011-vscode-extension    [75%]  │
│   ▼ ○ extension-core         2/4    │
│     ● 001-Extension Activation      │
│     ✓ 002-Project Detection         │
│   ▼ ✓ sidebar-provider       4/4    │
│     ✓ 001-Tree Data Provider        │
└─────────────────────────────────────┘
```

**Progress Ring:**
- SVG circle with stroke-dashoffset for progress
- Circumference = 2πr = 69.115 (r=11)
- Shows percentage text in center

## Dependencies

### Requires
- WebviewData.intents populated from StateStore

### Enables
- Navigate project specs without leaving sidebar
