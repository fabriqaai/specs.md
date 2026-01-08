---
stage: implement
bolt: bolt-vscode-analytics-metrics-1
created: 2026-01-09T10:15:00Z
---

## Implementation Walkthrough: Project Metrics Events

### Summary

Implemented a ProjectMetricsTracker class that captures project structure snapshots on activation and tracks delta changes with built-in debouncing and rate limiting. The module integrates with the existing analytics infrastructure and hooks into extension lifecycle and file watcher events.

### Structure Overview

The implementation follows the existing analytics module pattern with a singleton tracker class and helper tracking functions. It integrates at two points: extension activation (snapshot) and webview refresh (debounced changes).

### Completed Work

- [x] `vs-code-extension/src/analytics/projectMetricsEvents.ts` - Main module with ProjectMetricsTracker class, snapshot and change tracking
- [x] `vs-code-extension/src/analytics/types.ts` - Added type definitions for project metrics events
- [x] `vs-code-extension/src/analytics/index.ts` - Exported new module and types
- [x] `vs-code-extension/src/extension.ts` - Integration for activation snapshot and dispose cleanup
- [x] `vs-code-extension/src/sidebar/webviewProvider.ts` - Integration for file watcher change events

### Key Decisions

- **Singleton pattern**: Matches existing analytics modules (AnalyticsTracker) for consistency
- **Separate counts interface**: Internal ProjectCounts uses camelCase, event properties use snake_case for Mixpanel consistency
- **Change type priority**: bolt_completed > bolt_added > intent_added > story_added > entities_removed
- **Debounce approach**: Timer reset on each scan, 5-second quiet window before emit
- **Rate limit approach**: Sliding window with timestamp array, cleaned up on each check

### Deviations from Plan

None - implementation follows the plan exactly.

### Dependencies Added

None - uses existing dependencies (tracker from analytics module).

### Developer Notes

- The tracker stores lastSnapshot to enable delta comparison across refreshes
- pendingCounts holds data during debounce window, cleared after emit or on new scan
- dispose() must be called on deactivation to prevent timer leaks
- forceEmit() testing helper bypasses debounce for unit tests
