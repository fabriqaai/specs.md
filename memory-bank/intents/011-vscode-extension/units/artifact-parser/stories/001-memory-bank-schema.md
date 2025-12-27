---
id: vscode-extension-story-ap-001
unit: artifact-parser
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Memory Bank Schema Class

## User Story

**As a** extension developer
**I want** a central MemoryBankSchema class that defines all memory-bank paths
**So that** path definitions are in one place and easy to change for future dynamic discovery

## Acceptance Criteria

- [ ] **Given** a workspace path, **When** I call MemoryBankSchema.getIntentsPath(), **Then** I get `{workspace}/memory-bank/intents/`
- [ ] **Given** a workspace path, **When** I call MemoryBankSchema.getBoltsPath(), **Then** I get `{workspace}/memory-bank/bolts/`
- [ ] **Given** a workspace path, **When** I call MemoryBankSchema.getStandardsPath(), **Then** I get `{workspace}/memory-bank/standards/`
- [ ] **Given** an intent name, **When** I call MemoryBankSchema.getUnitsPath(intent), **Then** I get the correct units path
- [ ] **Given** a unit, **When** I call MemoryBankSchema.getStoriesPath(intent, unit), **Then** I get the correct stories path
- [ ] **Given** a bolt id, **When** I call MemoryBankSchema.getBoltPath(boltId), **Then** I get the correct bolt folder path

## Technical Notes

- Class should be stateless (pure functions or static methods)
- Design with dependency injection in mind for future dynamic loading from memory-bank.yaml
- Export TypeScript interfaces for all return types
- Follow naming from `.specsmd/aidlc/memory-bank.yaml` schema section

## Dependencies

### Requires
- None (foundation)

### Enables
- 002-project-detection
- 003-artifact-parsing

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Path with spaces | Properly escaped/handled |
| Windows vs Unix paths | Use path.join for cross-platform |
| Trailing slashes | Consistent (always or never) |

## Out of Scope

- Dynamic loading from memory-bank.yaml (Phase 2)
- Custom path configuration
