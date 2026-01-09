---
story: 001-initialize-mixpanel-tracker
unit: 001-analytics-core
intent: 012-vscode-extension-analytics
priority: must
status: complete
implemented: true
created: 2025-01-08T12:30:00Z
---

# Story: Initialize Mixpanel Tracker

## User Story

**As a** specsmd maintainer
**I want** the extension to initialize a Mixpanel tracker on activation
**So that** I can collect anonymous usage telemetry

## Acceptance Criteria

- [ ] AnalyticsTracker class created as singleton
- [ ] Mixpanel initialized with EU endpoint (api-eu.mixpanel.com)
- [ ] Uses same project token as npx installer
- [ ] init() returns boolean indicating if tracking is enabled
- [ ] All initialization wrapped in try-catch
- [ ] Failed initialization results in disabled tracker (no-op mode)
- [ ] Tracker exposes track(eventName, properties) method
- [ ] track() is fire-and-forget (non-blocking)

## Technical Notes

Reference: `src/lib/analytics/tracker.js` for patterns

```typescript
// Expected API
const tracker = AnalyticsTracker.getInstance();
tracker.init(context);
tracker.track('event_name', { prop: 'value' });
tracker.isEnabled(); // boolean
```

## Estimate

**Size**: M
