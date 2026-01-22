---
id: monorepo-support
title: Hierarchical Standards for Monorepo Support
status: pending
priority: medium
created: 2026-01-21
---

# Hierarchical Standards for Monorepo Support

## Overview

Enable FIRE to work effectively with polyglot monorepos by supporting hierarchical standards that differ per module. A monorepo with Go, Python, Java, Swift, and TypeScript modules needs different tech-stack, coding-standards, and testing-standards per module, while sharing common policies (constitution) across all.

## Problem Statement

Current FIRE has a single `.specs-fire/standards/` at the project root. For monorepos:
- A Python ML service shouldn't inherit "use ESLint" from a JS-based root
- Different modules have different test commands, linters, formatters
- Some standards (git workflow, PR process, CI) should apply universally
- Users currently must manually switch contexts or maintain separate projects

## Solution

**Hierarchical standards with file-level override semantics:**

1. **Constitution** (`constitution.md`) - New standard type, always inherited from root, cannot be overridden
2. **Other standards** - Override semantics: if module has it, use module's; otherwise inherit from ancestor
3. **AI-driven detection** - No hardcoded language mappings; AI explores and detects tech stack per module
4. **File system as registry** - Presence of `.specs-fire/standards/` defines a standards scope

## Architecture

```
project-root/
├── .specs-fire/
│   ├── state.yaml                    # Single source of truth (unchanged)
│   ├── standards/
│   │   ├── constitution.md           # NEW: Universal policies (always inherited)
│   │   ├── tech-stack.md             # Default tech stack
│   │   ├── coding-standards.md       # Default coding standards
│   │   └── testing-standards.md      # Default testing standards
│   └── intents/                      # All intents at root (unchanged)
│
├── packages/api/
│   └── .specs-fire/
│       └── standards/
│           └── tech-stack.md         # Override: Go, Echo, golangci-lint
│
├── services/ml/
│   └── .specs-fire/
│       └── standards/
│           └── tech-stack.md         # Override: Python, FastAPI, ruff
│
└── apps/mobile/
    └── .specs-fire/
        └── standards/
            ├── tech-stack.md         # Override: Swift, XCTest
            └── coding-standards.md   # Override: SwiftLint conventions
```

## Key Design Decisions

### 1. Override, Not Inheritance (for most standards)

When module has `tech-stack.md`, it completely replaces root's `tech-stack.md` for that module scope. No merging - different languages are incompatible, not complementary.

### 2. Constitution is Special

`constitution.md` is always inherited from root. It contains truly universal policies:
- Git workflow, commit conventions
- PR/review requirements
- Security policies
- CI/CD platform

Modules cannot override constitution - if they try, it's ignored.

### 3. AI Detects, Not Hardcoded Mappings

Instead of maintaining a list of "go.mod → Go, pyproject.toml → Python", the AI explores each module and determines:
- Primary language(s)
- Build/test commands
- Linter/formatter
- Package manager

This handles any language, any tooling, any version.

### 4. Intents Stay at Root

Intents and work items remain at root `.specs-fire/intents/`. An intent can span multiple modules - that's the point. Module scoping happens at execution time via standards, not at planning time via separate intent folders.

### 5. No Impact on Run Planning

Run-plan skill is unchanged. It still scans one location, manages one state.yaml. The complexity is contained in Builder's context loading during execution.

## Success Criteria

- [ ] `constitution.md` template added to project-init
- [ ] Project-init detects monorepo and offers module standards creation
- [ ] AI can detect language/tooling for any module (no hardcoded mappings)
- [ ] Builder loads hierarchical standards during run-execute
- [ ] Standards resolution algorithm clearly documented in skill
- [ ] Existing non-monorepo projects work exactly as before
- [ ] Work items can execute across modules with correct context per file
- [ ] Migration skill upgrades existing projects to new version safely

## Out of Scope

- Module-level intents/work-items (intents stay at root)
- Module registry in state.yaml (file system is the registry)
- Cross-module dependency orchestration (existing dependency system suffices)
- Per-file-type standards (e.g., different standards for `*.test.ts`) - future enhancement

## References

- Reddit discussion: r/SpecDrivenDevelopment - Monorepo thread
- yclian's approach: CATALOG.md + module-level .specify folders
- Anthropic Guides: `memory-bank/ideas/anthropic-guides.md`
