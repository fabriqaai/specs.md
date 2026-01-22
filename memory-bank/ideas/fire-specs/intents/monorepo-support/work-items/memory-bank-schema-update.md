---
id: memory-bank-schema-update
title: Update memory-bank.yaml Schema for Monorepo
complexity: low
status: pending
depends_on: []
tags: [schema, config, phase-1]
---

# Update memory-bank.yaml Schema for Monorepo

## Description

Update the memory-bank.yaml schema to include constitution path and document the hierarchical standards behavior. This is a foundational change that other work items depend on.

## Acceptance Criteria

- [ ] Add `constitution` path to schema
- [ ] Document hierarchical standards behavior in schema comments
- [ ] Add `workspace.structure` enum to include monorepo
- [ ] Ensure backward compatibility (existing projects work)

## Schema Changes

Update `fire/memory-bank.yaml`:

```yaml
# ═══════════════════════════════════════════════════════════════════════════════
# FIRE Flow Configuration
# ═══════════════════════════════════════════════════════════════════════════════

artifact_root: ".specs-fire"

# ─────────────────────────────────────────────────────────────────────────────────
# DIRECTORY STRUCTURE
# ─────────────────────────────────────────────────────────────────────────────────

structure:
  intents: "intents/"
  runs: "runs/"
  standards: "standards/"

# ─────────────────────────────────────────────────────────────────────────────────
# SCHEMA PATHS
# ─────────────────────────────────────────────────────────────────────────────────

schema:
  # State
  state: ".specs-fire/state.yaml"

  # Intents & Work Items
  intents: ".specs-fire/intents/{intent-id}/"
  intent-brief: ".specs-fire/intents/{intent-id}/brief.md"
  work-items: ".specs-fire/intents/{intent-id}/work-items/"
  work-item: ".specs-fire/intents/{intent-id}/work-items/{work-item-id}.md"

  # Runs
  runs: ".specs-fire/runs/"
  run-folder: ".specs-fire/runs/{run-id}/"
  plan: ".specs-fire/runs/{run-id}/plan.md"
  run-log: ".specs-fire/runs/{run-id}/run.md"
  test-report: ".specs-fire/runs/{run-id}/test-report.md"
  walkthrough: ".specs-fire/runs/{run-id}/walkthrough.md"

  # Standards (Root)
  standards: ".specs-fire/standards/"
  constitution: ".specs-fire/standards/constitution.md"      # NEW: Always inherited
  tech-stack: ".specs-fire/standards/tech-stack.md"
  coding-standards: ".specs-fire/standards/coding-standards.md"
  testing-standards: ".specs-fire/standards/testing-standards.md"
  system-architecture: ".specs-fire/standards/system-architecture.md"

  # Module Standards (Monorepo)
  # These paths are relative to module root, not project root
  # Example: packages/api/.specs-fire/standards/tech-stack.md
  module-standards: "{module-path}/.specs-fire/standards/"
  module-tech-stack: "{module-path}/.specs-fire/standards/tech-stack.md"
  module-coding-standards: "{module-path}/.specs-fire/standards/coding-standards.md"
  module-testing-standards: "{module-path}/.specs-fire/standards/testing-standards.md"

# ─────────────────────────────────────────────────────────────────────────────────
# STATE STRUCTURE
# ─────────────────────────────────────────────────────────────────────────────────

state:
  project:
    name: "Project name"
    description: "Project description"
    created: "ISO date"
    framework: "fire"

  workspace:
    type: "greenfield | brownfield"
    structure: "monolith | monorepo"           # UPDATED: Added monorepo
    autonomy_bias: "autonomous | balanced | controlled"
    run_scope_preference: "single | batch | wide"

  intents:
    - id: "intent-id"
      title: "Intent title"
      status: "pending | in_progress | completed"
      work_items:
        - id: "work-item-id"
          title: "Work item title"
          status: "pending | in_progress | completed"
          complexity: "low | medium | high"
          mode: "autopilot | confirm | validate"

  active_run:
    id: "run-id"
    scope: "single | batch | wide"
    work_items: []
    current_item: "work-item-id"
    status: "in_progress | completed"

  runs: []

# ─────────────────────────────────────────────────────────────────────────────────
# STANDARDS BEHAVIOR
# ─────────────────────────────────────────────────────────────────────────────────

standards_behavior:
  # Constitution is special - always inherited from root, never overridden
  constitution:
    inheritance: "always"
    override: "never"
    description: |
      Contains universal policies (git workflow, PR process, security).
      Modules cannot override constitution.md - if present, it's ignored.

  # Other standards use override semantics
  tech-stack:
    inheritance: "fallback"
    override: "allowed"
    description: |
      If module has tech-stack.md, use it. Otherwise inherit from nearest ancestor.

  coding-standards:
    inheritance: "fallback"
    override: "allowed"

  testing-standards:
    inheritance: "fallback"
    override: "allowed"

  system-architecture:
    inheritance: "fallback"
    override: "allowed"

# ─────────────────────────────────────────────────────────────────────────────────
# RESOLUTION RULES
# ─────────────────────────────────────────────────────────────────────────────────

resolution_rules:
  - name: "Constitution Always Root"
    rule: "constitution.md is ONLY loaded from .specs-fire/standards/"
    ignore: "Any constitution.md in nested .specs-fire/standards/ directories"

  - name: "Nearest Ancestor Wins"
    rule: "For other standards, find nearest ancestor with the file"
    example: |
      Editing: packages/api/src/main.go
      Check: packages/api/.specs-fire/standards/tech-stack.md
      If missing, check: packages/.specs-fire/standards/tech-stack.md
      If missing, check: .specs-fire/standards/tech-stack.md

  - name: "Scope by Path"
    rule: "Standards apply to files under their parent directory"
    example: |
      packages/api/.specs-fire/standards/tech-stack.md
      → applies to packages/api/**
```

## Backward Compatibility

Existing projects without:
- `constitution.md` → Works fine, just no constitution loaded
- Module standards → Works fine, all standards from root
- `workspace.structure` in state → Defaults to "monolith"

No migration needed.

## File Location

```
fire/
└── memory-bank.yaml    # Updated with new schema
```

## Dependencies

None - this is foundational.
