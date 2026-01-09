---
stage: implement
bolt: bolt-vscode-analytics-lifecycle-1
created: 2026-01-09T16:00:00Z
---

## Implementation Walkthrough: Lifecycle Events

### Summary

Added lifecycle event tracking to the VS Code extension including extension activation, welcome view funnel interactions, first-time installation detection, and categorized error tracking. All tracking is fire-and-forget with comprehensive error isolation to ensure analytics never impact extension functionality.

### Structure Overview

The implementation extends the existing analytics module with a new `lifecycleEvents.ts` file containing all lifecycle tracking functions. Integration points in `extension.ts` and `welcomeViewProvider.ts` call these functions at appropriate moments. The design follows the same patterns established by the core analytics module.

### Completed Work

- [x] `vs-code-extension/src/analytics/types.ts` - Added lifecycle event type definitions (ActivationTrigger, ErrorCategory, and related interfaces)
- [x] `vs-code-extension/src/analytics/lifecycleEvents.ts` - Created lifecycle events module with 7 tracking functions plus helper utilities
- [x] `vs-code-extension/src/analytics/index.ts` - Updated exports to include all lifecycle event functions and types
- [x] `vs-code-extension/src/extension.ts` - Integrated tracker initialization and activation tracking
- [x] `vs-code-extension/src/welcome/welcomeViewProvider.ts` - Added welcome funnel tracking and installation completion handler

### Key Decisions

- **Fire-and-Forget Pattern**: All tracking functions use try-catch with silent failures to ensure analytics never impacts UX
- **EventProperties for Type Safety**: Used generic EventProperties type instead of strict interfaces to match the tracker's signature
- **GlobalState Key Naming**: Used `specsmd.hasActivatedBefore` prefix for consistency with other extension state
- **Error Sanitization**: Implemented sanitizeErrorCode and sanitizeComponent functions to strip any potential PII from error events
- **Duration Tracking**: Store `_installClickedAt` timestamp in WelcomeViewProvider for accurate welcome_install_completed duration

### Deviations from Plan

None - implementation follows the plan exactly.

### Dependencies Added

None - uses existing mixpanel dependency from core analytics module.

### Developer Notes

- The tracker must be initialized with `tracker.init(context)` before any tracking calls work
- `trackActivation()` automatically calls `markAsActivated()` after tracking, so no separate call needed
- The `onInstallationComplete()` method on WelcomeViewProvider is called by the installation watcher when a project is detected
- All public functions are wrapped in try-catch - no errors will propagate to calling code
- Error codes are automatically sanitized to uppercase with special chars replaced by underscores
