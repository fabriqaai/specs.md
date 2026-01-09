---
stage: plan
bolt: bolt-vscode-analytics-core-1
created: 2025-01-09T10:05:00Z
---

## Implementation Plan: Analytics Core

### Objective

Create the foundational analytics infrastructure for the VS Code extension, implementing an AnalyticsTracker singleton that integrates with Mixpanel while ensuring zero impact on extension stability through comprehensive error isolation.

### Deliverables

- `vs-code-extension/src/analytics/tracker.ts` - AnalyticsTracker singleton class
- `vs-code-extension/src/analytics/machineId.ts` - Machine ID generation utilities
- `vs-code-extension/src/analytics/ideDetection.ts` - IDE environment detection
- `vs-code-extension/src/analytics/privacyControls.ts` - Privacy opt-out logic
- `vs-code-extension/src/analytics/index.ts` - Module exports
- Updated `vs-code-extension/package.json` - Telemetry settings contribution

### Dependencies

- **mixpanel** npm package: Event tracking SDK (or fetch-based alternative)
- **vscode**: VS Code Extension API (already a dev dependency)
- **crypto**: Node.js built-in for ID hashing

### Technical Approach

1. **AnalyticsTracker Singleton**
   - Singleton pattern matching npx installer (`src/lib/analytics/tracker.js`)
   - `init(context: ExtensionContext)` - Initialize tracker with extension context
   - `track(eventName, properties)` - Fire-and-forget event delivery
   - `isEnabled()` - Check if tracking is active
   - `getBaseProperties()` - Build base properties for all events

2. **Machine ID Generation**
   - SHA-256 hash of hostname + salt (matching npx installer pattern)
   - Store in `context.globalState` for persistence across sessions
   - Same salt as npx installer: `specsmd-analytics-v1`

3. **Session ID Generation**
   - UUID v4 generated fresh per activation
   - Use `crypto.randomUUID()` (Node.js 16+)

4. **IDE Detection**
   - Map `vscode.env.appName` to normalized IDE names
   - Support: VS Code, VS Code Insiders, VSCodium, Cursor, Windsurf, Positron
   - Fallback to sanitized appName for unknown IDEs
   - Capture `vscode.env.appHost` and `vscode.version`

5. **Privacy Controls**
   - Check `DO_NOT_TRACK=1` environment variable
   - Check `SPECSMD_TELEMETRY_DISABLED=1` environment variable
   - Check VS Code setting `specsmd.telemetry.enabled`
   - Privacy check before Mixpanel initialization

6. **Error Isolation**
   - All public methods wrapped in try-catch
   - Silent failures (console.debug only)
   - `init()` failure results in no-op mode
   - Network failures never throw

7. **Mixpanel Configuration**
   - Same token as npx installer: `f405d1fa631f91137f9bb8e0a0277653`
   - EU endpoint: `api-eu.mixpanel.com`
   - Fire-and-forget delivery

### Acceptance Criteria

- [ ] AnalyticsTracker class created as singleton
- [ ] Mixpanel initialized with EU endpoint (api-eu.mixpanel.com)
- [ ] Uses same project token as npx installer
- [ ] init() returns boolean indicating if tracking is enabled
- [ ] All initialization wrapped in try-catch
- [ ] Failed initialization results in disabled tracker (no-op mode)
- [ ] Tracker exposes track(eventName, properties) method
- [ ] track() is fire-and-forget (non-blocking)
- [ ] Machine ID is SHA-256 hash of salted hostname
- [ ] Machine ID is consistent across extension activations
- [ ] Machine ID stored in globalState for persistence
- [ ] Session ID is UUID v4 generated per activation
- [ ] Session ID is unique for each extension activation
- [ ] No personally identifiable information used in ID generation
- [ ] IDs included as distinct_id and session_id in base properties
- [ ] Detect IDE name from vscode.env.appName
- [ ] Normalize IDE names to lowercase kebab-case
- [ ] Detect VS Code, VS Code Insiders, VSCodium, Cursor, Windsurf, Positron
- [ ] Unknown IDEs default to sanitized lowercase appName
- [ ] Detect IDE host from vscode.env.appHost
- [ ] Capture IDE version from vscode.version
- [ ] Include ide_name, ide_version, ide_host in base properties
- [ ] Check DO_NOT_TRACK environment variable
- [ ] Check SPECSMD_TELEMETRY_DISABLED environment variable
- [ ] Add VS Code setting: specsmd.telemetry.enabled (default: true)
- [ ] Register setting in package.json contributes.configuration
- [ ] If any opt-out is active, tracker is disabled (no-op mode)
- [ ] Privacy check happens before Mixpanel initialization
- [ ] All public tracker methods wrapped in try-catch
- [ ] Errors are silently caught (console.debug only)
- [ ] No errors propagate to calling code
- [ ] Network failures do not throw
- [ ] Extension works fully when offline

### File Structure

```
vs-code-extension/src/analytics/
  index.ts           # Module exports
  tracker.ts         # AnalyticsTracker singleton
  machineId.ts       # Machine ID generation
  ideDetection.ts    # IDE environment detection
  privacyControls.ts # Privacy opt-out logic
  types.ts           # TypeScript interfaces
```

### Integration

The tracker will be initialized in `extension.ts` during activation and called from the extension code where events are needed. Future bolts will add specific event tracking methods.

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Mixpanel SDK adds bundle size | Use fetch-based tracking if needed |
| Network errors blocking activation | Fire-and-forget pattern, no await |
| Privacy concerns | Multiple opt-out options, transparent documentation |
