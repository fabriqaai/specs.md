---
story: 003-detect-ide-environment
unit: 001-analytics-core
intent: 012-vscode-extension-analytics
priority: must
status: complete
implemented: true
created: 2025-01-08T12:30:00Z
---

# Story: Detect IDE Environment

## User Story

**As a** specsmd maintainer
**I want** to detect which IDE the extension is running in
**So that** I can understand IDE distribution and compatibility

## Acceptance Criteria

- [ ] Detect IDE name from vscode.env.appName
- [ ] Normalize IDE names to lowercase kebab-case
- [ ] Detect VS Code, VS Code Insiders, VSCodium, Cursor, Windsurf, Positron
- [ ] Unknown IDEs default to sanitized lowercase appName
- [ ] Detect IDE host from vscode.env.appHost (desktop, web, codespaces)
- [ ] Capture IDE version from vscode.version
- [ ] Include ide_name, ide_version, ide_host in base properties

## Technical Notes

```typescript
// IDE detection mapping
const IDE_MAPPINGS: Record<string, string> = {
  'Visual Studio Code': 'vscode',
  'Visual Studio Code - Insiders': 'vscode-insiders',
  'VSCodium': 'vscodium',
  'Cursor': 'cursor',
  'Windsurf': 'windsurf',
  'Positron': 'positron',
};

function detectIDE(): IDEInfo {
  const appName = vscode.env.appName;
  return {
    name: IDE_MAPPINGS[appName] || appName.toLowerCase().replace(/\s+/g, '-'),
    version: vscode.version,
    host: vscode.env.appHost
  };
}
```

## Estimate

**Size**: S
