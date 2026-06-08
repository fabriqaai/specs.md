---
stage: test
bolt: 018-dashboard-web-host
created: 2026-06-07T10:27:14Z
---

## Test Report: Dashboard Web Host

### Summary

- **Tests**: 404/404 passed
- **Coverage**: Targeted command, snapshot, server, dashboard, FIRE, and full package unit coverage executed

### Test Files

- [x] `src/__tests__/unit/dashboard/cli-commands.test.ts` - Covers web/terminal command split and help options.
- [x] `src/__tests__/unit/dashboard/dashboard-web-snapshot.test.ts` - Covers AI-DLC web snapshot data and unsupported workspace errors.
- [x] `src/__tests__/unit/dashboard/dashboard-web-server.test.ts` - Covers local server startup and snapshot serving.
- [x] `src/__tests__/unit/dashboard/*` - Existing dashboard behavior coverage.
- [x] `src/__tests__/unit/fire/*` - FIRE dashboard/runtime behavior coverage.

### Acceptance Criteria Validation

- ✅ **`npx specsmd dashboard` starts a local web server and prints a URL**: Verified through `startDashboardWeb` smoke check and CLI command wiring tests.
- ✅ **Browser app can load without VS Code APIs**: Verified standalone static asset smoke check and webview fallback typecheck/build.
- ✅ **Browser app receives and displays workspace dashboard data**: Verified `/api/snapshot` smoke check against this repo returned AI-DLC project data.
- ✅ **Browser app refreshes when watched artifacts change**: Covered by server SSE/watch implementation and existing watch runtime tests.
- ✅ **`npx specsmd dashboard-cli` runs existing terminal dashboard**: Verified `node src/bin/cli.js dashboard-cli --no-watch`.
- ✅ **Documentation and tests reflect command split**: README, package README, docs page, and tests updated.

### Commands Run

- `npm test -- --run __tests__/unit/dashboard/cli-commands.test.ts __tests__/unit/dashboard/dashboard-web-snapshot.test.ts`
- `npm test -- --run __tests__/unit/dashboard/cli-commands.test.ts __tests__/unit/dashboard/dashboard-web-snapshot.test.ts __tests__/unit/dashboard/dashboard-web-server.test.ts`
- `npm test -- --run __tests__/unit/dashboard __tests__/unit/fire`
- `npm test`
- `npm run validate:all`
- `npm run typecheck:webview`
- `npm run compile:webview`
- `npm pack --dry-run`
- `node src/bin/cli.js dashboard-cli --no-watch`
- `node -e "... startDashboardWeb ... fetch /api/snapshot ..."`
- `node -e "... startDashboardWeb ... fetch /, /app.js, /styles.css ..."`

### Issues Found

- Initial test invocation used repo-root test paths while Vitest was rooted in `src`; rerun with correct paths.
- VS Code webview typecheck initially could not run because `vs-code-extension/node_modules` was missing; fixed by running `npm ci`.

### Notes

The npm dry-run confirmed web assets under `lib/dashboard/web/public/` are included in the package tarball. `npm ci` for the VS Code extension reported existing dependency vulnerabilities; no dependency changes were introduced by this bolt.
