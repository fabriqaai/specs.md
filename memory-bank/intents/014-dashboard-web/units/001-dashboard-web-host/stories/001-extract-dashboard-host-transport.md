---
story: 001-extract-dashboard-host-transport
unit: 001-dashboard-web-host
intent: 014-dashboard-web
status: complete
priority: Must
created: 2026-06-07T10:20:00.000Z
updated: 2026-06-07T10:20:00.000Z
implemented: true
---

# Story: Extract Dashboard Host Transport

## User Story

As a specsmd maintainer, I want the dashboard browser app to talk through a host adapter so the same UI can run inside VS Code and in a normal browser.

## Acceptance Criteria

- [ ] Dashboard browser code no longer requires `acquireVsCodeApi()` at module load in standalone mode.
- [ ] VS Code mode still posts messages through the VS Code API.
- [ ] Web mode can send actions to the local dashboard server.
- [ ] Host detection is isolated in one small module.

## Notes

The first implementation can keep the existing message shape and focus on making the host boundary explicit.
