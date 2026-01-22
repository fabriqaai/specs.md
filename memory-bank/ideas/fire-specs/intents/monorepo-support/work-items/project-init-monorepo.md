---
id: project-init-monorepo
title: Update project-init for Monorepo Detection
complexity: medium
status: pending
depends_on: [constitution-standard]
tags: [orchestrator, project-init, phase-2]
---

# Update project-init for Monorepo Detection

## Description

Enhance the project-init skill to detect monorepo structures and offer to create module-specific standards. When a monorepo is detected, the AI explores each module to understand its tech stack and generates appropriate standards files.

## Acceptance Criteria

- [ ] Detect monorepo structure (workspaces, multiple package managers, etc.)
- [ ] Identify module directories within monorepo
- [ ] AI analyzes each module to detect language/tooling (no hardcoded mappings)
- [ ] Present detected modules to user for confirmation
- [ ] Generate module-specific `.specs-fire/standards/` on user approval
- [ ] Works for any language combination (polyglot monorepos)
- [ ] Non-monorepo projects work exactly as before

## Monorepo Detection

Add to project-init SKILL.md:

```xml
<step n="2" title="Detect Workspace Structure">

  <substep n="2a" title="Check for Monorepo Indicators">
    <action>
      Look for monorepo indicators (any match suggests monorepo):

      Tool configs:
      - nx.json (NX)
      - turbo.json (Turborepo)
      - pnpm-workspace.yaml (PNPM workspaces)
      - lerna.json (Lerna)
      - rush.json (Rush)

      Package manager workspaces:
      - package.json with "workspaces" field
      - Cargo.toml with [workspace] section
      - go.work file (Go workspaces)

      Structure patterns:
      - Multiple independent package/dependency manifests
      - Common directory patterns: packages/*, apps/*, services/*, libs/*
    </action>

    <output>
      IF monorepo detected:
        workspace.structure = "monorepo"
        workspace.tool = [detected tool or "custom"]
      ELSE:
        workspace.structure = "monolith"
    </output>
  </substep>

  <substep n="2b" title="Discover Modules" if="workspace.structure == monorepo">
    <action>
      Find module directories. A module is a directory that:
      - Has its own dependency manifest (package.json, go.mod, pyproject.toml, etc.)
      - Contains source code
      - Appears to be independently buildable/testable

      Common locations to check:
      - packages/*/
      - apps/*/
      - services/*/
      - libs/*/
      - modules/*/
      - Paths listed in workspace config (nx.json, pnpm-workspace.yaml, etc.)
    </action>
  </substep>

</step>
```

## Module Analysis (AI-Driven)

```xml
<step n="3" title="Analyze Modules" if="workspace.structure == monorepo">

  <iterate over="discovered_modules" as="module">
    <action>
      Explore {{module.path}} and determine:

      1. **Primary Language**
         Look at: file extensions, config files, source code
         Examples: .go files → Go, .py files → Python, .swift files → Swift

      2. **Build System**
         Look at: build configs, scripts, CI files
         Determine: build command, output location

      3. **Test Framework**
         Look at: test directories, test config files, CI test steps
         Determine: test command, coverage tool

      4. **Linter/Formatter**
         Look at: linter config files in the module
         Examples: .eslintrc, .golangci.yml, ruff.toml, .swiftlint.yml

      5. **Package Manager**
         Look at: lock files, dependency manifests
         Determine: install command, dependency file

      DO NOT use hardcoded mappings. Explore and understand.
    </action>

    <output>
      Module: {{module.path}}
      ├── Language: [detected]
      ├── Build: [command or "N/A"]
      ├── Test: [command]
      ├── Linter: [tool and config]
      └── Package Manager: [tool]
    </output>
  </iterate>

</step>
```

## User Confirmation Flow

```xml
<step n="4" title="Confirm Module Detection" if="workspace.structure == monorepo">

  <ask>
    I detected a monorepo with these modules:

    | Module | Language | Test Command | Linter |
    |--------|----------|--------------|--------|
    {{#each modules}}
    | {{path}} | {{language}} | {{test_cmd}} | {{linter}} |
    {{/each}}

    Options:
    [c] Correct - create module standards for all
    [s] Select - choose which modules get standards
    [e] Edit - let me correct some detections
    [n] None - I'll create module standards manually later
  </ask>

  <if response="c">
    <action>Create standards for all modules</action>
  </if>

  <if response="s">
    <ask>
      Select modules (comma-separated numbers):
      {{#each modules}}
      [{{@index}}] {{path}} ({{language}})
      {{/each}}
    </ask>
    <action>Create standards for selected modules only</action>
  </if>

  <if response="e">
    <ask>Which module needs correction?</ask>
    <action>Update detection, re-confirm</action>
  </if>

</step>
```

## Module Standards Generation

```xml
<step n="5" title="Generate Module Standards" if="modules_selected">

  <iterate over="selected_modules" as="module">
    <action>
      Create {{module.path}}/.specs-fire/standards/

      Generate tech-stack.md with detected information:
      - Language and version
      - Framework (if detected)
      - Build command
      - Test command
      - Linter and config location
      - Package manager

      DO NOT generate:
      - constitution.md (always from root)
      - coding-standards.md (unless significantly different from root)
      - testing-standards.md (unless significantly different from root)

      Only create files that DIFFER from root standards.
    </action>
  </iterate>

  <output>
    Created module standards:
    {{#each created}}
    ✓ {{module.path}}/.specs-fire/standards/tech-stack.md
    {{/each}}
  </output>

</step>
```

## Generated tech-stack.md Example

For a Go module:

```markdown
# Tech Stack: packages/api

> Module-specific tech stack. Overrides root standards for packages/api/**

## Language & Runtime

- **Language**: Go 1.22
- **Module**: github.com/myorg/myproject/packages/api

## Build & Test

- **Build**: `go build ./...`
- **Test**: `go test ./...`
- **Test Coverage**: `go test -cover ./...`

## Code Quality

- **Linter**: golangci-lint
- **Config**: .golangci.yml
- **Format**: gofmt (built-in)

## Dependencies

- **Package Manager**: Go modules
- **Manifest**: go.mod
- **Lock File**: go.sum

---
*Generated by FIRE on 2026-01-21*
*Detected from: go.mod, .golangci.yml*
```

## File Changes

```
fire/agents/orchestrator/skills/project-init/
├── SKILL.md                         # Add monorepo detection steps
├── templates/
│   ├── constitution.md.hbs          # NEW (from constitution-standard)
│   └── module-tech-stack.md.hbs     # NEW: Module-specific template
└── references/
    └── monorepo-detection.md        # NEW: Detection guidance
```

## Dependencies

- constitution-standard: Constitution template must exist
