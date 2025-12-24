# Unit Brief: Master Agent

## Overview

The Master Agent is the central orchestrator of the specsmd system. It analyzes project state, routes users to specialist agents, and facilitates project initialization through a comprehensive standards system.

---

## Scope

### In Scope
- Agent persona and definition
- Project state analysis (analyze-context skill)
- User routing to specialist agents (route-request skill)
- AI-DLC explanation (explain-flow skill)
- Project/process Q&A (answer-question skill)
- Project initialization via standards (project-init skill)

### Out of Scope
- Inception phase execution (Inception Agent)
- Construction phase execution (Construction Agent)
- Operations phase execution (Operations Agent)

---

## Technical Context

### Entry Points
- `/specsmd-master-agent` - Activate Master Agent (the ONLY command - no aliases)

### Dependencies
- Memory Bank schema (`memory-bank.yaml`)
- Memory Bank artifacts (intents, units, bolts)
- Standards catalog (`templates/standards/catalog.yaml`)
- Facilitation guides (`templates/standards/*.guide.md`)

### Outputs
- Project health dashboard
- Routing recommendations
- Initialized standards files in `memory-bank/standards/`

---

## Standards System (project-init skill)

The project-init skill uses a three-tier architecture to create project standards:

### 1. Standards Catalog (`catalog.yaml`)

The catalog is the registry of all available standards and their configuration.

**Location**: `.specsmd/aidlc/templates/standards/catalog.yaml`

**Structure**:
```yaml
standards:
  tech-stack:
    description: Technology choices for the project
    facilitation: templates/standards/tech-stack.guide.md
    output_path: standards/tech-stack.md
    importance: critical
    decisions:
      - id: languages
        display_name: Languages
        category: core
        importance: critical
        depends_on: []
      - id: framework
        display_name: Framework
        depends_on: [languages]
      # ... more decisions

project_types:
  full-stack-web:
    required_standards: [tech-stack, coding-standards]
    recommended_standards: [system-architecture, ux-guide, api-conventions]
  # ... more project types
```

**Key Concepts**:
- **Standards**: High-level categories (tech-stack, coding-standards, system-architecture, ux-guide, api-conventions)
- **Decisions**: Individual choices within a standard (languages, framework, database, etc.)
- **Dependencies**: Decisions can depend on other decisions (`framework` depends on `languages`)
- **Importance**: critical, high, medium - determines required vs optional
- **Project Types**: Presets that define which standards to create based on project type

### 2. Facilitation Guides (`*.guide.md`)

Guides are conversational prompts that help the Master Agent facilitate standards decisions with the user.

**Location**: `.specsmd/aidlc/templates/standards/{standard-name}.guide.md`

**Purpose**:
- Guide discovery through conversation, not forms
- Adapt communication style based on user expertise
- Surface tradeoffs the user may not have considered
- Capture rationale, not just the choice

**Structure**:
```markdown
# {Standard Name} Facilitation Guide

## Purpose
Why this standard matters

## Facilitation Approach
How to have the conversation

## Discovery Areas
### 1. {Decision Area}
**Goal**: What we're trying to understand
**Explore**: Questions to ask
**Guide by use case**: Recommendations table
**Validate**: Confirm understanding before moving on

## Completing the Discovery
Summary template

## Output Generation
Template for the final standard file
```

**Available Guides**:
- `tech-stack.guide.md` - Technology choices (languages, framework, database, ORM, auth, infrastructure)
- `coding-standards.guide.md` - Code style (formatting, linting, naming, testing, error handling, logging)
- `system-architecture.guide.md` - Architecture patterns (style, API design, state management, caching, security)
- `ux-guide.guide.md` - UI/UX patterns (design system, styling, accessibility, responsive)
- `api-conventions.guide.md` - API design (style, versioning, response format, errors, pagination)

### 3. Generated Standards (Output)

The final output files created in `memory-bank/standards/`.

**Location**: `memory-bank/standards/{standard-name}.md`

**Example tech-stack.md**:
```markdown
# Tech Stack

## Overview
Core technology decisions for this project.

## Languages
TypeScript

Node.js runtime with TypeScript for type safety and modern tooling.

## Framework
Next.js 14

Full-stack React framework with App Router for SSR/SSG capabilities.

## Database
PostgreSQL (via Supabase)

Managed PostgreSQL with real-time subscriptions and auth integration.

## ORM / Database Client
Prisma

Type-safe database access with excellent Next.js integration.

## Authentication
Supabase Auth

Integrated auth with social providers and row-level security.

## Infrastructure & Deployment
Vercel

Optimized for Next.js with automatic deployments and edge functions.

## Package Manager
pnpm

Fast, disk-efficient package manager with monorepo support.
```

### Project Initialization Flow

```
User invokes /specsmd-master-agent (redirected to project-init for uninitialized projects)
         │
         ▼
Master Agent reads catalog.yaml
         │
         ▼
Agent asks: "What type of project?" (shows project_types)
         │
         ▼
Based on project type, determine required/recommended standards
         │
         ▼
For each required standard:
    │
    ├── Read facilitation guide
    │
    ├── Have guided conversation with user
    │
    ├── Capture decisions and rationale
    │
    └── Generate standard file to memory-bank/standards/
         │
         ▼
Offer to facilitate recommended (optional) standards
         │
         ▼
Project initialization complete
```

---

## Implementation Notes

### Persona Characteristics
- Role: AI-DLC Flow Orchestrator & Project Navigator
- Communication Style: Concise and directive (for routing), conversational and adaptive (for standards)
- Principle: Route based on project state, not user guesses

### Critical Actions
1. ALWAYS read `memory-bank.yaml` first
2. READ project state before routing
3. ANALYZE before routing - never send to wrong agent
4. NEVER assume project state - verify by reading files
5. For project-init: READ catalog.yaml, then use appropriate guide
6. CAPTURE rationale for decisions, not just the choices
7. ADAPT communication style based on user's expertise level

### Output Formatting Requirements
All agent outputs MUST follow the output formatting standards:
- 🚫 **NEVER** use ASCII tables for options
- ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`
- ✅ **ALWAYS** use status indicators: ✅ (done) ⏳ (current) [ ] (pending) 🚫 (blocked)
- ✅ **ALWAYS** end with suggested next step pattern

See `specs/standards/output-formatting.md` for complete specification.

---

## Full catalog.yaml Reference

The complete standards catalog file for implementation reference:

```yaml
# Standards Catalog
# Defines what standards exist, their decisions, and relationships.
# Each standard has a facilitation guide in templates/standards/

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
    sections:
      - header: Overview
        type: static
        content: "Code style and quality standards for this project."
      - type: from_decisions
    decisions:
      - id: formatting
        display_name: Code Formatting
        category: style
        importance: high
        depends_on: []

      - id: linting
        display_name: Linting Rules
        category: quality
        importance: high
        depends_on: []

      - id: naming_conventions
        display_name: Naming Conventions
        category: style
        importance: high
        depends_on: []

      - id: file_organization
        display_name: File & Folder Organization
        category: structure
        importance: high
        depends_on: []

      - id: testing_strategy
        display_name: Testing Strategy
        category: quality
        importance: critical
        depends_on: []

      - id: error_handling
        display_name: Error Handling Patterns
        category: patterns
        importance: high
        depends_on: []

      - id: logging
        display_name: Logging Standards
        category: observability
        importance: medium
        depends_on: []

  system-architecture:
    description: High-level system design and architectural patterns
    facilitation: templates/standards/system-architecture.guide.md
    output_path: standards/system-architecture.md
    importance: high
    optional: true
    depends_on_standards: [tech-stack]
    sections:
      - header: Overview
        type: static
        content: "High-level architectural decisions and patterns."
      - type: from_decisions
    decisions:
      - id: architecture_style
        display_name: Architecture Style
        category: structure
        importance: critical
        depends_on: []

      - id: api_design
        display_name: API Design
        category: communication
        importance: high
        optional: true
        depends_on: []

      - id: state_management
        display_name: State Management
        category: data
        importance: high
        optional: true
        depends_on: []

      - id: caching_strategy
        display_name: Caching Strategy
        category: performance
        importance: medium
        optional: true
        depends_on: []

      - id: security_patterns
        display_name: Security Patterns
        category: security
        importance: high
        depends_on: []

  ux-guide:
    description: UI/UX patterns and design system choices
    facilitation: templates/standards/ux-guide.guide.md
    output_path: standards/ux-guide.md
    importance: medium
    optional: true
    depends_on_standards: [tech-stack]
    sections:
      - header: Overview
        type: static
        content: "UI/UX standards and design system choices."
      - type: from_decisions
    decisions:
      - id: design_system
        display_name: Design System / Component Library
        category: ui
        importance: high
        depends_on: []

      - id: styling_approach
        display_name: Styling Approach
        category: ui
        importance: high
        depends_on: []

      - id: accessibility
        display_name: Accessibility Standards
        category: compliance
        importance: high
        depends_on: []

      - id: responsive_strategy
        display_name: Responsive Design Strategy
        category: ui
        importance: medium
        depends_on: []

  api-conventions:
    description: API design conventions and standards
    facilitation: templates/standards/api-conventions.guide.md
    output_path: standards/api-conventions.md
    importance: medium
    optional: true
    depends_on_standards: [tech-stack]
    sections:
      - header: Overview
        type: static
        content: "API design conventions and response formats."
      - type: from_decisions
    decisions:
      - id: api_style
        display_name: API Style
        category: design
        importance: critical
        depends_on: []

      - id: versioning
        display_name: API Versioning
        category: design
        importance: medium
        depends_on: []

      - id: response_format
        display_name: Response Format
        category: format
        importance: high
        depends_on: []

      - id: error_format
        display_name: Error Response Format
        category: format
        importance: high
        depends_on: []

      - id: pagination
        display_name: Pagination Strategy
        category: design
        importance: medium
        optional: true
        depends_on: []

# Project type presets - determines which standards to create
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

---

## Acceptance Criteria

### AC-1: Context Analysis
- GIVEN Master Agent is invoked
- WHEN reading project state
- THEN agent correctly identifies current phase (none, inception, construction, operations)
- AND provides accurate routing recommendation

### AC-2: Routing Accuracy
- GIVEN project has intents but no bolts started
- WHEN user asks "what should I do next"
- THEN agent routes to Inception Agent for story/bolt planning

### AC-3: Project Initialization
- GIVEN fresh project with no standards
- WHEN user invokes project-init
- THEN agent reads catalog.yaml
- AND asks project type
- AND facilitates required standards based on type
- AND generates standard files in memory-bank/standards/

### AC-4: Standards Facilitation
- GIVEN project-init in progress
- WHEN facilitating tech-stack standard
- THEN agent follows tech-stack.guide.md
- AND adapts communication to user expertise
- AND captures both decisions AND rationale
- AND generates tech-stack.md with all decisions
