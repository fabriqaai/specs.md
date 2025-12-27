---
status: complete
completed: 2025-12-25
note: "Implemented before specsmd dogfooding. Stories not tracked in AI-DLC."
---

# Intent: Standards System

## Overview

Provide a catalog-driven system for establishing and managing project standards that guide AI code generation and ensure consistency across all agents.

---

## Functional Requirements

### FR-1: Standards Catalog

- FR-1.1: System SHALL define available standards in `catalog.yaml`
- FR-1.2: Catalog SHALL specify standard dependencies (e.g., coding-standards depends on tech-stack)
- FR-1.3: Catalog SHALL define decisions within each standard
- FR-1.4: Catalog SHALL mark standards as critical or optional

### FR-2: Standard Types

- FR-2.1: System SHALL support Tech Stack standard (languages, frameworks, databases)
- FR-2.2: System SHALL support Coding Standards (formatting, linting, naming, testing)
- FR-2.3: System SHALL support System Architecture standard (patterns, API design)
- FR-2.4: System SHALL support UX Guide standard (design system, accessibility)
- FR-2.5: System SHALL support API Conventions standard (versioning, response formats)

### FR-3: Facilitation Guides

- FR-3.1: Each standard SHALL have a facilitation guide
- FR-3.2: Guides SHALL provide conversation prompts for eliciting decisions
- FR-3.3: Guides SHALL adapt to project type (full-stack, API, CLI, library)
- FR-3.4: Guides SHALL adapt to user expertise level

### FR-4: Project Initialization

- FR-4.1: Master Agent `project-init` skill SHALL facilitate standards creation
- FR-4.2: System SHALL process standards in dependency order
- FR-4.3: System SHALL generate standard files in `standards/` directory

### FR-5: Project Type Presets

- FR-5.1: System SHALL support full-stack-web preset
- FR-5.2: System SHALL support backend-api preset
- FR-5.3: System SHALL support frontend-app preset
- FR-5.4: System SHALL support cli-tool preset
- FR-5.5: System SHALL support library preset
- FR-5.6: Presets SHALL define required and recommended standards

### FR-6: Construction Agent Integration

- FR-6.1: Construction Agent SHALL load tech-stack.md before code generation
- FR-6.2: Construction Agent SHALL load coding-standards.md for style enforcement
- FR-6.3: Standards SHALL influence AI-generated code patterns

---

## Non-Functional Requirements

### NFR-1: Usability

- Facilitation guides SHALL use conversational, non-technical language where possible
- Standard files SHALL be human-readable markdown
- Decisions SHALL be captured with rationale

### NFR-2: Extensibility

- New standards SHALL be addable via catalog.yaml
- Custom facilitation guides SHALL be creatable

---

## Catalog Structure

```yaml
standards:
  tech-stack:
    description: Technology choices for the project
    facilitation: templates/standards/tech-stack.guide.md
    output_path: standards/tech-stack.md
    importance: critical
    decisions:
      - id: languages
      - id: framework
      - id: database
      - id: orm
      - id: authentication
      - id: infrastructure
      - id: package_manager

  coding-standards:
    depends_on_standards: [tech-stack]
    # ... decisions for formatting, linting, naming, etc.

project_types:
  full-stack-web:
    required_standards: [tech-stack, coding-standards]
    recommended_standards: [system-architecture, ux-guide, api-conventions]
```

---

## Acceptance Criteria

### AC-1: Project Init

- GIVEN a new project with no standards
- WHEN user invokes `/specsmd-master-agent` (auto-redirected to project-init for uninitialized projects)
- THEN Master Agent guides through tech-stack decisions first

### AC-2: Dependency Order

- GIVEN tech-stack is incomplete
- WHEN user tries to create coding-standards
- THEN system prompts to complete tech-stack first

### AC-3: Construction Integration

- GIVEN standards are defined
- WHEN Construction Agent generates code
- THEN generated code follows tech-stack and coding-standards
