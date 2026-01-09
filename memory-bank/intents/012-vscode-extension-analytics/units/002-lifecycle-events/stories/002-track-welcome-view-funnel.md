---
story: 002-track-welcome-view-funnel
unit: 002-lifecycle-events
intent: 012-vscode-extension-analytics
priority: must
status: complete
created: 2025-01-08T12:35:00.000Z
implemented: true
---

# Story: Track Welcome View Funnel

## User Story

**As a** specsmd maintainer
**I want** to track the welcome view onboarding funnel
**So that** I can measure conversion from extension install to specsmd adoption

## Acceptance Criteria

- [ ] `welcome_view_displayed` fires when welcome view is shown
- [ ] `welcome_copy_command_clicked` fires when user copies npx command
- [ ] `welcome_install_clicked` fires when user clicks Install button
- [ ] `welcome_website_clicked` fires when user clicks Learn More link
- [ ] `welcome_install_completed` fires when installation watcher detects success
- [ ] `welcome_install_completed` includes `duration_ms` from install click to completion

## Technical Notes

Integration point: `WelcomeViewProvider.ts`

```typescript
// In resolveWebviewView message handler
webviewView.webview.onDidReceiveMessage(async (message) => {
  switch (message.command) {
    case 'openWebsite':
      analytics.trackWelcomeWebsiteClicked();
      vscode.env.openExternal(vscode.Uri.parse('https://specs.md'));
      break;
    case 'copyCommand':
      analytics.trackWelcomeCopyCommandClicked();
      await vscode.env.clipboard.writeText('npx specsmd@latest install');
      break;
    case 'install':
      analytics.trackWelcomeInstallClicked();
      this._installClickedAt = Date.now(); // Store for duration calc
      await handleInstallCommand();
      break;
  }
});

// In installation watcher callback
const onProjectDetected = () => {
  const duration = this._installClickedAt ? Date.now() - this._installClickedAt : undefined;
  analytics.trackWelcomeInstallCompleted(duration);
};
```

## Estimate

**Size**: M
