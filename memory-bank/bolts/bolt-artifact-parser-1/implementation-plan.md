---
stage: plan
bolt: bolt-artifact-parser-1
created: 2025-12-25T18:45:00Z
---

# Implementation Plan: artifact-parser

## Objective

Implement the foundation parsing layer for the VS Code extension that reads memory-bank directory structure, parses artifact frontmatter, and builds a complete model of all AI-DLC artifacts with their statuses.

## Stories in Scope

| Story | Title | Priority |
|-------|-------|----------|
| 001 | Memory Bank Schema Class | Must |
| 002 | Project Detection | Must |
| 003 | Artifact Parsing | Must |
| 004 | Frontmatter Parser | Must |

---

## Deliverables

### 1. MemoryBankSchema Class

Central class that defines all memory-bank paths.

```typescript
// vs-code-extension/src/parser/memoryBankSchema.ts
export class MemoryBankSchema {
    constructor(private workspacePath: string) {}

    getMemoryBankPath(): string
    getIntentsPath(): string
    getBoltsPath(): string
    getStandardsPath(): string
    getUnitsPath(intentName: string): string
    getStoriesPath(intentName: string, unitName: string): string
    getBoltPath(boltId: string): string
    getSpecsmdPath(): string  // .specsmd/ folder
}
```

### 2. Project Detection Function

```typescript
// vs-code-extension/src/parser/projectDetection.ts
export async function detectProject(workspacePath: string): Promise<boolean>
// Returns true if workspace has memory-bank/ OR .specsmd/ folder
```

### 3. TypeScript Interfaces

```typescript
// vs-code-extension/src/parser/types.ts
export enum ArtifactStatus {
    Draft = 'draft',
    InProgress = 'in-progress',
    Complete = 'complete',
    Unknown = 'unknown'
}

export interface Intent {
    name: string;
    number: string;         // e.g., "001"
    path: string;
    status: ArtifactStatus;
    units: Unit[];
}

export interface Unit {
    name: string;
    intentName: string;
    path: string;
    status: ArtifactStatus;
    stories: Story[];
}

export interface Story {
    id: string;             // e.g., "001"
    title: string;
    unitName: string;
    intentName: string;
    path: string;
    status: ArtifactStatus;
    priority: string;       // must, should, could
}

export interface Bolt {
    id: string;             // e.g., "bolt-artifact-parser-1"
    unit: string;
    intent: string;
    type: string;           // simple-construction-bolt, ddd-construction-bolt
    status: ArtifactStatus;
    currentStage: string | null;
    stages: Stage[];
    stagesCompleted: string[];
    stories: string[];
    path: string;
}

export interface Stage {
    name: string;
    order: number;
    status: ArtifactStatus;
}

export interface Standard {
    name: string;
    path: string;
}

export interface MemoryBankModel {
    intents: Intent[];
    bolts: Bolt[];
    standards: Standard[];
    isProject: boolean;
}
```

### 4. Artifact Parsing Functions

```typescript
// vs-code-extension/src/parser/artifactParser.ts
export async function scanMemoryBank(workspacePath: string): Promise<MemoryBankModel>
export async function parseIntent(intentPath: string): Promise<Intent>
export async function parseUnit(unitPath: string, intentName: string): Promise<Unit>
export async function parseStory(storyPath: string, unitName: string, intentName: string): Promise<Story>
export async function parseBolt(boltPath: string): Promise<Bolt>
export async function parseStandard(standardPath: string): Promise<Standard>
```

### 5. Frontmatter Parser

```typescript
// vs-code-extension/src/parser/frontmatterParser.ts
export function parseFrontmatter(content: string): Record<string, any> | null
export function normalizeStatus(rawStatus: string | undefined): ArtifactStatus
```

---

## Dependencies

### External Libraries

| Library | Purpose | Why |
|---------|---------|-----|
| js-yaml | YAML frontmatter parsing | Standard YAML parser, lightweight |
| glob | File pattern matching | Find markdown files recursively |

### VS Code APIs

| API | Purpose |
|-----|---------|
| vscode.workspace.workspaceFolders | Get workspace root path |
| vscode.workspace.fs | File system operations (optional, can use Node fs) |

### Node.js Built-ins

| Module | Purpose |
|--------|---------|
| fs/promises | Async file reading |
| path | Cross-platform path handling |

---

## Technical Approach

### File Structure

```
vs-code-extension/
├── src/
│   └── parser/
│       ├── index.ts            # Re-exports all parser functions
│       ├── types.ts            # TypeScript interfaces
│       ├── memoryBankSchema.ts # Path definitions class
│       ├── projectDetection.ts # detectProject function
│       ├── frontmatterParser.ts# YAML frontmatter parsing
│       └── artifactParser.ts   # Main parsing functions
└── test/
    └── parser/
        ├── memoryBankSchema.test.ts
        ├── projectDetection.test.ts
        ├── frontmatterParser.test.ts
        └── artifactParser.test.ts
```

### Key Implementation Notes

1. **Cross-platform paths**: Always use `path.join()` for path construction
2. **Async operations**: All file operations should be async for VS Code performance
3. **Graceful degradation**: Never throw on missing/malformed files - return defaults
4. **Status normalization**: Handle status variations:
   - draft, pending, planned → Draft
   - in-progress, in_progress, inprogress → InProgress
   - complete, completed, done → Complete
   - anything else → Unknown

### Bolt Type Stage Mapping

For bolts, extract stages based on `type` field:

| Type | Stages |
|------|--------|
| simple-construction-bolt | plan, implement, test |
| ddd-construction-bolt | model, design, implement, test |

### Performance Considerations

- Target: Parse 100 artifacts in < 200ms
- Use parallel file reads where possible
- Consider caching for future optimization (out of scope for Phase 1)

---

## Acceptance Criteria

### Story 001: Memory Bank Schema Class

- [x] MemoryBankSchema class exists with all path methods
- [x] getMemoryBankPath() returns `{workspace}/memory-bank/`
- [x] getIntentsPath() returns `{workspace}/memory-bank/intents/`
- [x] getBoltsPath() returns `{workspace}/memory-bank/bolts/`
- [x] getStandardsPath() returns `{workspace}/memory-bank/standards/`
- [x] getUnitsPath(intent) returns correct nested path
- [x] getStoriesPath(intent, unit) returns correct nested path
- [x] getBoltPath(boltId) returns correct bolt folder path
- [x] Cross-platform path handling (Windows/Unix)

### Story 002: Project Detection

- [x] detectProject returns true for workspace with memory-bank/
- [x] detectProject returns true for workspace with .specsmd/
- [x] detectProject returns true for workspace with both folders
- [x] detectProject returns false for workspace with neither
- [x] detectProject returns false when no workspace open
- [x] Fast execution (< 50ms)

### Story 003: Artifact Parsing

- [x] scanMemoryBank returns MemoryBankModel with all artifacts
- [x] Intents parsed with name, number, status, units
- [x] Units parsed with name, stories, status
- [x] Stories parsed with id, title, status, priority
- [x] Bolts parsed with id, type, stages, stories, currentStage
- [x] Standards parsed with name, path
- [x] Empty folders return empty arrays (no errors)

### Story 004: Frontmatter Parser

- [x] parseFrontmatter extracts YAML from markdown files
- [x] Returns null for files without frontmatter (no error)
- [x] Returns null for invalid YAML (no error, logs warning)
- [x] normalizeStatus handles all status variations
- [x] Handles nested YAML objects
- [x] Handles Unicode in values

---

## Edge Cases to Handle

| Scenario | Behavior |
|----------|----------|
| No workspace open | detectProject returns false |
| Empty memory-bank folder | Return model with empty arrays |
| Intent without units folder | Intent has empty units array |
| Unit without stories folder | Unit has empty stories array |
| Malformed folder name | Skip folder, continue parsing |
| File without frontmatter | Status = Unknown |
| Invalid YAML in frontmatter | Status = Unknown, log warning |
| Very large memory-bank (100+ files) | Parse within 200ms |
| Symlinked folders | Follow symlinks |
| Path with spaces | Handle correctly |

---

## Out of Scope

- File system watching (handled by file-watcher unit)
- Tree view rendering (handled by sidebar-provider unit)
- File modification/creation
- Caching (future optimization)
- Dynamic schema loading from memory-bank.yaml (Phase 2)
- Multi-root workspace support

---

## Notes

- This is the foundation bolt - all other bolts depend on it
- Design MemoryBankSchema for future extension to dynamic loading
- Consider using VS Code's built-in YAML extension API if available
- Test with both valid and malformed fixtures
