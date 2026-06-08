---
unit: 001-dashboard-web-host
intent: 014-dashboard-web
phase: inception
status: complete
created: 2026-06-07T10:20:00Z
updated: 2026-06-07T10:20:00Z
unit_type: cli-web
bolt_type: simple-construction-bolt
---

# Unit Brief: Dashboard Web Host

## Purpose

Make the existing specsmd dashboard available as a local browser app from the npm package while preserving the VS Code dashboard and terminal dashboard workflows.

## Scope

### In Scope

- Host-neutral browser transport for dashboard UI messages
- Standalone local web dashboard command at `npx specsmd dashboard`
- Existing terminal dashboard moved to `npx specsmd dashboard-cli`
- Workspace detection and dashboard data loading for AI-DLC, FIRE, and Simple flows
- Live refresh when dashboard artifacts change
- Package and documentation wiring for the new command shape

### Out of Scope

- Replacing the full VS Code extension host implementation in one pass
- Implementing all VS Code-only actions in the browser dashboard
- Remote or multi-user dashboard hosting
- Authentication for non-local network access

---

## Assigned Requirements

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Standalone web dashboard command | Must |
| FR-2 | Shared dashboard source | Must |
| FR-3 | Host-neutral data contract | Must |
| FR-4 | Workspace analysis | Must |
| FR-5 | Live refresh | Must |
| FR-6 | Terminal dashboard preservation | Should |

---

## Domain Concepts

### Key Entities

| Entity | Description | Attributes |
|--------|-------------|------------|
| Dashboard Host | Runtime environment for the dashboard UI | vscode, web |
| Dashboard Snapshot | Parsed state for current workspace | flow, project, intents, runs, bolts |
| Host Transport | Browser-to-host message bridge | postMessage, subscribe |
| Dashboard Server | Local Node server for standalone web | port, workspacePath, watcher |

### Key Operations

| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| startDashboardWeb | Start local browser dashboard | workspace path, options | local URL |
| loadDashboardSnapshot | Parse current workspace state | workspace path, flow | dashboard data |
| sendDashboardUpdate | Push refreshed state to browser | snapshot | browser message |
| handleDashboardAction | Handle UI action from browser | action message | side effect or response |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 5 |
| Must Have | 4 |
| Should Have | 1 |
| Could Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | Extract dashboard host transport | Must | Ready |
| 002 | Serve dashboard web from npm CLI | Must | Ready |
| 003 | Feed browser dashboard with workspace snapshots | Must | Ready |
| 004 | Preserve terminal dashboard as dashboard-cli | Should | Ready |
| 005 | Verify and document dashboard command behavior | Must | Ready |

---

## Dependencies

### Depends On

| Unit | Reason |
|------|--------|
| 008-terminal-dashboard | Existing CLI dashboard parser and terminal TUI |
| 011-vscode-extension | Existing Lit webview dashboard source |

### Depended By

None

### External Dependencies

| System | Purpose | Risk |
|--------|---------|------|
| Node.js HTTP server | Serve local dashboard | Low |
| Browser EventSource or fetch | Live updates/action bridge | Low |
| chokidar | Watch workspace files | Low, already used by CLI dashboard |

---

## Technical Context

### Suggested Technology

- Node.js CommonJS for npm package command/server code
- Lit web components for browser dashboard UI
- Existing dashboard parsers under `src/lib/dashboard/`
- Existing webview bundle source under `vs-code-extension/src/webview/`

### Integration Points

| Integration | Type | Protocol |
|-------------|------|----------|
| `src/bin/cli.js` | CLI | commander commands |
| `src/lib/dashboard/` | Parser/runtime | require/import |
| `vs-code-extension/src/webview/` | UI source | browser bundle |
| npm package `files` | Distribution | static assets included |

### Data Storage

No persistent application data. UI preferences may remain in host-specific state later.

---

## Constraints

- Must not break VS Code extension dashboard behavior.
- Must keep local web server loopback-only.
- Must restrict browser-exposed file operations to the selected workspace.
- Must keep terminal dashboard available for users who prefer or need it.

---

## Success Criteria

### Functional

- [ ] `npx specsmd dashboard` starts a local web dashboard for the current workspace.
- [ ] Browser dashboard renders real workspace data.
- [ ] Browser dashboard refreshes after relevant file changes.
- [ ] `npx specsmd dashboard-cli` runs the existing terminal dashboard.
- [ ] VS Code dashboard browser bundle can still build.

### Non-Functional

- [ ] Local server binds to loopback by default.
- [ ] Tests cover command routing and web server snapshot behavior.
- [ ] Documentation names both web and CLI dashboard commands.

### Quality

- [ ] Host-specific code is isolated behind adapters.
- [ ] No broad UI fork is introduced.
- [ ] Existing dashboard tests continue to pass.

---

## Bolt Suggestions

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| 018-dashboard-web-host | simple | 001, 002, 003, 004, 005 | Ship a usable standalone web dashboard path |

---

## Notes

This is intentionally one pragmatic bolt to get a working local dashboard. Later bolts can improve polish, action parity, and deeper code sharing.
