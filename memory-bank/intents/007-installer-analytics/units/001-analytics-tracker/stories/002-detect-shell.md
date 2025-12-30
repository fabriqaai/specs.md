---
id: 002-detect-shell
unit: 001-analytics-tracker
intent: 007-installer-analytics
status: ready
priority: must
created: 2025-12-28T12:30:00Z
assigned_bolt: 016-analytics-tracker
implemented: false
---

# Story: Detect Shell Environment

## User Story

**As a** specsmd analytics system
**I want** to detect the user's shell/terminal environment
**So that** I can understand which terminals are most popular among users

## Acceptance Criteria

- [ ] **Given** user is on macOS/Linux with zsh, **When** detecting shell, **Then** return "zsh"
- [ ] **Given** user is on macOS/Linux with bash, **When** detecting shell, **Then** return "bash"
- [ ] **Given** user is on Windows with PowerShell, **When** detecting shell, **Then** return "powershell"
- [ ] **Given** user is on Windows with cmd.exe, **When** detecting shell, **Then** return "cmd"
- [ ] **Given** shell cannot be determined, **When** detecting shell, **Then** return "unknown"
- [ ] **Given** user is using fish shell, **When** detecting shell, **Then** return "fish"

## Technical Notes

- On Unix: Check `process.env.SHELL` and extract basename
- On Windows: Check `process.env.ComSpec` for powershell/pwsh/cmd
- Common shells: zsh, bash, fish, sh, dash, powershell, pwsh, cmd

```typescript
function detectShell(): string {
  if (process.platform === 'win32') {
    const comspec = process.env.ComSpec?.toLowerCase() || '';
    if (comspec.includes('powershell') || comspec.includes('pwsh')) return 'powershell';
    if (comspec.includes('cmd')) return 'cmd';
    return 'unknown';
  }
  const shell = process.env.SHELL || '';
  const basename = shell.split('/').pop() || 'unknown';
  return basename;
}
```

## Dependencies

### Requires
- None

### Enables
- 001-initialize-mixpanel (provides shell property for base properties)

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| SHELL env var not set | Return "unknown" |
| ComSpec not set on Windows | Return "unknown" |
| Custom/unusual shell | Return basename as-is |

## Out of Scope

- Shell version detection
- Terminal emulator detection (iTerm, Terminal.app, etc.)
