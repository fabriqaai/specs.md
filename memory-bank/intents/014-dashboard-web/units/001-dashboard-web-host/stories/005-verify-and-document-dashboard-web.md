---
story: 005-verify-and-document-dashboard-web
unit: 001-dashboard-web-host
intent: 014-dashboard-web
status: complete
priority: Must
created: 2026-06-07T10:20:00.000Z
updated: 2026-06-07T10:20:00.000Z
implemented: true
---

# Story: Verify and Document Dashboard Web

## User Story

As a specsmd user, I want documentation and tests that make the new dashboard command behavior clear and reliable.

## Acceptance Criteria

- [ ] Unit tests cover command routing and standalone snapshot behavior.
- [ ] Relevant docs/README examples use `dashboard` for web and `dashboard-cli` for terminal.
- [ ] Package files include the browser dashboard assets needed by npm users.
- [ ] Verification includes running targeted tests and a local dashboard smoke check.

## Notes

Documentation should avoid overselling action parity if MVP browser actions are read-only or limited.
