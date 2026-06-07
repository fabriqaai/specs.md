---
story: 003-feed-browser-dashboard-snapshots
unit: 001-dashboard-web-host
intent: 014-dashboard-web
status: complete
priority: Must
created: 2026-06-07T10:20:00.000Z
updated: 2026-06-07T10:20:00.000Z
implemented: true
---

# Story: Feed Browser Dashboard Snapshots

## User Story

As a specsmd user, I want the browser dashboard to show the same project state the terminal dashboard understands.

## Acceptance Criteria

- [ ] Web server detects AI-DLC, FIRE, and Simple flows with existing dashboard detection semantics.
- [ ] Web server exposes an initial dashboard snapshot to the browser.
- [ ] Browser receives updates after watched files change.
- [ ] Unsupported workspaces show a clear error state.

## Notes

Prefer reusing `src/lib/dashboard` parsers over creating another parser path.
