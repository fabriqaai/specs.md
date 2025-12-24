# Unit Brief: Standards Catalog

## Overview

The Standards Catalog is a YAML configuration file that defines all available project standards, their decisions, dependencies, and project type presets. It serves as the registry that tells the Master Agent what standards exist and what decisions need to be made.

---

## Scope

### In Scope
- Standard definitions (id, description, importance)
- Decision definitions within each standard
- Decision dependencies and ordering
- Project type presets
- Standard inter-dependencies

### Out of Scope
- How to facilitate decisions (handled by facilitation-guides)
- Output format (handled by standards-templates)

---

## Technical Context

### File Location
`.specsmd/aidlc/templates/standards/catalog.yaml`

---

## Implementation Details

### Full Catalog Schema

```yaml
# Standards Catalog
# Defines what standards exist, their decisions, and relationships

standards:
  tech-stack:
    description: Technology choices for the project
    facilitation: templates/standards/tech-stack.guide.md
    output_path: standards/tech-stack.md
    importance: critical
    sections:
      - header: Overview
        type: static
        content: "Core technology decisions for this project."
      - type: from_decisions
    decisions:
      - id: languages
        display_name: Languages
        category: core
        importance: critical
        depends_on: []

      - id: framework
        display_name: Framework
        category: core
        importance: critical
        depends_on: [languages]

      - id: database
        display_name: Database
        category: data
        importance: high
        optional: true
        depends_on: [languages]

      - id: orm
        display_name: ORM / Database Client
        category: data
        importance: medium
        optional: true
        depends_on: [database, languages]

      - id: authentication
        display_name: Authentication
        category: security
        importance: high
        optional: true
        depends_on: [framework]

      - id: infrastructure
        display_name: Infrastructure & Deployment
        category: deployment
        importance: high
        depends_on: [framework]

      - id: package_manager
        display_name: Package Manager
        category: tooling
        importance: medium
        depends_on: [languages]

  coding-standards:
    description: Code style, patterns, and quality standards
    facilitation: templates/standards/coding-standards.guide.md
    output_path: standards/coding-standards.md
    importance: critical
    depends_on_standards: [tech-stack]
    decisions:
      - id: formatting
        display_name: Code Formatting
        category: style
        importance: high

      - id: linting
        display_name: Linting Rules
        category: quality
        importance: high

      - id: naming_conventions
        display_name: Naming Conventions
        category: style
        importance: high

      - id: file_organization
        display_name: File & Folder Organization
        category: structure
        importance: high

      - id: testing_strategy
        display_name: Testing Strategy
        category: quality
        importance: critical

      - id: error_handling
        display_name: Error Handling Patterns
        category: patterns
        importance: high

      - id: logging
        display_name: Logging Standards
        category: observability
        importance: medium

  system-architecture:
    description: High-level system design and architectural patterns
    facilitation: templates/standards/system-architecture.guide.md
    output_path: standards/system-architecture.md
    importance: high
    optional: true
    depends_on_standards: [tech-stack]
    decisions:
      - id: architecture_style
        display_name: Architecture Style
        category: structure
        importance: critical

      - id: api_design
        display_name: API Design
        category: communication
        importance: high
        optional: true

      - id: state_management
        display_name: State Management
        category: data
        importance: high
        optional: true

      - id: caching_strategy
        display_name: Caching Strategy
        category: performance
        importance: medium
        optional: true

      - id: security_patterns
        display_name: Security Patterns
        category: security
        importance: high

  ux-guide:
    description: UI/UX patterns and design system choices
    facilitation: templates/standards/ux-guide.guide.md
    output_path: standards/ux-guide.md
    importance: medium
    optional: true
    depends_on_standards: [tech-stack]
    decisions:
      - id: design_system
        display_name: Design System / Component Library
        category: ui
        importance: high

      - id: styling_approach
        display_name: Styling Approach
        category: ui
        importance: high

      - id: accessibility
        display_name: Accessibility Standards
        category: compliance
        importance: high

      - id: responsive_strategy
        display_name: Responsive Design Strategy
        category: ui
        importance: medium

  api-conventions:
    description: API design conventions and standards
    facilitation: templates/standards/api-conventions.guide.md
    output_path: standards/api-conventions.md
    importance: medium
    optional: true
    depends_on_standards: [tech-stack]
    decisions:
      - id: api_style
        display_name: API Style
        category: design
        importance: critical

      - id: versioning
        display_name: API Versioning
        category: design
        importance: medium

      - id: response_format
        display_name: Response Format
        category: format
        importance: high

      - id: error_format
        display_name: Error Response Format
        category: format
        importance: high

      - id: pagination
        display_name: Pagination Strategy
        category: design
        importance: medium
        optional: true

# Project type presets
project_types:
  full-stack-web:
    description: Full-stack web application
    required_standards:
      - tech-stack
      - coding-standards
    recommended_standards:
      - system-architecture
      - ux-guide
      - api-conventions

  backend-api:
    description: Backend API service
    required_standards:
      - tech-stack
      - coding-standards
    recommended_standards:
      - system-architecture
      - api-conventions

  frontend-app:
    description: Frontend application (SPA/SSR)
    required_standards:
      - tech-stack
      - coding-standards
    recommended_standards:
      - ux-guide

  cli-tool:
    description: Command-line tool
    required_standards:
      - tech-stack
      - coding-standards
    recommended_standards: []

  library:
    description: Reusable library/package
    required_standards:
      - tech-stack
      - coding-standards
    recommended_standards:
      - api-conventions
```

### Standard Definition Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | Yes | Human-readable description |
| `facilitation` | string | Yes | Path to facilitation guide |
| `output_path` | string | Yes | Where to write generated standard |
| `importance` | enum | Yes | critical, high, medium |
| `optional` | boolean | No | If true, can be skipped |
| `depends_on_standards` | array | No | Standards that must be completed first |
| `sections` | array | No | Output structure definition |
| `decisions` | array | Yes | List of decisions in this standard |

### Decision Definition Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (snake_case) |
| `display_name` | string | Yes | Human-readable name |
| `category` | string | Yes | Grouping category |
| `importance` | enum | Yes | critical, high, medium |
| `optional` | boolean | No | If true, can be skipped |
| `depends_on` | array | No | Decision IDs that must be answered first |

### Project Type Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | Yes | Project type description |
| `required_standards` | array | Yes | Standards that must be created |
| `recommended_standards` | array | Yes | Optional but suggested standards |

---

## Decision Ordering

Decisions are processed in dependency order:

```
1. Languages (no dependencies)
2. Framework (depends on: languages)
3. Package Manager (depends on: languages)
4. Database (depends on: languages)
5. ORM (depends on: database, languages)
6. Authentication (depends on: framework)
7. Infrastructure (depends on: framework)
```

---

## Acceptance Criteria

### AC-1: Standard Discovery
- GIVEN Master Agent runs project-init
- WHEN catalog.yaml is read
- THEN all standards are available for selection
- AND importance levels are respected

### AC-2: Decision Dependencies
- GIVEN tech-stack standard being facilitated
- WHEN framework decision is reached
- THEN languages decision has already been made
- AND framework options are filtered by language

### AC-3: Project Type Preset
- GIVEN user selects "backend-api" project type
- WHEN standards are determined
- THEN tech-stack and coding-standards are required
- AND system-architecture and api-conventions are recommended
