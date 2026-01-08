---
story: 001-track-extension-activation
unit: 002-lifecycle-events
intent: 012-vscode-extension-analytics
priority: must
status: complete
created: 2025-01-08T12:35:00.000Z
implemented: true
---

# Story: Track Extension Activation

## User Story

**As a** specsmd maintainer
**I want** to track every extension activation
**So that** I can measure daily/weekly active users and understand usage patterns

## Acceptance Criteria

- [ ] `extension_activated` event fires on every activation
- [ ] Includes `is_specsmd_project` boolean (true if memory-bank detected)
- [ ] Includes `is_first_activation` boolean (true only on first-ever activation)
- [ ] Includes `activation_trigger` (memory-bank, .specsmd, or manual)
- [ ] Event fires after scanMemoryBank completes
- [ ] All base properties included (ide_name, platform, etc.)

## Technical Notes

Integration point: `extension.ts` activate() function

```typescript
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Initialize analytics first
  analytics.init(context);

  const workspacePath = getWorkspacePath();
  await updateProjectContext(workspacePath);

  // Track activation after project detection
  const model = await scanMemoryBank(workspacePath);
  analytics.trackActivation({
    isSpecsmdProject: model.isProject,
    isFirstActivation: !context.globalState.get('hasActivatedBefore'),
    activationTrigger: detectActivationTrigger()
  });

  // Mark as activated
  context.globalState.update('hasActivatedBefore', true);

  // ... rest of activation
}
```

## Estimate

**Size**: S
