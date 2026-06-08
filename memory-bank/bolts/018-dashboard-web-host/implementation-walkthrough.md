---
stage: implement
bolt: 018-dashboard-web-host
created: 2026-06-07T10:27:14Z
---

## Implementation Walkthrough: Dashboard Web Host

### Summary

Built a standalone local web dashboard path for the npm CLI and preserved the existing terminal dashboard under a new command. Added a browser-safe dashboard host boundary for VS Code webview source and documented the new command split.

### Structure Overview

The implementation keeps terminal dashboard parsing in the existing dashboard modules and adds a new web host layer beside them. The web host serves static browser assets, exposes snapshot/action endpoints, and streams refreshes to connected browsers. CLI command routing now separates web dashboard from terminal dashboard.

### Completed Work

- [x] `src/bin/cli.js` - Routes `dashboard` to the local web server and `dashboard-cli` to the existing terminal dashboard.
- [x] `src/lib/dashboard/web/snapshot.js` - Converts existing dashboard parser output into web dashboard data.
- [x] `src/lib/dashboard/web/server.js` - Hosts local HTTP routes, snapshot API, action endpoint, SSE refresh stream, and loopback binding.
- [x] `src/lib/dashboard/web/public/index.html` - Provides the standalone dashboard browser shell.
- [x] `src/lib/dashboard/web/public/app.js` - Renders dashboard data and connects to refresh/action endpoints.
- [x] `src/lib/dashboard/web/public/styles.css` - Provides responsive dashboard styling.
- [x] `vs-code-extension/src/webview/vscode-api.ts` - Adds standalone fallback transport so webview source can load outside VS Code.
- [x] `vs-code-extension/src/webview/lit/index.ts` - Removes eager VS Code API acquisition from the entrypoint comment/import path.
- [x] `src/__tests__/unit/dashboard/cli-commands.test.ts` - Covers command help and option routing.
- [x] `src/__tests__/unit/dashboard/dashboard-web-snapshot.test.ts` - Covers web snapshot data for AI-DLC and unsupported workspaces.
- [x] `src/__tests__/unit/dashboard/dashboard-web-server.test.ts` - Covers local server snapshot serving.
- [x] `README.md` - Documents web dashboard and terminal dashboard commands.
- [x] `src/README.md` - Documents package README command changes.
- [x] `docs.specs.md/getting-started/cli-dashboard.mdx` - Updates docs to explain web and terminal dashboards.

### Key Decisions

- **Use existing parser outputs**: Reused `src/lib/dashboard` parser modules to avoid another project-state parser.
- **Make web dashboard read-first**: Kept the first standalone release focused on viewing and refreshing state, with limited safe local actions.
- **Bind locally by default**: The server binds to `127.0.0.1` unless the user explicitly changes host.
- **Preserve terminal command separately**: Kept existing terminal behavior behind `dashboard-cli`.

### Deviations from Plan

The standalone web dashboard uses a small purpose-built browser view for the npm package rather than bundling the full VS Code Lit app. The VS Code Lit source now has a standalone-safe transport boundary, but full UI unification can continue in a follow-up bolt.

### Dependencies Added

None.

### Developer Notes

The web server intentionally keeps action handling narrow. File opening is workspace-scoped, external opening only allows HTTP(S), and unsupported UI messages are accepted but ignored.
