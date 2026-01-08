---
story: 005-error-isolation-wrappers
unit: 001-analytics-core
intent: 012-vscode-extension-analytics
priority: must
status: complete
implemented: true
created: 2025-01-08T12:30:00Z
---

# Story: Wrap Analytics in Error Isolation

## User Story

**As a** developer using specsmd
**I want** analytics errors to never crash the extension
**So that** my development workflow is never interrupted by telemetry issues

## Acceptance Criteria

- [ ] All public tracker methods wrapped in try-catch
- [ ] Errors are silently caught and logged (console.debug only)
- [ ] No errors propagate to calling code
- [ ] Network failures do not throw
- [ ] Mixpanel callback errors do not throw
- [ ] init() failure results in disabled tracker, not exception
- [ ] track() failure is silent, returns void regardless
- [ ] Extension works fully when offline

## Technical Notes

```typescript
class AnalyticsTracker {
  track(eventName: string, properties: Record<string, unknown> = {}): void {
    // CRITICAL: Never throw from this method
    try {
      if (!this.enabled || !this.mixpanel) {
        return;
      }

      const eventData = {
        ...this.baseProperties,
        ...properties
      };

      // Fire and forget - don't await
      this.mixpanel.track(eventName, eventData);
    } catch {
      // Silent failure - analytics should never break extension
      // Optionally: console.debug('Analytics error:', error);
    }
  }
}
```

## Estimate

**Size**: S
