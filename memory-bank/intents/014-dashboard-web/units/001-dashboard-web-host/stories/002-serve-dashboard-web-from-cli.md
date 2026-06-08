---
story: 002-serve-dashboard-web-from-cli
unit: 001-dashboard-web-host
intent: 014-dashboard-web
status: complete
priority: Must
created: 2026-06-07T10:20:00.000Z
updated: 2026-06-07T10:20:00.000Z
implemented: true
---

# Story: Serve Dashboard Web From CLI

## User Story

As a specsmd user, I want to run `npx specsmd dashboard` from my project directory and get a local web dashboard.

## Acceptance Criteria

- [ ] `dashboard` command starts a loopback local HTTP server.
- [ ] Command prints the dashboard URL.
- [ ] Server serves an HTML shell and browser bundle.
- [ ] Server uses the command's `--path` or current directory as the workspace.

## Notes

The command should not expose the dashboard on public network interfaces by default.
