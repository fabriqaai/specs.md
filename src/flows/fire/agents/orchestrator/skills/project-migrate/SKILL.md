---
name: project-migrate
description: Migrate existing FIRE project to latest version. Adds constitution.md, updates schema, and optionally detects monorepo modules.
version: 1.0.0
---

<objective>
Upgrade an existing FIRE project to the latest version, adding new features
(constitution.md, hierarchical standards) while preserving all existing work.
</objective>

<triggers>
  - User runs `/fire-migrate`
  - Orchestrator detects outdated project version
</triggers>

<principles critical="true">
  <principle>NEVER delete or modify existing intents/work-items/runs</principle>
  <principle>Create backup before any changes</principle>
  <principle>Migration is idempotent — safe to run multiple times</principle>
  <principle>Show changes before applying</principle>
</principles>

<flow>
  <step n="1" title="Detect Current Version">
    <action>Check if .specs-fire/ exists</action>
    <check if="no .specs-fire/">
      <output>Not a FIRE project. Use /fire to initialize.</output>
      <exit/>
    </check>

    <action>Read .specs-fire/state.yaml</action>
    <action>Check project.fire_version field</action>
    <action>Read FIRE flow version from memory-bank.yaml</action>

    <version_detection>
      | Check | Meaning |
      |-------|---------|
      | project.fire_version missing | Pre-0.1.8 project |
      | project.fire_version < current | Needs migration |
      | project.fire_version == current | Up to date |

      Also check for feature indicators:
      | Missing Feature | Added In |
      |-----------------|----------|
      | constitution.md | 0.1.8 |
      | workspace.structure | 0.1.8 |
    </version_detection>

    <check if="already up to date">
      <output>Project is already at the latest version ({current_version}). No migration needed.</output>
      <exit/>
    </check>

    <output>
      Current version: {project_fire_version or "pre-0.1.8"}
      Latest version: {fire_flow_version}
      Migration required.
    </output>
  </step>

  <step n="2" title="Analyze Migration Scope">
    <action>Determine what needs to be migrated:</action>

    <check_constitution>
      Does .specs-fire/standards/constitution.md exist?
      If no → needs_constitution = true
    </check_constitution>

    <check_schema>
      Does state.yaml have workspace.structure field?
      If no → needs_schema_update = true
    </check_schema>

    <check_monorepo>
      Is this actually a monorepo? Check for:
      - nx.json, turbo.json, pnpm-workspace.yaml, lerna.json
      - package.json with "workspaces"
      - Multiple package/dependency manifests
      If detected → is_monorepo = true
    </check_monorepo>

    <output>
      Migration Plan:
      ┌─────────────────────────────────────────────────────┐
      │ Changes to be made:                                 │
      {{#if needs_constitution}}
      │ ✓ Create constitution.md (universal policies)      │
      {{/if}}
      {{#if needs_schema_update}}
      │ ✓ Update state.yaml schema                         │
      {{/if}}
      {{#if is_monorepo}}
      │ ? Monorepo detected — offer module standards       │
      {{/if}}
      │                                                     │
      │ Will NOT change:                                    │
      │ • Existing intents and work items                   │
      │ • Existing runs and logs                            │
      │ • Existing standards (only add new ones)            │
      └─────────────────────────────────────────────────────┘
    </output>
  </step>

  <step n="3" title="Create Backup">
    <action>Create backup: cp -r .specs-fire .specs-fire-backup-{timestamp}</action>
    <output>Backup created: .specs-fire-backup-{timestamp}</output>
  </step>

  <step n="4" title="Confirm Migration">
    <ask>
      Ready to migrate. Backup saved.

      Proceed with migration? [Y/n]
    </ask>
  </step>

  <step n="5" title="Add Constitution" if="needs_constitution">
    <ask>
      How should I create constitution.md?

      [a] Auto-generate — analyze project (git, CI, existing patterns)
      [d] Default — use standard template
      [c] Custom — I'll provide the content
    </ask>

    <check if="response == a">
      <action>Analyze project for constitution content:</action>
      <substep>Check .gitignore, CI config for workflow hints</substep>
      <substep>Check existing PR templates, CONTRIBUTING.md</substep>
      <substep>Infer commit style from git log</substep>
      <action>Generate constitution.md from findings</action>
    </check>

    <check if="response == d">
      <action>Create constitution.md from default template</action>
    </check>

    <check if="response == c">
      <ask>Please describe your key policies (git workflow, PR process, security).</ask>
      <action>Generate constitution.md from input</action>
    </check>

    <action>Write to .specs-fire/standards/constitution.md</action>
    <output>Created: .specs-fire/standards/constitution.md</output>
  </step>

  <step n="6" title="Update State Schema" if="needs_schema_update">
    <action>Read current state.yaml</action>
    <action>Add missing fields with defaults:</action>
    <substep>project.fire_version: "{current_fire_flow_version}"</substep>
    <substep>workspace.structure: "monolith" (or "monorepo" if detected)</substep>
    <action>Write updated state.yaml (preserve all existing data)</action>
    <output>Updated: .specs-fire/state.yaml</output>
  </step>

  <step n="7" title="Monorepo Module Setup" if="is_monorepo" optional="true">
    <action>Discover modules (same as project-init):</action>
    <substep>Check workspace config for project list</substep>
    <substep>Scan packages/*, apps/*, services/*, libs/*</substep>
    <substep>Analyze each module's tech stack</substep>

    <ask>
      This appears to be a monorepo. Found {{module_count}} modules:

      {{#each modules}}
      • {{path}} ({{language}})
      {{/each}}

      Create module-specific standards?
      [y] Yes — create for all modules
      [s] Select — choose which modules
      [n] No — skip for now
    </ask>

    <check if="response == y or response == s">
      <action>For each selected module:</action>
      <substep>Create {module}/.specs-fire/standards/</substep>
      <substep>Generate tech-stack.md with detected settings</substep>
    </check>
  </step>

  <step n="8" title="Verify Migration">
    <action>Verify migration completed:</action>
    <substep>Read state.yaml — valid YAML?</substep>
    <substep>Check new files exist</substep>
    <substep>Ensure no existing files corrupted</substep>

    <check if="verification fails">
      <output>Migration failed. Restoring from backup...</output>
      <action>rm -rf .specs-fire && mv .specs-fire-backup-{timestamp} .specs-fire</action>
      <output>Restored. Please report this issue.</output>
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

      Backup preserved at: .specs-fire-backup-{timestamp}
      (Delete once you've verified everything works)

      New features available:
      • Constitution: Universal policies in constitution.md
      {{#if is_monorepo}}
      • Monorepo: Module-specific standards supported
      {{/if}}
    </output>
  </step>
</flow>

<safety_guarantees>
  <guarantee>Backup created before any changes</guarantee>
  <guarantee>Idempotent — running twice is safe</guarantee>
  <guarantee>Verify after — validates migration succeeded</guarantee>
  <guarantee>Restore on failure — automatic rollback</guarantee>
  <guarantee>Never deletes — only adds, never removes</guarantee>
</safety_guarantees>

<success_criteria>
  <criterion>Current version detected correctly</criterion>
  <criterion>Backup created before changes</criterion>
  <criterion>constitution.md added if missing</criterion>
  <criterion>state.yaml schema updated if needed</criterion>
  <criterion>Monorepo modules detected and offered (if applicable)</criterion>
  <criterion>Migration verified successfully</criterion>
  <criterion>No existing data lost or corrupted</criterion>
</success_criteria>
