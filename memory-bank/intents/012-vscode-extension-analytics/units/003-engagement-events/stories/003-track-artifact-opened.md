---
story: 003-track-artifact-opened
unit: 003-engagement-events
intent: 012-vscode-extension-analytics
priority: should
status: complete
created: 2025-01-08T12:40:00.000Z
implemented: true
---

# Story: Track Artifact Opened

## User Story

**As a** specsmd maintainer
**I want** to track when users open artifacts
**So that** I can understand which artifact types are most accessed

## Acceptance Criteria

- [ ] `artifact_opened` event fires when user opens an artifact file
- [ ] Includes `artifact_type`: bolt, unit, story, intent, standard
- [ ] Includes `source`: bolts_view, specs_view, overview
- [ ] Does not include file path or name (privacy)

## Technical Notes

Integration point: `SpecsmdWebviewProvider._handleMessage()`

```typescript
case 'openArtifact':
  analytics.trackArtifactOpened(message.kind, this.getActiveTab());
  await this._openArtifact(message.kind, message.path);
  break;
```

The `kind` parameter already contains the artifact type (bolt, unit, story, intent, standard).

## Estimate

**Size**: S
