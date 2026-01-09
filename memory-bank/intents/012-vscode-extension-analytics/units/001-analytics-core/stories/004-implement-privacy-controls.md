---
story: 004-implement-privacy-controls
unit: 001-analytics-core
intent: 012-vscode-extension-analytics
priority: must
status: complete
implemented: true
created: 2025-01-08T12:30:00Z
---

# Story: Implement Privacy Controls

## User Story

**As a** developer using specsmd
**I want** to opt out of telemetry collection
**So that** I can control my privacy

## Acceptance Criteria

- [ ] Check DO_NOT_TRACK environment variable (standard)
- [ ] Check SPECSMD_TELEMETRY_DISABLED environment variable
- [ ] Add VS Code setting: specsmd.telemetry.enabled (default: true)
- [ ] Register setting in package.json contributes.configuration
- [ ] If any opt-out is active, tracker is disabled (no-op mode)
- [ ] Privacy check happens before Mixpanel initialization
- [ ] Document opt-out methods in extension README

## Technical Notes

```typescript
function isTelemetryDisabled(): boolean {
  // Environment variables
  if (process.env.DO_NOT_TRACK === '1') return true;
  if (process.env.SPECSMD_TELEMETRY_DISABLED === '1') return true;

  // VS Code setting
  const config = vscode.workspace.getConfiguration('specsmd');
  if (config.get<boolean>('telemetry.enabled') === false) return true;

  return false;
}
```

package.json addition:
```json
{
  "contributes": {
    "configuration": {
      "title": "specsmd",
      "properties": {
        "specsmd.telemetry.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable anonymous usage telemetry"
        }
      }
    }
  }
}
```

## Estimate

**Size**: S
