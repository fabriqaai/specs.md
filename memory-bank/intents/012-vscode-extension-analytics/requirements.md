---
intent: 012-vscode-extension-analytics
phase: inception
status: complete
created: 2025-01-08T12:00:00.000Z
updated: 2025-01-08T12:00:00.000Z
---

# Requirements: VS Code Extension Analytics

## Intent Overview

Add Mixpanel analytics to the specsmd VS Code extension to track adoption, feature usage, and error patterns. This mirrors the existing `007-installer-analytics` implementation for the npx package, extending telemetry coverage to the IDE extension experience.

## Business Goals

| Goal | Success Metric | Priority |
|------|----------------|----------|
| Track extension adoption across IDEs | Count of unique `extension_activated` events by `ide_name` | Must |
| Measure onboarding funnel conversion | `welcome_view_displayed` → `welcome_install_completed` ratio | Must |
| Understand feature engagement | Distribution of `bolt_action` and `tab_changed` events | Should |
| Identify error patterns by IDE | Error events grouped by `ide_name` and `error_category` | Should |
| Track project health metrics | `project_snapshot` event aggregates | Could |

---

## Functional Requirements

### FR-1: Analytics Core Module
- **Description**: Create a TypeScript analytics tracker module for the VS Code extension with Mixpanel integration
- **Acceptance Criteria**:
  - Tracker initializes with Mixpanel EU endpoint
  - Generates consistent machine ID (matching npx tracker pattern)
  - Generates unique session ID per activation
  - Fire-and-forget event delivery (non-blocking)
  - **CRITICAL: All analytics code wrapped in try-catch - NEVER throw errors**
  - **CRITICAL: Mixpanel failures silently ignored - extension must remain stable**
  - **CRITICAL: Network timeouts/failures do not propagate to extension**
  - Graceful degradation: if analytics fails to init, all track calls become no-ops
- **Priority**: Must
- **Related Stories**: TBD

### FR-2: IDE Detection
- **Description**: Detect and normalize the IDE name and host environment
- **Acceptance Criteria**:
  - Detects VS Code, VS Code Insiders, VSCodium, Cursor, Windsurf, Positron
  - Normalizes `ide_name` to lowercase kebab-case
  - Captures `ide_host` (desktop, web, codespaces)
  - Captures `ide_version` from vscode.version
- **Priority**: Must
- **Related Stories**: TBD

### FR-3: Privacy Controls
- **Description**: Respect user privacy preferences and opt-out mechanisms
- **Acceptance Criteria**:
  - Respects `DO_NOT_TRACK` environment variable
  - Respects `SPECSMD_TELEMETRY_DISABLED` environment variable
  - Adds VS Code setting `specsmd.telemetry.enabled` (default: true)
  - No PII collected (no file paths, project names, user content)
  - Uses Mixpanel EU endpoint for GDPR compliance
- **Priority**: Must
- **Related Stories**: TBD

### FR-4: Lifecycle Events
- **Description**: Track extension activation and first-run detection
- **Acceptance Criteria**:
  - `extension_activated` fires on each activation with `is_specsmd_project`, `is_first_activation`
  - Detects first-time install via globalState persistence
  - Includes base properties (ide_name, ide_version, platform, locale)
- **Priority**: Must
- **Related Stories**: TBD

### FR-5: Welcome View Funnel Events
- **Description**: Track onboarding funnel for non-specsmd workspaces
- **Acceptance Criteria**:
  - `welcome_view_displayed` when welcome view is shown
  - `welcome_copy_command_clicked` when user copies npx command
  - `welcome_install_clicked` when user clicks install button
  - `welcome_website_clicked` when user clicks learn more link
  - `welcome_install_completed` when installation watcher detects success
- **Priority**: Must
- **Related Stories**: TBD

### FR-6: Engagement Events
- **Description**: Track feature usage in the explorer view
- **Acceptance Criteria**:
  - `tab_changed` with `from_tab` and `to_tab` properties
  - `bolt_action` with `action`, `bolt_type`, `bolt_status` properties
  - `artifact_opened` with `artifact_type` and `source` properties
  - `filter_changed` with `filter_type` and `filter_value` properties
- **Priority**: Should
- **Related Stories**: TBD

### FR-7: Error Tracking
- **Description**: Capture and categorize extension errors
- **Acceptance Criteria**:
  - `extension_error` event with `error_category`, `error_code`, `component`, `recoverable`
  - Error categories: activation, parse, file_op, webview, command
  - Sanitized error info (no file paths or stack traces with user code)
  - Centralized error handler for consistent tracking
- **Priority**: Should
- **Related Stories**: TBD

### FR-8: Project Metrics Events
- **Description**: Track project structure and changes
- **Acceptance Criteria**:
  - `project_snapshot` fires once per activation with entity counts
  - `project_changed` fires on meaningful count changes (delta-based)
  - Includes intent_count, unit_count, story_count, bolt_count, bolt status breakdown
  - Includes avg_units_per_intent, avg_stories_per_unit
  - Debounced (5 seconds) and rate-limited (max 5 per minute)
- **Priority**: Could
- **Related Stories**: TBD

---

## Non-Functional Requirements

### Performance
| Requirement | Metric | Target |
|-------------|--------|--------|
| Event delivery | Non-blocking | Fire-and-forget |
| Extension startup | Activation overhead | < 50ms |
| Memory usage | Analytics module size | < 100KB |

### Reliability
| Requirement | Metric | Target |
|-------------|--------|--------|
| Silent failures | Extension stability | **NEVER break extension under any circumstances** |
| Event delivery | Best effort | No retries, no queuing |
| Error isolation | Analytics errors | 100% caught, 0% propagated |
| Init failure | Graceful degradation | All tracking becomes no-op |
| Network failure | No impact | Extension works fully offline |

### Privacy
| Requirement | Standard | Notes |
|-------------|----------|-------|
| Data minimization | GDPR | Only essential data |
| Opt-out support | Industry standard | Multiple opt-out mechanisms |
| EU endpoint | GDPR | Mixpanel EU region |

---

## Constraints

### Technical Constraints

**Project-wide standards**: Will use existing tech stack (TypeScript, VS Code Extension API)

**Intent-specific constraints**:
- Must use same Mixpanel project token as npx installer for unified analytics
- Must follow VS Code extension telemetry best practices
- Cannot use Node.js-specific APIs (must work in web extension context if applicable)

### Business Constraints
- Implementation should reuse patterns from `src/lib/analytics/` where applicable
- Events should align with existing npx installer event naming conventions

---

## Assumptions

| Assumption | Risk if Invalid | Mitigation |
|------------|-----------------|------------|
| Mixpanel browser SDK works in VS Code webview context | May need alternative approach | Test early, fallback to fetch-based tracking |
| `vscode.env.appName` reliably identifies IDEs | Missing IDE detection | Fallback to "unknown" + log for analysis |
| Users generally accept telemetry by default | Lower data volume | Clear value proposition in docs |

---

## Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| Should we use Mixpanel Node SDK or browser SDK? | Dev | Before implementation | Pending |
| Do we need web extension compatibility? | Product | Before implementation | Pending |
| Should events be batched or sent immediately? | Dev | Before implementation | Pending |
