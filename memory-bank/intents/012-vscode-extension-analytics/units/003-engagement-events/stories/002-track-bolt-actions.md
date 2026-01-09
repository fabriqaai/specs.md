---
story: 002-track-bolt-actions
unit: 003-engagement-events
intent: 012-vscode-extension-analytics
priority: should
status: complete
created: 2025-01-08T12:40:00.000Z
implemented: true
---

# Story: Track Bolt Actions

## User Story

**As a** specsmd maintainer
**I want** to track how users interact with bolts
**So that** I can understand which bolt features are most used

## Acceptance Criteria

- [ ] `bolt_action` event fires for all bolt interactions
- [ ] Includes `action`: start, continue, view_files, open_md
- [ ] Includes `bolt_type`: DDD, Simple, Spike
- [ ] Includes `bolt_status`: active, queued, completed
- [ ] Does not include bolt ID or name (privacy)

## Technical Notes

Integration points in `SpecsmdWebviewProvider._handleMessage()`:

```typescript
case 'startBolt':
  analytics.trackBoltAction('start', getBoltType(message.boltId), 'queued');
  await this._showStartBoltCommand(message.boltId);
  break;

case 'continueBolt':
  analytics.trackBoltAction('continue', getBoltType(message.boltId), 'active');
  await this._showContinueBoltCommand(message.boltId, message.boltName);
  break;

case 'viewBoltFiles':
  analytics.trackBoltAction('view_files', getBoltType(message.boltId), status);
  await this._openBoltFile(message.boltId);
  break;

case 'openBoltMd':
  analytics.trackBoltAction('open_md', getBoltType(message.boltId), status);
  await this._openBoltFile(message.boltId);
  break;
```

## Estimate

**Size**: S
