---
intent: 014-dashboard-web
phase: inception
status: complete
created: 2026-06-07T10:16:53.000Z
updated: 2026-06-07T10:16:53.000Z
---

# Requirements: Dashboard Web

## Intent Overview

Make the specsmd dashboard available as a standalone local web app while preserving the VS Code extension dashboard experience. The same dashboard source should run inside VS Code and from the npm package, where `npx specsmd dashboard` starts a local web server for the current workspace. The existing terminal dashboard should remain available as `dashboard-cli`.

## Business Goals

| Goal | Success Metric | Priority |
|------|----------------|----------|
| Support users who do not code in VS Code | Users can run the dashboard from any project terminal with `npx specsmd dashboard` | Must |
| Reuse dashboard UI across VS Code and web | Shared Lit dashboard source powers both hosts without duplicated UI logic | Must |
| Improve dashboard responsiveness beyond terminal TUI limits | Web dashboard loads and refreshes project state faster than the existing terminal dashboard for common workspaces | Must |
| Preserve existing terminal workflows | Current terminal dashboard remains available through `dashboard-cli` | Should |

---

## Functional Requirements

### FR-1: Standalone Web Dashboard Command

- **Description**: The npm package SHALL expose `npx specsmd dashboard` as a local web dashboard command.
- **Acceptance Criteria**: Running the command from a specsmd workspace starts a local server, prints the local URL, and displays dashboard state for the current directory.
- **Priority**: Must
- **Related Stories**: TBD

### FR-2: Shared Dashboard Source

- **Description**: The VS Code extension and standalone web dashboard SHALL share the same dashboard UI source where practical.
- **Acceptance Criteria**: Browser-side dashboard components do not directly depend on `acquireVsCodeApi`; host-specific behavior is routed through an adapter.
- **Priority**: Must
- **Related Stories**: TBD

### FR-3: Host-Neutral Data Contract

- **Description**: Dashboard state SHALL be provided through a host-neutral message/data contract usable by both VS Code and the local web server.
- **Acceptance Criteria**: VS Code and standalone web hosts can both send initial data, refresh data, flow data, and UI state updates through the same documented contract.
- **Priority**: Must
- **Related Stories**: TBD

### FR-4: Workspace Analysis

- **Description**: The standalone dashboard SHALL inspect the current directory and detect existing specsmd planning structures.
- **Acceptance Criteria**: The web dashboard detects AI-DLC `memory-bank/`, FIRE `.specs-fire/`, and Simple `specs/` structures using the same dashboard parsing semantics as the CLI dashboard.
- **Priority**: Must
- **Related Stories**: TBD

### FR-5: Live Refresh

- **Description**: The standalone dashboard SHALL update as planning artifacts change on disk.
- **Acceptance Criteria**: Changes to watched specsmd files refresh the browser view without restarting the server.
- **Priority**: Must
- **Related Stories**: TBD

### FR-6: Terminal Dashboard Preservation

- **Description**: The existing terminal dashboard SHALL be renamed to `dashboard-cli`.
- **Acceptance Criteria**: Existing terminal dashboard behavior and options are available through `npx specsmd dashboard-cli`; documentation distinguishes web and CLI dashboard commands.
- **Priority**: Should
- **Related Stories**: TBD

---

## Non-Functional Requirements

### Performance

| Requirement | Metric | Target |
|-------------|--------|--------|
| Initial web dashboard load | Time from command start to usable browser UI | TBD during requirements checkpoint |
| Refresh latency | File change to visible UI update | TBD during requirements checkpoint |

### Compatibility

| Requirement | Metric | Target |
|-------------|--------|--------|
| Runtime | Node.js version | Match npm package engine support |
| Hosts | Dashboard UI hosts | VS Code webview and modern local browser |

### Security

| Requirement | Standard | Notes |
|-------------|----------|-------|
| Local server binding | Loopback only | Bind to localhost/127.0.0.1 by default |
| File access | Workspace scoped | Do not expose arbitrary filesystem reads |

---

## Constraints

### Technical Constraints

- Must preserve the existing VS Code extension dashboard behavior.
- Must avoid duplicating the dashboard UI into a separate fork.
- Must keep npm package publishing practical, including static web assets in package files.
- Must maintain support for existing AI-DLC, FIRE, and Simple dashboard parsing behavior.

### Business Constraints

- Existing terminal users should retain a working command path.
- The first implementation should be an experiment-friendly dashboard web path, not a broad product rewrite.

---

## Assumptions

| Assumption | Risk if Invalid | Mitigation |
|------------|-----------------|------------|
| The Lit webview components are portable enough to reuse | Larger refactor required | Introduce host adapters incrementally and keep VS Code tests passing |
| CLI dashboard parsers can serve standalone web data needs | Data contract gaps appear | Extract or normalize parser outputs before wiring UI |
| Users are comfortable opening a local browser URL from an NPX command | Lower adoption | Print URL clearly and optionally auto-open later |

---

## Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| Should `npx specsmd dashboard` auto-open the browser or only print the URL? | Product | TBD | Pending |
| Should `dashboard-cli` be the only terminal command or should old `dashboard --terminal` compatibility exist temporarily? | Product | TBD | Pending |
| Which browser actions are in MVP: read-only, open files, start/continue work, or all current VS Code actions? | Product/Engineering | TBD | Pending |
