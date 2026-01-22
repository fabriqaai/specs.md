---
id: migrate-skill
title: Project Migration Skill
complexity: medium
status: pending
depends_on: [constitution-standard, memory-bank-schema-update]
tags: [orchestrator, migration, phase-2]
---

# Project Migration Skill

## Description

Create a migration skill that upgrades existing FIRE projects to the latest version. This handles adding new files (constitution.md), updating state.yaml schema, and optionally detecting/creating module standards for projects that are actually monorepos but were initialized before monorepo support existed.

## Acceptance Criteria

- [ ] Detect current FIRE version from state.yaml or structure
- [ ] Show what will be migrated before making changes
- [ ] Add constitution.md if missing (with sensible defaults or AI-generated)
- [ ] Update state.yaml schema (add missing fields with defaults)
- [ ] Offer monorepo detection for existing projects
- [ ] Create backup before migration
- [ ] Idempotent - running twice doesn't break anything
- [ ] Report what was changed after migration

## SKILL.md Content

```xml
---
name: project-migrate
description: Migrate existing FIRE project to latest version
version: 1.0.0
---

<skill name="project-migrate">

  <objective>
    Upgrade an existing FIRE project to the latest version, adding new
    features and updating schema while preserving all existing work.
  </objective>

  <principles>
    <principle priority="critical">NEVER delete or modify existing intents/work-items/runs</principle>
    <principle priority="critical">Create backup before any changes</principle>
    <principle priority="high">Migration is idempotent - safe to run multiple times</principle>
    <principle priority="high">Show changes before applying</principle>
  </principles>

  <workflow>

    <step n="1" title="Detect Current Version">
      <action>
        Read .specs-fire/state.yaml and analyze structure.

        Determine current version by checking for:
        - constitution.md exists? (v2.0+)
        - workspace.structure field exists? (v2.0+)
        - state.yaml schema version field? (if present)

        If no .specs-fire/ exists → "Not a FIRE project"
      </action>

      <output>
        Current version: {{detected_version}}
        Latest version: {{latest_version}}
        Migration needed: {{yes_or_no}}
      </output>

      <check if="no migration needed">
        <output>Project is already up to date.</output>
        <exit/>
      </check>
    </step>

    <step n="2" title="Analyze Migration Scope">
      <action>
        Determine what needs to be migrated:

        1. **Constitution**: Does .specs-fire/standards/constitution.md exist?
           - If no → Will create

        2. **State Schema**: Check for missing fields in state.yaml
           - workspace.structure missing? → Will add (default: monolith)
           - Other new fields? → Will add with defaults

        3. **Monorepo Detection**: Is this actually a monorepo?
           - Check for monorepo indicators (nx.json, turbo.json, workspaces, etc.)
           - If detected → Offer to create module standards
      </action>

      <output>
        Migration Plan:
        ┌─────────────────────────────────────────────────┐
        │ Changes to be made:                             │
        │                                                 │
        {{#if needs_constitution}}
        │ ✓ Create constitution.md                        │
        {{/if}}
        {{#if needs_schema_update}}
        │ ✓ Update state.yaml schema                      │
        {{/if}}
        {{#if is_monorepo}}
        │ ? Monorepo detected - offer module standards    │
        {{/if}}
        │                                                 │
        │ Will NOT change:                                │
        │ • Existing intents and work items               │
        │ • Existing runs and logs                        │
        │ • Existing standards (only add new ones)        │
        └─────────────────────────────────────────────────┘
      </output>
    </step>

    <step n="3" title="Create Backup">
      <action>
        Create backup of .specs-fire/ directory:
        - Copy to .specs-fire-backup-{{timestamp}}/
        - Or create .specs-fire.backup.tar.gz
      </action>

      <output>
        Backup created: {{backup_location}}
      </output>
    </step>

    <step n="4" title="Confirm Migration">
      <ask>
        Ready to migrate. This will:
        {{#each changes}}
        • {{description}}
        {{/each}}

        Backup saved to: {{backup_location}}

        Proceed? [Y/n]
      </ask>
    </step>

    <step n="5" title="Add Constitution" if="needs_constitution">
      <action>
        Create .specs-fire/standards/constitution.md

        Options:
        a) Generate from existing project patterns (analyze git history, CI config)
        b) Use default template
        c) Let user provide content
      </action>

      <ask>
        How should I create constitution.md?

        [a] Auto-generate from project (analyze git, CI, existing patterns)
        [d] Use default template
        [c] Custom - I'll provide the content
      </ask>

      <if response="a">
        <action>
          Analyze project for constitution content:
          - Check .gitignore for commit patterns
          - Check CI config for workflow hints
          - Check existing PR templates
          - Check CONTRIBUTING.md if exists

          Generate constitution.md from findings.
        </action>
      </if>

      <if response="d">
        <action>
          Create constitution.md from default template with common policies.
        </action>
      </if>

      <if response="c">
        <ask>Please provide the constitution content or key policies.</ask>
        <action>Create constitution.md from user input.</action>
      </if>
    </step>

    <step n="6" title="Update State Schema" if="needs_schema_update">
      <action>
        Update state.yaml with new fields (preserve existing values):

        Add if missing:
        - workspace.structure: "monolith" (default)
        - Any other new fields with sensible defaults

        DO NOT modify:
        - Existing intents
        - Existing runs
        - Existing work items
        - Any existing field values
      </action>
    </step>

    <step n="7" title="Monorepo Module Setup" if="is_monorepo" optional="true">
      <ask>
        This project appears to be a monorepo. I detected these modules:

        {{#each detected_modules}}
        • {{path}} ({{language}})
        {{/each}}

        Would you like to create module-specific standards?

        [y] Yes - create standards for detected modules
        [s] Select - choose which modules
        [n] No - skip for now (can do later)
      </ask>

      <if response="y" or response="s">
        <action>
          Follow project-init-monorepo workflow for module standards creation.
        </action>
      </if>
    </step>

    <step n="8" title="Verify Migration">
      <action>
        Verify migration completed successfully:

        1. Read updated state.yaml - valid YAML?
        2. Check new files exist and are valid
        3. Ensure no existing files were corrupted
        4. Run a quick validation of project structure
      </action>

      <check if="validation fails">
        <action>
          Restore from backup:
          rm -rf .specs-fire/
          mv {{backup_location}} .specs-fire/
        </action>
        <output>
          Migration failed. Restored from backup.
          Error: {{error_details}}
        </output>
        <exit status="error"/>
      </check>
    </step>

    <step n="9" title="Report">
      <output>
        Migration complete!

        Changes made:
        {{#each changes_made}}
        ✓ {{description}}
        {{/each}}

        Backup preserved at: {{backup_location}}
        (You can delete this once you've verified everything works)

        New features available:
        {{#if added_constitution}}
        • Constitution: Universal policies in constitution.md
        {{/if}}
        {{#if is_monorepo}}
        • Monorepo: Module-specific standards supported
        {{/if}}
      </output>
    </step>

  </workflow>

  <templates>
    <template name="constitution-default" path="./templates/constitution-default.md.hbs"/>
  </templates>

</skill>
```

## Migration Scenarios

### Scenario 1: Simple Project (v1 → v2)

```
Before:
.specs-fire/
├── state.yaml              # Missing workspace.structure
├── standards/
│   ├── tech-stack.md
│   ├── coding-standards.md
│   └── testing-standards.md
└── intents/...

After:
.specs-fire/
├── state.yaml              # Added workspace.structure: monolith
├── standards/
│   ├── constitution.md     # NEW
│   ├── tech-stack.md
│   ├── coding-standards.md
│   └── testing-standards.md
└── intents/...             # UNCHANGED
```

### Scenario 2: Actually a Monorepo

```
Before:
.specs-fire/
├── state.yaml
└── standards/...

packages/api/               # Exists but no .specs-fire
apps/mobile/                # Exists but no .specs-fire

After:
.specs-fire/
├── state.yaml              # workspace.structure: monorepo
├── standards/
│   └── constitution.md     # NEW
└── intents/...

packages/api/.specs-fire/
└── standards/
    └── tech-stack.md       # NEW (Go specific)

apps/mobile/.specs-fire/
└── standards/
    └── tech-stack.md       # NEW (React Native specific)
```

## Invocation

```bash
# Via slash command
/fire-migrate

# Or orchestrator detects outdated project and suggests
"This project uses an older FIRE version. Run /fire-migrate to upgrade."
```

## File Location

```
fire/agents/orchestrator/skills/project-migrate/
├── SKILL.md
├── templates/
│   └── constitution-default.md.hbs
└── references/
    └── version-history.md
```

## Version Detection Heuristics

| Indicator | Version |
|-----------|---------|
| No constitution.md | < 2.0 |
| No workspace.structure in state | < 2.0 |
| Has constitution.md + workspace.structure | >= 2.0 |
| Has module standards directories | >= 2.0 (monorepo) |

## Safety Guarantees

1. **Backup first** - Always create backup before any changes
2. **Idempotent** - Running twice is safe (skips already-done changes)
3. **Verify after** - Validate migration succeeded before reporting success
4. **Restore on failure** - Automatic rollback if anything fails
5. **Never delete** - Only adds, never removes existing content

## Dependencies

- constitution-standard: Need constitution template
- memory-bank-schema-update: Need to know latest schema
