---
id: hierarchical-standards-resolution
title: Hierarchical Standards Resolution in run-execute
complexity: medium
status: pending
depends_on: [constitution-standard]
tags: [builder, run-execute, phase-2]
---

# Hierarchical Standards Resolution in run-execute

## Description

Update the run-execute skill to discover and load hierarchical standards. When executing a work item, Builder must load the correct standards based on which files are being edited, with constitution always from root and other standards using override semantics (nearest ancestor wins).

## Acceptance Criteria

- [ ] run-execute discovers all `.specs-fire/standards/` directories in repo
- [ ] Constitution always loaded from root (module constitutions ignored)
- [ ] Other standards use override semantics per scope
- [ ] Standards presented to AI with clear path-based scoping
- [ ] Resolution algorithm documented clearly in SKILL.md
- [ ] Works correctly when no module standards exist (falls back to root)
- [ ] Performance acceptable (caching of discovered locations)

## Standards Resolution Algorithm

Add to run-execute SKILL.md:

```xml
<step n="2" title="Load Standards">

  <substep n="2a" title="Discover Standards Locations">
    <action>
      Scan repository for all directories matching: **/.specs-fire/standards/

      Build list sorted by path depth:
      - depth 0: .specs-fire/standards/ (root)
      - depth N: {path}/.specs-fire/standards/ (modules)

      Cache this list for the duration of the run.
    </action>
  </substep>

  <substep n="2b" title="Load Constitution (Root Only)">
    <action>
      Load .specs-fire/standards/constitution.md from ROOT.

      CRITICAL: Ignore any constitution.md in nested directories.
      Constitution is ALWAYS inherited, NEVER overridden.

      If root constitution.md doesn't exist, skip (graceful degradation).
    </action>
  </substep>

  <substep n="2c" title="Resolve Module Standards">
    <action>
      For each discovered standards location (excluding root):

      FOR each standard_file IN [tech-stack.md, coding-standards.md,
                                  testing-standards.md, system-architecture.md]:

        IF {location}/standards/{standard_file} EXISTS:
          → USE this file for scope {location.parent_path}/**
        ELSE:
          → Walk UP to find nearest ancestor with this file
          → USE ancestor's file (ultimately root if none found)
    </action>
  </substep>

  <substep n="2d" title="Present Standards Context">
    <action>
      Present loaded standards with CLEAR scoping instructions:

      ```
      ## Constitution (applies to ALL files)
      [content of root constitution.md]

      ## Standards for packages/api/** files
      When editing files under packages/api/, apply these:
      [tech-stack.md content for this scope]
      [coding-standards.md content for this scope]
      [testing-standards.md content for this scope]

      ## Standards for apps/mobile/** files
      When editing files under apps/mobile/, apply these:
      [tech-stack.md content for this scope]
      ...

      ## Default Standards (paths without specific scope)
      For all other files, apply root standards:
      [root tech-stack.md]
      [root coding-standards.md]
      ...
      ```
    </action>
  </substep>

</step>
```

## Resolution Examples

### Example 1: Simple Monorepo

```
.specs-fire/standards/
├── constitution.md        # Git workflow, PR process
├── tech-stack.md          # Default: TypeScript
└── coding-standards.md    # Default: ESLint rules

packages/api/.specs-fire/standards/
└── tech-stack.md          # Override: Go, golangci-lint
```

Resolution for `packages/api/src/main.go`:
- constitution.md → root (always)
- tech-stack.md → packages/api (override exists)
- coding-standards.md → root (no override, inherit)

### Example 2: Nested Modules

```
.specs-fire/standards/
├── constitution.md
└── tech-stack.md          # Default

packages/.specs-fire/standards/
└── coding-standards.md    # Shared across all packages

packages/api/.specs-fire/standards/
└── tech-stack.md          # API-specific
```

Resolution for `packages/api/src/handler.go`:
- constitution.md → root
- tech-stack.md → packages/api (nearest)
- coding-standards.md → packages/ (nearest ancestor with it)

### Example 3: No Module Standards

```
.specs-fire/standards/
├── constitution.md
├── tech-stack.md
└── coding-standards.md
```

Resolution for any file:
- All standards from root (monolith/single-module behavior)

## Implementation Notes

### Caching

```typescript
// Cache discovered locations at run start
interface StandardsCache {
  locations: Array<{
    path: string;
    depth: number;
    files: string[];  // Which standard files exist here
  }>;
  timestamp: number;
}
```

### Scope Matching

When editing file at path X:
1. Find longest matching standards location path
2. That location's standards apply
3. If no match, use root

```typescript
function findMatchingScope(filePath: string, locations: StandardsLocation[]): StandardsLocation {
  // Sort by depth descending (deepest first)
  const sorted = locations.sort((a, b) => b.depth - a.depth);

  for (const loc of sorted) {
    if (filePath.startsWith(loc.parentPath)) {
      return loc;
    }
  }

  return rootLocation;
}
```

## File Changes

```
fire/agents/builder/skills/run-execute/
├── SKILL.md                    # Add standards resolution section
└── references/
    └── standards-resolution.md # NEW: Detailed resolution docs
```

## Dependencies

- constitution-standard: Constitution must exist for this to load it
