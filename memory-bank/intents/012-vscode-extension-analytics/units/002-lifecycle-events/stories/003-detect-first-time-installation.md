---
story: 003-detect-first-time-installation
unit: 002-lifecycle-events
intent: 012-vscode-extension-analytics
priority: must
status: complete
created: 2025-01-08T12:35:00.000Z
implemented: true
---

# Story: Detect First-Time Installation

## User Story

**As a** specsmd maintainer
**I want** to detect first-time extension installations
**So that** I can track new user acquisition separately from returning users

## Acceptance Criteria

- [ ] First activation detected via globalState persistence
- [ ] `hasActivatedBefore` flag stored in globalState after first activation
- [ ] `is_first_activation` property accurate in extension_activated event
- [ ] Works correctly across extension updates (not reset on update)
- [ ] Works correctly after extension uninstall/reinstall (reset expected)

## Technical Notes

```typescript
function isFirstActivation(context: vscode.ExtensionContext): boolean {
  return !context.globalState.get<boolean>('hasActivatedBefore');
}

function markAsActivated(context: vscode.ExtensionContext): void {
  context.globalState.update('hasActivatedBefore', true);
}

// Usage in activate()
const isFirst = isFirstActivation(context);
analytics.trackActivation({ isFirstActivation: isFirst, ... });
markAsActivated(context);
```

Note: globalState persists across VS Code sessions but is cleared on extension uninstall. Extension updates preserve globalState.

## Estimate

**Size**: S
