---
intent: vscode-extension
created: 2025-12-25T16:45:00Z
completed: 2025-12-25T18:30:00Z
status: complete
---

# Inception Log: vscode-extension

## Overview

**Intent**: VS Code extension with dashboard sidebar for browsing AI-DLC memory-bank artifacts
**Type**: green-field
**Created**: 2025-12-25

## Artifacts Created

| Artifact | Status | File |
|----------|--------|------|
| Requirements | ✅ | requirements.md |
| System Context | ✅ | system-context.md |
| Units | ✅ | units.md |
| Stories | ✅ | units/{unit-name}/stories/*.md (17 stories) |
| Bolt Plan | ✅ | memory-bank/bolts/bolt-*.md (6 bolts) |

## Summary

| Metric | Count |
|--------|-------|
| Functional Requirements | 7 (FR-1 to FR-7) |
| Future Requirements | 2 (FR-8, FR-9) |
| Non-Functional Requirements | 4 |
| Units | 5 |
| Stories | 17 |
| Bolts Planned | 6 |

## Units Breakdown

| Unit | Stories | Bolts | Priority |
|------|---------|-------|----------|
| artifact-parser | 4 | bolt-artifact-parser-1 | Foundation |
| file-watcher | 2 | bolt-file-watcher-1 | Core |
| sidebar-provider | 5 | bolt-sidebar-provider-1, bolt-sidebar-provider-2 | Core |
| welcome-view | 3 | bolt-welcome-view-1 | Core |
| extension-core | 3 | bolt-extension-core-1 | Final |

## Decision Log

| Date | Decision | Rationale | Approved |
|------|----------|-----------|----------|
| 2025-12-25 | Separate extension, not fabriqa fork | Clean separation, different purpose | Yes |
| 2025-12-25 | Dashboard only (no editor) Phase 1 | Reduce scope, faster delivery | Yes |
| 2025-12-25 | Use default VS Code editor | Leverage existing tools | Yes |
| 2025-12-25 | Location: vs-code-extension/ | Keep in specsmd monorepo | Yes |
| 2025-12-25 | No multi-root workspace support | Simplify implementation | Yes |
| 2025-12-25 | Show ALL bolt stages (not just current) | Better visibility of progress | Yes |
| 2025-12-25 | Extension name: "specsmd extension" | Consistent branding | Yes |
| 2025-12-25 | Add installation prompt for new projects | Onboarding experience | Yes |
| 2025-12-25 | Use favicon.png for activity bar icon | Consistent branding | Yes |
| 2025-12-25 | Add pixel logo fadeout footer in sidebar | Brand presence | Yes |
| 2025-12-25 | Add refresh button in sidebar title bar | Manual refresh option | Yes |
| 2025-12-25 | Real-time updates is Must priority | Core functionality | Yes |
| 2025-12-25 | Specific status icons (gray/yellow/green) | Clear visual language | Yes |
| 2025-12-25 | Sort intents by number prefix | Logical ordering | Yes |
| 2025-12-25 | Bolts: in-progress first, configurable grouping | Prioritize active work | Yes |

## Scope Changes

| Date | Change | Reason | Impact |
|------|--------|--------|--------|

## Ready for Construction

**Checklist**:
- [x] All requirements documented
- [x] System context defined
- [x] Units decomposed
- [x] Stories created for all units
- [x] Bolts planned
- [x] Human review complete (Checkpoint 3 approved)

## Bolt Execution Order

1. **bolt-artifact-parser-1** (foundation - no dependencies)
2. **bolt-file-watcher-1** (depends on artifact-parser)
3. **bolt-sidebar-provider-1** (depends on artifact-parser)
4. **bolt-sidebar-provider-2** (depends on sidebar-provider-1)
5. **bolt-welcome-view-1** (depends on artifact-parser, file-watcher)
6. **bolt-extension-core-1** (final - depends on all above)

## Next Steps

Start Construction Phase:
1. Run `/specsmd-construction-agent`
2. Begin with `bolt-artifact-parser-1`
3. Follow bolt execution order above

## Dependencies

- Requires stable memory-bank schema (memory-bank.yaml)
- No dependencies on other specsmd intents
