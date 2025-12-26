---
id: vscode-extension-story-sp-019
unit: sidebar-provider
intent: 011-vscode-extension
status: complete
priority: must
created: 2025-12-26
assigned_bolt: bolt-sidebar-provider-5
implemented: true
---

# Story: Overview View Implementation

## User Story

**As a** extension user
**I want** to see project progress metrics, suggested actions, and quick links
**So that** I can understand overall project status and take action

## Acceptance Criteria

- [x] **Given** Overview tab is selected, **When** rendered, **Then** display overall progress bar and percentage
- [x] **Given** Overview tab is selected, **When** rendered, **Then** display 4 metric cards (Complete %, Stories Done, Bolts Done, Intents)
- [x] **Given** next actions are computed, **When** rendered, **Then** display Suggested Actions section with up to 3 actions
- [x] **Given** no actions are available, **When** Suggested Actions shown, **Then** display "All caught up!" message
- [x] **Given** intents exist, **When** Overview shown, **Then** list intents with progress percentages
- [x] **Given** standards exist, **When** Overview shown, **Then** list standards with file icons
- [x] **Given** Resources section, **When** rendered, **Then** show specs.md website link that opens external URL

## Technical Notes

**Files:**
- `src/webview/html.ts` - `getOverviewViewHtml()` function generates the HTML
- `src/webview/scripts.ts` - Click handlers for intent navigation, action execution, website link
- `src/sidebar/styles.ts` - CSS for `.overview-*` classes

**UI Structure:**
```
┌─────────────────────────────────────┐
│ OVERALL PROGRESS                    │
│ [████████████░░░░░░░░] 64%          │
│                                     │
│ ┌─────────┐  ┌─────────┐           │
│ │   64%   │  │   5/8   │           │
│ │Complete │  │ Stories │           │
│ └─────────┘  └─────────┘           │
│ ┌─────────┐  ┌─────────┐           │
│ │   3/5   │  │    1    │           │
│ │  Bolts  │  │ Intents │           │
│ └─────────┘  └─────────┘           │
├─────────────────────────────────────┤
│ SUGGESTED ACTIONS                   │
│ ▶ Continue bolt-sidebar-provider-5  │
│ + Start next queued bolt            │
├─────────────────────────────────────┤
│ INTENTS                             │
│ 📋 011-vscode-extension       75%   │
├─────────────────────────────────────┤
│ STANDARDS                           │
│ 📄 tech-stack                       │
│ 📄 coding-standards                 │
├─────────────────────────────────────┤
│ RESOURCES                           │
│ 🌐 specs.md - Visit our website     │
└─────────────────────────────────────┘
```

**Suggested Actions Types:**
- `continue-bolt`: Continue working on active bolt
- `start-bolt`: Start next queued bolt
- `complete-stage`: Mark current stage complete
- `unblock-bolt`: Review blocked bolt dependencies
- `create-bolt`: Create new bolt for unassigned stories
- `celebrate`: All work complete!

## Dependencies

### Requires
- WebviewData with computed nextActions from StateStore
- Standards parsed from memory-bank

### Enables
- Quick navigation to project overview
- Action-oriented workflow guidance
