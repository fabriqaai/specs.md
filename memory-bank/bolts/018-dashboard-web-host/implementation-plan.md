---
stage: plan
bolt: 018-dashboard-web-host
created: 2026-06-07T10:19:48Z
---

## Implementation Plan: Dashboard Web Host

### Objective

Ship a usable standalone dashboard web path for specsmd while preserving the existing terminal dashboard and VS Code dashboard behavior.

### Deliverables

- Add a host-adaptable dashboard browser transport so the Lit dashboard can load outside VS Code.
- Add a local dashboard web server under the npm package CLI.
- Route `dashboard` to the web server and preserve the terminal dashboard as `dashboard-cli`.
- Provide current workspace snapshots to the browser using existing dashboard parsers.
- Add live refresh from file changes to connected browser clients.
- Include dashboard web assets in package publishing.
- Update README/docs command examples.
- Add targeted tests for CLI command surface and web server snapshot behavior.

### Dependencies

- Existing CLI dashboard parsers under `src/lib/dashboard/`.
- Existing watch runtime under `src/lib/dashboard/runtime/watch-runtime.js`.
- Existing Lit dashboard components under `vs-code-extension/src/webview/`.
- Node.js built-in `http`, `url`, and `fs` modules.

### Technical Approach

Create a small standalone web host in `src/lib/dashboard/web/` that serves an HTML shell, static web assets, JSON snapshot endpoints, message/action endpoint, and a server-sent events stream for refreshes. Reuse the CLI dashboard parser modules and add a thin snapshot adapter for the web client.

Make the webview bundle safe outside VS Code by replacing direct `acquireVsCodeApi()` usage with a host adapter that selects VS Code transport when available and HTTP/EventSource transport otherwise.

Keep the first web dashboard read-oriented, with limited action handling for refresh and external URLs. The core win is usable local viewing and live updates.

### Acceptance Criteria

- [ ] `node src/bin/cli.js dashboard --path . --no-open` starts a local web server and prints a URL.
- [ ] `node src/bin/cli.js dashboard-cli --path . --no-watch` preserves terminal dashboard behavior.
- [ ] Browser bundle can initialize without `acquireVsCodeApi`.
- [ ] Web server returns a valid snapshot for this repo's AI-DLC memory bank.
- [ ] File changes trigger a browser update event.
- [ ] Package manifest includes static dashboard web assets.
- [ ] Documentation explains `dashboard` and `dashboard-cli`.
- [ ] Targeted tests pass.

### Risks

- Existing VS Code data shape differs from CLI dashboard snapshots. Mitigation: render a standalone web dashboard view from CLI snapshot first, while preserving the shared host boundary for Lit dashboard reuse.
- Package build may need asset copying from VS Code extension output. Mitigation: add a deterministic build/copy script or include source-generated browser assets under `src/lib/dashboard/web/public`.
- Browser action parity can expand scope. Mitigation: keep MVP actions minimal and document read-oriented behavior.
