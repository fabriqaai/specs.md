---
id: 018-dashboard-web-host
unit: 001-dashboard-web-host
intent: 014-dashboard-web
type: simple-construction-bolt
status: complete
stories:
  - 001-extract-dashboard-host-transport
  - 002-serve-dashboard-web-from-cli
  - 003-feed-browser-dashboard-snapshots
  - 004-preserve-terminal-dashboard-cli
  - 005-verify-and-document-dashboard-web
created: 2026-06-07T10:20:00.000Z
started: 2026-06-07T10:19:48.000Z
completed: "2026-06-07T10:27:59Z"
current_stage: null
stages_completed:
  - name: plan
    completed: 2026-06-07T10:19:48.000Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2026-06-07T10:27:14.000Z
    artifact: implementation-walkthrough.md
  - name: test
    completed: 2026-06-07T10:27:14.000Z
    artifact: test-walkthrough.md
requires_bolts: []
enables_bolts: []
requires_units: []
blocks: false
complexity:
  avg_complexity: 3
  avg_uncertainty: 3
  max_dependencies: 2
  testing_scope: 3
---

# Bolt: 018-dashboard-web-host

## Overview

Implement the first usable standalone web dashboard path for specsmd. This bolt makes `dashboard` web-first, preserves the terminal dashboard as `dashboard-cli`, and introduces the host boundary needed for the dashboard browser code to run outside VS Code.

## Objective

Users can run `npx specsmd dashboard` in a specsmd workspace and open a local browser dashboard backed by current workspace state. Existing terminal dashboard behavior remains available through `npx specsmd dashboard-cli`.

## Stories Included

- **001-extract-dashboard-host-transport**: Make browser dashboard messaging host-adaptable (Must)
- **002-serve-dashboard-web-from-cli**: Start and serve local dashboard from CLI (Must)
- **003-feed-browser-dashboard-snapshots**: Provide workspace snapshots and live refresh (Must)
- **004-preserve-terminal-dashboard-cli**: Keep terminal dashboard available (Should)
- **005-verify-and-document-dashboard-web**: Add tests/docs/package verification (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Plan**: Create implementation plan
- [ ] **2. Implement**: Build host adapter, local server, CLI command wiring, docs/package updates
- [ ] **3. Test**: Verify command behavior, server behavior, package assets, and existing tests

## Dependencies

### Requires

- Existing VS Code extension Lit dashboard source
- Existing terminal dashboard parsers/runtime

### Enables

- Future dashboard action parity work
- Future UI polish for standalone browser layout

## Files to Modify

```text
src/bin/cli.js
src/lib/dashboard/
src/package.json
src/__tests__/unit/dashboard/
vs-code-extension/src/webview/
vs-code-extension/esbuild.webview.mjs
README.md
src/README.md
docs.specs.md/getting-started/cli-dashboard.mdx
```

## Success Criteria

- [ ] `npx specsmd dashboard` starts a local web server and prints a URL.
- [ ] Browser app can load without VS Code APIs.
- [ ] Browser app receives and displays workspace dashboard data.
- [ ] Browser app refreshes when watched artifacts change.
- [ ] `npx specsmd dashboard-cli` runs the existing terminal dashboard.
- [ ] Documentation and tests reflect the new command split.

## Notes

Use a pragmatic first implementation. The standalone browser dashboard can begin with read-oriented actions as long as the command is usable and the host boundary is in place.
