---
unit: artifact-parser
intent: 011-vscode-extension
phase: construction
status: in-progress
created: 2025-12-25
updated: 2025-12-26
default_bolt_type: simple-construction-bolt
---

# Unit Brief: Artifact Parser

## Purpose

Parse memory-bank directory structure and artifact files to build a model of AI-DLC artifacts with their statuses. This is the foundation unit that other units depend on for understanding the memory-bank content.

## Scope

### In Scope

- Central `MemoryBankSchema` class with hardcoded paths (future: dynamic from memory-bank.yaml)
- Directory scanning for intents, units, stories, bolts, standards
- YAML frontmatter parsing from markdown files
- Status extraction and normalization
- Project detection (is this a specsmd project?)
- Graceful handling of missing/malformed files

### Out of Scope

- File system watching (handled by file-watcher unit)
- Tree view rendering (handled by sidebar-provider unit)
- File modification/creation

---

## Assigned Requirements

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-1.4 | Auto-detect specsmd projects (presence of `memory-bank/` or `.specsmd/`) | Must |
| FR-3.1 | Parse intent status (draft, in-progress, complete) | Must |
| FR-3.2 | Calculate unit completion status | Must |
| FR-3.3 | Parse story status (pending, in-progress, done) | Must |
| FR-3.4 | Parse bolt status, type, stages, stories | Must |
| FR-6.1 | Central `MemoryBankSchema` class for path definitions | Must |
| FR-6.2 | Hardcoded paths for Phase 1 | Must |
| FR-6.3 | Design for future dynamic discovery | Should |
| FR-6.4 | Parse artifact frontmatter for status | Must |
| FR-6.5 | Handle missing/malformed frontmatter gracefully | Must |
| FR-6.6 | Support standard memory-bank directory structure | Must |
| FR-10.1 | Parse `requires_bolts` field from bolt frontmatter | Must |
| FR-10.2 | Parse `enables_bolts` field from bolt frontmatter | Must |
| FR-10.3 | Compute `isBlocked` for pending bolts | Must |
| FR-10.4 | Compute `blockedBy` list for blocked bolts | Must |
| FR-10.5 | Compute `unblocksCount` for prioritization | Must |
| FR-10.6 | Distinguish "blocked" from "pending" status | Must |
| FR-11.1 | Derive activity feed from bolt timestamps | Must |
| FR-11.2 | Support activity event types (created, start, stage-complete, complete) | Must |
| FR-11.3 | Sort activity feed by timestamp descending | Must |

---

## Domain Concepts

### Key Entities

| Entity | Description | Attributes |
|--------|-------------|------------|
| MemoryBankSchema | Central path/structure definitions | paths, patterns, getIntentsPath(), getBoltsPath() |
| Intent | Feature/capability container | name, number, status, units[] |
| Unit | Deployable work unit | name, intent, status, stories[], dependencies |
| Story | User story | id, title, status, unit |
| Bolt | Construction session | id, type, status, currentStage, stages[], stories[], requiresBolts[], enablesBolts[], isBlocked, blockedBy[], unblocksCount |
| Stage | Bolt execution stage | name, status, order, completed (timestamp) |
| Standard | Project standard | name, path |
| ArtifactStatus | Normalized status | draft/pending, in-progress, complete/done, blocked, unknown |
| ActivityEvent | Derived activity item | id, type, timestamp, icon, text, targetId, targetName, tag |

### Key Operations

| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| detectProject | Check if workspace is specsmd project | workspacePath | boolean |
| scanMemoryBank | Scan and parse all artifacts | workspacePath | MemoryBankModel |
| parseIntent | Parse single intent folder | intentPath | Intent |
| parseUnit | Parse single unit folder | unitPath | Unit |
| parseBolt | Parse single bolt folder | boltPath | Bolt |
| parseFrontmatter | Extract YAML frontmatter | fileContent | FrontmatterData |
| normalizeStatus | Convert status string to enum | rawStatus | ArtifactStatus |
| computeBoltDependencies | Calculate isBlocked, blockedBy, unblocksCount | Bolt, allBolts | Bolt (enriched) |
| isBoltBlocked | Check if bolt's requires_bolts are complete | Bolt, allBolts | boolean |
| getBlockingBolts | Get list of incomplete required bolts | Bolt, allBolts | string[] |
| countUnblocks | Count bolts this bolt enables | boltId, allBolts | number |
| buildActivityFeed | Derive activity events from bolts | Bolt[] | ActivityEvent[] |
| getUpNextBolts | Get pending bolts ordered by priority | Bolt[] | Bolt[] |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 6 |
| Must Have | 6 |
| Should Have | 0 |
| Could Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | Memory Bank Schema Class | Must | Planned |
| 002 | Project Detection | Must | Planned |
| 003 | Artifact Parsing | Must | Planned |
| 004 | Frontmatter Parser | Must | Planned |
| 005 | Bolt Dependency Parsing | Must | Planned |
| 006 | Activity Feed Derivation | Must | Planned |

---

## Dependencies

### Depends On

| Unit | Reason |
|------|--------|
| None | Foundation unit |

### Depended By

| Unit | Reason |
|------|--------|
| sidebar-provider | Needs parsed artifact data |
| file-watcher | Needs to re-parse on changes |
| welcome-view | Needs project detection |

### External Dependencies

| System | Purpose | Risk |
|--------|---------|------|
| Node.js fs | File system access | Low |
| js-yaml | YAML frontmatter parsing | Low |

---

## Technical Context

### Suggested Technology

- TypeScript classes for models
- js-yaml for frontmatter parsing
- VS Code workspace API for paths
- Glob patterns for file discovery

### Integration Points

| Integration | Type | Protocol |
|-------------|------|----------|
| VS Code workspace | API | vscode.workspace |
| File System | API | Node.js fs/promises |

### Data Storage

| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| In-memory models | TypeScript objects | Small (<1MB) | Session |

---

## Constraints

- Must be synchronous-friendly for initial load (or fast async)
- Must handle 100+ artifacts without performance issues
- Must not throw on malformed files (graceful degradation)

---

## Success Criteria

### Functional

- [ ] MemoryBankSchema defines all paths in one place
- [ ] detectProject correctly identifies specsmd projects
- [ ] All artifact types parsed correctly (intents, units, stories, bolts, standards)
- [ ] Frontmatter parsing extracts status fields
- [ ] Malformed files return "unknown" status, not errors
- [ ] Bolt dependencies parsed (requires_bolts, enables_bolts)
- [ ] isBlocked computed correctly for pending bolts
- [ ] blockedBy list computed for blocked bolts
- [ ] unblocksCount computed for queue prioritization
- [ ] Activity feed derived from bolt timestamps
- [ ] Activity events sorted by timestamp descending

### Non-Functional

- [ ] Parse 100 artifacts in < 200ms
- [ ] No memory leaks from repeated parsing
- [ ] Dependency computation O(n) complexity

### Quality

- [ ] Unit tests for all parsing functions
- [ ] Unit tests for dependency computation
- [ ] Unit tests for activity feed derivation
- [ ] Test fixtures for valid/invalid frontmatter
- [ ] Code coverage > 80%

---

## Bolt Suggestions

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-artifact-parser-1 | Simple | 001, 002, 003, 004 | Core parsing functionality (COMPLETE) |
| bolt-artifact-parser-2 | Simple | 005, 006 | Dependency parsing and activity derivation |

---

## Notes

- MemoryBankSchema should be designed with dependency injection in mind for future dynamic loading
- Consider caching parsed results to avoid re-parsing unchanged files
- Status normalization should handle variations (e.g., "completed" vs "complete")
