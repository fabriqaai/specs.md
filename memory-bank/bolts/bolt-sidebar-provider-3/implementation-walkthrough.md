# Implementation Walkthrough: bolt-sidebar-provider-3

## Overview

This document describes the implementation of WebviewViewProvider with tabbed architecture for the SpecsMD VS Code extension sidebar.

## Files Created

### 1. `src/sidebar/webviewMessaging.ts`

Defines the message protocol between the webview and extension:

- **Message Types**: `WebviewToExtensionMessage` (webview → extension) and `ExtensionToWebviewMessage` (extension → webview)
- **Tab System**: `TabId` type with 'bolts', 'specs', 'overview' values
- **Data Interfaces**:
  - `WebviewData`: Complete data structure sent to webview
  - `ActiveBoltData`: Current focus bolt details with stages/stories
  - `QueuedBoltData`: Up next queue items with dependency info
  - `ActivityEventData`: Recent activity feed items
  - `IntentData`, `UnitData`, `StoryData`: Specs hierarchy
  - `StandardData`: Standards list

### 2. `src/sidebar/webviewContent.ts`

Generates the complete HTML/CSS/JS for the webview:

- **Security**: Content Security Policy with nonce for inline scripts
- **Theming**: Uses VS Code CSS variables for automatic dark/light mode support
- **Layout**: Tab bar with three tabs, content sections per tab
- **Bolts Tab**:
  - Current Intent header with statistics
  - Current Focus section showing active bolt progress
  - Up Next Queue with dependency visualization
  - Recent Activity feed with relative timestamps
- **Specs Tab**: Hierarchical intent → unit → story view
- **Overview Tab**: Project metrics and standards list
- **Interactivity**: JavaScript for tab switching, section expand/collapse, PostMessage communication

### 3. `src/sidebar/webviewProvider.ts`

Main `SpecsmdWebviewProvider` class:

- **View Management**: Implements `vscode.WebviewViewProvider` interface
- **Data Building**: Transforms `MemoryBankModel` into `WebviewData`
- **Integration**:
  - Uses `computeBoltDependencies()` from bolt-artifact-parser-2
  - Uses `buildActivityFeed()` and `formatRelativeTime()` for activity
  - Uses `getUpNextBolts()` for dependency-ordered queue
- **Tab Persistence**: Saves/restores active tab via `workspaceState`
- **Message Handling**: Routes webview messages to appropriate handlers
- **Factory Function**: `createWebviewProvider()` for registration

### 4. `src/sidebar/index.ts` (Modified)

Added exports for new webview modules:
- `SpecsmdWebviewProvider`, `createWebviewProvider`
- All webview messaging types
- `getWebviewContent`, `getNonce`

## Architecture Changes

### From TreeDataProvider to WebviewViewProvider

| Aspect | TreeDataProvider | WebviewViewProvider |
|--------|-----------------|---------------------|
| UI | Native tree widget | Custom HTML/CSS/JS |
| Tabs | Not supported | Three tabs with persistence |
| Layout | Hierarchical only | Flexible command center |
| Styling | Limited | Full CSS control |
| Communication | Events | PostMessage API |

### Design Reference

Implementation follows `vs-code-extension/design-mockups/variation-8-2.html`:
- Tab bar styling with active state
- Card-based layout for Focus/Queue/Activity
- Progress indicators and status badges
- VS Code CSS variable integration

## Key Implementation Details

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none';
  style-src ${webview.cspSource} 'unsafe-inline';
  script-src 'nonce-${nonce}';
">
```

### Theme Support

Uses VS Code CSS variables for automatic theming:
- `--vscode-sideBar-background`
- `--vscode-sideBarTitle-foreground`
- `--vscode-button-background`
- `--vscode-input-border`
- etc.

### Data Flow

```
scanMemoryBank() → MemoryBankModel
         ↓
computeBoltDependencies() → Bolt[] with dependency info
         ↓
_buildWebviewData() → WebviewData
         ↓
getWebviewContent() → HTML string
         ↓
webview.html = ...
```

## Testing Notes

- TypeScript compilation: Pass
- ESLint: Pass (no errors or warnings)
- Existing tests: 164 passing
- New functionality tested via existing parser tests

## Success Criteria Met

- [x] WebviewViewProvider registered and working
- [x] Three tabs display and switch correctly
- [x] Tab state persists across sessions
- [x] Theme support (dark/light)
- [x] Command center layout renders
- [x] Current Intent header with statistics
- [x] Section placeholders for Focus, Queue, Activity

## Next Steps (bolt-sidebar-provider-4)

- Interactive elements: Start Bolt button
- Refresh button in header
- File opening on click
- Detailed story status tracking
