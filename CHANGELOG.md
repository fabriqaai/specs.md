# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

You can also view this changelog at [specs.md/changelog](https://specs.md/changelog).

## [0.1.49] - 2026-02-22

### Changed

- Dashboard: In the Runs tab, navigating the Worktrees table with `↑/↓` (or `j/k`) now switches worktree context immediately
- Dashboard: Current Run and related sections now refresh directly from the selected worktree without requiring `w` overlay confirmation

## [0.1.26] - 2026-02-21

### Added

- FIRE CLI dashboard: `npx specsmd@latest dashboard` for terminal-native workflow tracking
- Tabbed terminal views (Runs, Overview, Health) designed for small embedded terminal panels
- Keyboard navigation for tabs and filters (`1/2/3`, `Tab`, `←/→`, `f`)
- Current Run-first layout with run status, phase track, and run files section

### Changed

- Dashboard is now optimized for CLI-first and Codex desktop app users as an alternative to the VS Code extension
- Reduced dashboard flicker by avoiding unnecessary re-renders and using calmer fallback refresh behavior
- Improved compact rendering with denser borders/spacing and strict height budgeting for small windows
- Added Nerd Font icon auto-detection with manual override via `SPECSMD_ICON_SET=auto|nerd|ascii`

![FIRE dashboard in compact terminal mode](docs.specs.md/images/dashboard/terminal-dashboard.png)

![FIRE dashboard in Codex desktop with no active run](docs.specs.md/images/dashboard/codex-desktop-dashboard1.png)

## [0.1.23] - 2026-02-13

### Fixed

- Codex installer now creates proper skills instead of flat `.md` files that Codex cannot read
- Commands are transformed into `.codex/skills/<name>/SKILL.md` with proper YAML frontmatter

## [0.1.11] - 2026-01-25

### Per-Work-Item Phase Tracking

The VS Code extension now shows real-time phase progress for each work item in FIRE runs. Track exactly where your AI agent is in the Plan → Execute → Test → Review pipeline.

![Work item showing Test phase in progress](docs.specs.md/images/fire-phase-tracking/work-item-in-progress.png)

**First work item in Test phase** - completed Plan and Execute, now running tests.

![Multiple work items with phase tracking](docs.specs.md/images/fire-phase-tracking/work-item-completed.png)

**Progress through multiple work items** - first item completed all phases, second item now in Test phase.

### Added

- VS Code: Per-work-item phase tracking in FIRE flow (Plan → Execute → Test → Review)
- VS Code: Real-time phase progress indicator showing which phase each work item is currently in
- VS Code: Visual distinction between completed phases (green checkmarks) and active phase (orange highlight)

### Changed

- FIRE: Phase tracking now updates at work item level instead of run level for better granularity

## [0.1.10] - 2026-01-24

### Added

- FIRE: Status skill now includes comprehensive integrity validation with 14 issue types
- FIRE: Code verification option to check codebase when work item status is ambiguous
- FIRE: Maintenance log (`maintenance-log.md`) for tracking all automated fixes
- FIRE: Support for multiple parallel active runs in state schema

### Changed

- FIRE: Status skill bumped to v2.0.0 with full validation workflow
- FIRE: All command references now use `/specsmd-fire` prefix consistently
- FIRE: Config references updated from `fire-config.yaml` to `memory-bank.yaml`

### Fixed

- FIRE: Added missing `review-report.md` to run artifacts schema
- FIRE: Added missing `design-doc` path to schema
- FIRE: Added `blocked` status to work item status values
- FIRE: Added `mode` and `depends_on` fields to work item schema
- FIRE: Orchestrator agent state example now matches actual schema structure

## [0.1.9] - 2026-01-23

### Added

- FIRE Flow: New flow type with 17 Lit web components for VS Code extension
- VS Code: Flow switcher in toolbar for switching between AI-DLC and FIRE flows
- VS Code: FIRE Runs tab with active run display and completed runs history
- VS Code: FIRE Intents tab with expandable intent cards and progress tracking
- VS Code: Pending work items grouped by intent with dependency visualization
- VS Code: File watcher for `.specs-fire` directory to auto-refresh on state changes
- VS Code: Expandable completed runs showing all markdown files with click-to-open

### Changed

- File watcher now monitors both `memory-bank` and `.specs-fire` directories

### Fixed

- YAML parsing now supports both snake_case and camelCase field names
- Intent expansion state persisted correctly across view refreshes

## [0.1.8] - 2026-01-13

### Added

- Simple Flow: Lightweight 3-phase workflow (Requirements → Design → Tasks)
- Simple Flow documentation pages
- Changelog page in documentation
- Kiro installer with specs symlink support for Simple Flow

### Changed

- Clarified Simple Flow and AI-DLC as independent flows (not an upgrade path)

### Fixed

- Markdown lint errors in DDD construction bolt template

## [0.1.7] - 2026-01-10

### Fixed

- OpenCode installer now uses correct command directory and frontmatter

## [0.1.6] - 2026-01-10

### Added

- VS Code: Markdown editor selection setting
- VS Code: Clickable stories in bolt widget
- ADR (Architecture Decision Record) tracking with decision index across bolts

### Fixed

- Markdown lint errors in DDD construction bolt template
- Security vulnerabilities in dependencies

## [0.1.5] - 2026-01-09

### Added

- VS Code: Construction log display for completed bolts
- VS Code: Analytics module with lifecycle, engagement, and project metrics tracking
- VS Code: Open VSX marketplace publishing (works with Cursor, Windsurf, etc.)
- VS Code: Enhanced logs inception artifacts

### Changed

- Moved scripts into aidlc flow folder for better organization

### Fixed

- Test paths after scripts reorganization

## [0.1.4] - 2026-01-06

### Added

- Contextual options menu (copy, AI tools, feature request)
- DeepWiki integration for codebase exploration
- Workflow descriptions for Google Antigravity navigation
- SEO metadata and social sharing tags to docs
- Product Hunt launch integration

## [0.1.3] - 2025-12-30

### Added

- Artifacts display in active bolt view
- Manual workflow dispatch trigger for releases
- Dev branch auto-publish workflow

### Fixed

- Bolt-start guardrails to prevent skipping story updates
- Active bolt UI improvements and IDE-agnostic messages
- Frontmatter validation for bolt creation
- Geolocation in Mixpanel analytics tracker

## [0.1.2] - 2025-12-28

### Fixed

- Analytics events now properly sent before process exit

## [0.1.1] - 2025-12-27

### Added

- Mixpanel analytics for installer events
- VS Code extension with bolt visualization and progress tracking
- Dynamic status discovery for specs filter
- Extension marketplace publishing workflow

### Fixed

- Intent matching by combined format in selector
- Markdown lint errors in bolt-plan skill

## [0.1.0] - 2025-12-27

### Added

- Initial release of specsmd
- AI-DLC Flow with 4 agents (Master, Inception, Construction, Operations)
- Memory Bank for persistent project context
- Support for Claude Code, Cursor, GitHub Copilot, and other AI coding tools
- DDD construction bolt type
- Installer with automatic tool detection

---

[0.1.49]: https://github.com/fabriqaai/specs.md/compare/v0.1.47...v0.1.49
[0.1.26]: https://github.com/fabriqaai/specs.md/compare/v0.1.25...v0.1.26
[0.1.23]: https://github.com/fabriqaai/specs.md/compare/v0.1.22...v0.1.23
[0.1.11]: https://github.com/fabriqaai/specs.md/compare/v0.1.10...v0.1.11
[0.1.10]: https://github.com/fabriqaai/specs.md/compare/v0.1.9...v0.1.10
[0.1.9]: https://github.com/fabriqaai/specs.md/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/fabriqaai/specs.md/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/fabriqaai/specs.md/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/fabriqaai/specs.md/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/fabriqaai/specs.md/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/fabriqaai/specs.md/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/fabriqaai/specs.md/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/fabriqaai/specs.md/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/fabriqaai/specs.md/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/fabriqaai/specs.md/releases/tag/v0.1.0
