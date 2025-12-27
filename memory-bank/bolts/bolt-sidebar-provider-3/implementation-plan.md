---
stage: plan
bolt: bolt-sidebar-provider-3
created: 2025-12-26T13:00:00Z
---

# Implementation Plan: WebviewViewProvider with Tabs & Command Center

## Objective

Migrate the sidebar from TreeDataProvider to WebviewViewProvider with a three-tab architecture (Bolts, Specs, Overview) and implement the command center layout for the Bolts tab.

## Deliverables

1. **WebviewViewProvider class** - Replaces TreeDataProvider as the primary sidebar
2. **Tab system** - Three tabs with state persistence
3. **Command center layout** - Bolts tab with Current Intent, Focus, Queue, Activity sections
4. **Theme support** - VS Code CSS variables for dark/light themes
5. **PostMessage communication** - Extension ↔ Webview messaging

## Stories Included

| Story | Priority | Description |
|-------|----------|-------------|
| 006-webview-tab-architecture | Must | Tab system with persistence |
| 007-command-center-bolts-tab | Must | Command center layout |

## Dependencies

### External
- `vscode` API - WebviewViewProvider
- Existing parser module - Data source

### Internal (From Previous Bolts)
- `bolt-sidebar-provider-2` - Existing tree implementation (reference only, will be replaced)
- `bolt-artifact-parser-2` - `computeBoltDependencies()`, `buildActivityFeed()`, `getUpNextBolts()`

## Technical Approach

### 1. Architecture Change

**From:** TreeDataProvider + TreeView
**To:** WebviewViewProvider + HTML/CSS/JS webview

```
src/sidebar/
├── webviewProvider.ts      # NEW: WebviewViewProvider implementation
├── webviewContent.ts       # NEW: HTML/CSS/JS generation
├── webviewMessaging.ts     # NEW: PostMessage handlers
├── treeProvider.ts         # KEEP: May be used for Specs tab tree
├── treeBuilder.ts          # KEEP: Shared utilities
├── types.ts                # KEEP: Shared types
├── iconHelper.ts           # KEEP: Icon utilities
└── index.ts                # UPDATE: Export new provider
```

### 2. WebviewViewProvider Implementation

```typescript
// Key class structure
class SpecsmdWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _model: MemoryBankModel | null = null;

    resolveWebviewView(webviewView: vscode.WebviewView) { ... }
    refresh() { ... }
    private _getHtmlContent() { ... }
    private _handleMessage(message: any) { ... }
}
```

### 3. Tab State Persistence

Use `context.workspaceState` to persist:
- `specsmd.activeTab` - Current tab ('bolts' | 'specs' | 'overview')

### 4. Theme Integration

Use VS Code CSS variables:
```css
--vscode-sideBar-background
--vscode-editor-foreground
--vscode-list-hoverBackground
--vscode-badge-background
```

### 5. Security (CSP)

Implement Content Security Policy with nonce for inline scripts:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
```

### 6. PostMessage API

**Extension → Webview:**
- `update` - Send new model data
- `setTab` - Switch tabs programmatically

**Webview → Extension:**
- `ready` - Webview loaded
- `tabChange` - User switched tabs
- `openArtifact` - User clicked item
- `refresh` - User clicked refresh

## File Structure (New Files)

```
vs-code-extension/src/sidebar/
├── webviewProvider.ts     # WebviewViewProvider class
├── webviewContent.ts      # HTML generation functions
│   ├── getFullHtml()
│   ├── getStylesheet()
│   ├── getBoltsTabHtml()
│   ├── getSpecsTabHtml()
│   ├── getOverviewTabHtml()
│   └── getScripts()
└── webviewMessaging.ts    # Message handling
    ├── MessageType enum
    └── handleMessage()
```

## Acceptance Criteria

### Story 006: Webview Tab Architecture
- [ ] WebviewViewProvider registered and displays content
- [ ] Three tabs visible: Bolts, Specs, Overview
- [ ] Clicking tab switches view
- [ ] Tab state persists across VS Code restarts
- [ ] Dark theme uses correct VS Code colors
- [ ] Light theme uses correct VS Code colors
- [ ] Refresh button triggers data reload

### Story 007: Command Center Layout
- [ ] Current Intent header shows intent name
- [ ] Statistics display: X Active, Y Queued, Z Done
- [ ] Current Focus section placeholder present
- [ ] Up Next queue section placeholder present
- [ ] Recent Activity section placeholder present
- [ ] Empty states shown when no data

## Out of Scope (for this bolt)

- Detailed Focus card implementation (bolt-sidebar-provider-4)
- Activity feed UI with filtering (bolt-sidebar-provider-4)
- Interactive queue items (bolt-sidebar-provider-4)
- Specs tab tree rendering (future bolt)
- Overview tab charts (future bolt)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| CSP blocks scripts | Use nonce for inline scripts |
| Theme detection issues | Use VS Code CSS variables, not hardcoded colors |
| State lost on webview dispose | Persist to workspaceState before dispose |
| Large HTML slows render | Generate sections incrementally, lazy load tabs |

## Estimated Effort

- **Complexity**: 3 (new architecture pattern)
- **Uncertainty**: 2 (clear mockup, but first webview implementation)
- **Testing**: 2 (need e2e tests for webview)

---

*Plan ready for implementation. Proceed to Stage 2 upon approval.*
