---
intent: 014-dashboard-web
created: 2026-06-07T10:16:53Z
completed: 2026-06-07T10:27:59Z
status: complete
---

# Inception Log: dashboard-web

## Overview

**Intent**: Make the specsmd dashboard run as both a VS Code dashboard and a standalone local web dashboard from the npm package.
**Type**: enhancement
**Created**: 2026-06-07

## Artifacts Created

| Artifact | Status | File |
|----------|--------|------|
| Requirements | Complete | requirements.md |
| System Context | Deferred | system-context.md |
| Units | Complete | units/001-dashboard-web-host/unit-brief.md |
| Stories | Complete | units/001-dashboard-web-host/stories/*.md |
| Bolt Plan | Complete | memory-bank/bolts/018-dashboard-web-host/bolt.md |

## Summary

| Metric | Count |
|--------|-------|
| Functional Requirements | 6 |
| Non-Functional Requirements | 3 |
| Units | 1 |
| Stories | 5 |
| Bolts Planned | 1 |

## Units Breakdown

| Unit | Stories | Bolts | Priority |
|------|---------|-------|----------|
| 001-dashboard-web-host | 5 | 1 | Must |

## Decision Log

| Date | Decision | Rationale | Approved |
|------|----------|-----------|----------|
| 2026-06-07 | Use AI-DLC memory-bank instead of initializing FIRE in this repo | Existing project planning uses `memory-bank/` intents and bolts | Yes |
| 2026-06-07 | Create separate `014-dashboard-web` intent | The web dashboard is related to terminal dashboard and VS Code extension work but has distinct scope | Yes |
| 2026-06-07 | Execute as one simple construction bolt | The first usable web dashboard path spans command, server, UI, docs, and tests but can ship as one cohesive slice | Yes |

## Scope Changes

| Date | Change | Reason | Impact |
|------|--------|--------|--------|

## Ready for Construction

**Checklist**:
- [x] All requirements documented
- [x] System context defined (deferred; host boundaries captured in unit brief)
- [x] Units decomposed
- [x] Stories created for all units
- [x] Bolts planned
- [x] Human review complete (yolo execution requested)

## Next Steps

1. Use `npx specsmd dashboard` for local web dashboard.
2. Use `npx specsmd dashboard-cli` for terminal dashboard.
3. Plan follow-up bolts for full VS Code/web UI unification and action parity.

## Dependencies

- Existing VS Code extension dashboard source under `vs-code-extension/src/webview/`
- Existing dashboard parsers and terminal dashboard command under `src/lib/dashboard/`
