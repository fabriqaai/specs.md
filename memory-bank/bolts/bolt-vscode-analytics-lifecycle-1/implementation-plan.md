---
stage: plan
bolt: bolt-vscode-analytics-lifecycle-1
created: 2026-01-09T15:35:00Z
---

## Implementation Plan: Lifecycle Events

### Objective

Add lifecycle event tracking to the VS Code extension, capturing extension activation, welcome view funnel interactions, first-time installation detection, and categorized error tracking. These events form the critical adoption funnel metrics.

### Deliverables

- Updated `vs-code-extension/src/analytics/tracker.ts` - Add lifecycle tracking methods
- Updated `vs-code-extension/src/analytics/types.ts` - Add lifecycle event types
- Updated `vs-code-extension/src/extension.ts` - Initialize tracker, track activation
- Updated `vs-code-extension/src/welcome/welcomeViewProvider.ts` - Track funnel events
- New `vs-code-extension/src/analytics/lifecycleEvents.ts` - Lifecycle event helpers

### Dependencies

- **bolt-vscode-analytics-core-1**: Provides AnalyticsTracker singleton (completed ✅)
- **vscode.ExtensionContext.globalState**: First-activation persistence
- **WelcomeViewProvider**: Welcome view message handlers

### Technical Approach

1. **Extension Activation Tracking** (Story 001)
   - Add `trackActivation()` method to tracker
   - Initialize tracker in `extension.ts` activate() function
   - Track after scanMemoryBank completes to include project context
   - Properties: `is_specsmd_project`, `is_first_activation`, `activation_trigger`

2. **First-Time Installation Detection** (Story 003)
   - Use `context.globalState.get('hasActivatedBefore')` to detect first activation
   - Set flag after tracking to prevent repeat detection
   - Survives extension updates, resets on uninstall/reinstall

3. **Welcome View Funnel Tracking** (Story 002)
   - Track `welcome_view_displayed` when view resolves
   - Track `welcome_copy_command_clicked` on copy action
   - Track `welcome_install_clicked` on install button
   - Track `welcome_website_clicked` on learn more link
   - Track `welcome_install_completed` when installation detected
   - Store install click timestamp for duration calculation

4. **Error Tracking** (Story 004)
   - Add `trackError()` method to tracker
   - Define error categories: activation, parse, file_op, webview, command
   - Properties: `error_category`, `error_code`, `component`, `recoverable`
   - Sanitize all error info (no paths, no stack traces)
   - Add try-catch wrappers to key extension operations

### Event Definitions

| Event | Properties | Trigger |
|-------|------------|---------|
| `extension_activated` | is_specsmd_project, is_first_activation, activation_trigger | activate() after scan |
| `welcome_view_displayed` | has_workspace | resolveWebviewView() |
| `welcome_copy_command_clicked` | - | copyCommand message |
| `welcome_install_clicked` | - | install message |
| `welcome_website_clicked` | - | openWebsite message |
| `welcome_install_completed` | duration_ms | installation detected |
| `extension_error` | error_category, error_code, component, recoverable | catch blocks |

### Integration Points

1. **extension.ts**
   - Import tracker at top
   - Call `tracker.init(context)` at start of activate()
   - Call `trackActivation()` after scanMemoryBank
   - Handle globalState for first-activation detection

2. **welcomeViewProvider.ts**
   - Import tracker
   - Track welcome_view_displayed in resolveWebviewView
   - Track each button/link action in message handler
   - Store _installClickedAt timestamp for duration calc
   - Coordinate with installation watcher for completion event

3. **installHandler.ts** or installation watcher
   - Track welcome_install_completed with duration when project detected

### Acceptance Criteria

- [ ] `extension_activated` event fires on every extension activation
- [ ] `is_specsmd_project` accurately reflects project detection
- [ ] `is_first_activation` is true only on first-ever activation
- [ ] `is_first_activation` persists across VS Code restarts
- [ ] `is_first_activation` resets on extension uninstall/reinstall
- [ ] `activation_trigger` identifies how extension was activated
- [ ] `welcome_view_displayed` fires when welcome view is shown
- [ ] `welcome_copy_command_clicked` fires on copy button click
- [ ] `welcome_install_clicked` fires on install button click
- [ ] `welcome_website_clicked` fires on learn more click
- [ ] `welcome_install_completed` fires when installation detected
- [ ] `welcome_install_completed` includes accurate `duration_ms`
- [ ] `extension_error` fires on caught errors
- [ ] Error events include category, code, component, recoverable
- [ ] No PII in error events (no paths, no stack traces)
- [ ] All tracking is fire-and-forget (non-blocking)
- [ ] Tracking failures never impact extension functionality
- [ ] No impact on extension activation time

### File Structure Changes

```
vs-code-extension/src/analytics/
  tracker.ts           # Add lifecycle tracking methods
  types.ts             # Add lifecycle event types
  lifecycleEvents.ts   # NEW: Helper functions for lifecycle events

vs-code-extension/src/
  extension.ts         # Initialize tracker, track activation

vs-code-extension/src/welcome/
  welcomeViewProvider.ts  # Track funnel events
```

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| First-activation detection unreliable | Test across update/uninstall scenarios |
| Welcome events impact UX | Fire-and-forget, no awaits |
| Error tracking captures PII | Strict sanitization, no paths/traces |
| Duration calculation inaccurate | Handle edge cases (no click, multiple clicks) |
