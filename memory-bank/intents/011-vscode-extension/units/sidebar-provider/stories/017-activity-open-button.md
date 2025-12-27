---
id: vscode-extension-story-sp-017
unit: sidebar-provider
intent: 011-vscode-extension
status: complete
priority: should
created: 2025-12-26
assigned_bolt: bolt-sidebar-provider-5
implemented: true
---

# Story: Activity Open Button

## User Story

**As a** extension user
**I want** to open the relevant file from an activity event
**So that** I can quickly navigate to the bolt that changed

## Acceptance Criteria

- [x] **Given** an activity event in Recent Activity, **When** rendered, **Then** an open file icon button is displayed
- [x] **Given** user clicks the open button, **When** bolt path is known, **Then** the bolt.md file opens in VS Code editor
- [x] **Given** user clicks anywhere on the activity item, **When** bolt path is known, **Then** the bolt.md file opens in VS Code editor
- [x] **Given** bolt path is not available, **When** rendering, **Then** no open button is shown

## Technical Notes

- Added `path` field to `ActivityEventData` interface in `webviewMessaging.ts`
- WebviewProvider looks up bolt path from StateStore when building activity events
- HTML renders open button (📂) with `data-path` attribute
- Click handler sends `openArtifact` message to extension
- Extension handler opens the file using VS Code API

## Implementation Details

**Files Modified:**
- `src/sidebar/webviewMessaging.ts` - Added `path?: string` to `ActivityEventData`
- `src/sidebar/webviewProvider.ts` - Look up bolt path from state when transforming activity events
- `src/webview/html.ts` - Added open button to activity item HTML
- `src/webview/scripts.ts` - Added click handlers for open button and activity item
- `src/sidebar/styles.ts` - Added `.activity-open-btn` styles

## Dependencies

### Requires
- StateStore (to get bolt path)

### Enables
- Quick navigation to bolt files from activity feed
